import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'
import type { EnergyLevel } from '@/types/database'

export type SessionPhase =
  | 'idle' // No session active
  | 'setup' // Configuring session
  | 'studying' // Answering questions
  | 'checkin' // Energy check-in after cycle
  | 'break' // Break time
  | 'review' // Reviewing errors
  | 'finished' // Session ended

export interface CycleState {
  id: string | null
  cycleNumber: number
  discipline: string
  questionsTarget: number
  questionsDone: number
  questionsCorrect: number
  energyBefore: EnergyLevel | null
  startedAt: string | null
}

export const useSessionStore = defineStore('session', () => {
  const auth = useAuthStore()

  // Session state
  const sessionId = ref<string | null>(null)
  const phase = ref<SessionPhase>('idle')
  const disciplines = ref<string[]>([])
  const questionsPerBlock = ref(5)
  const currentDisciplineIndex = ref(0)
  const currentCycle = ref<CycleState | null>(null)
  const totalCycles = ref(0)
  const totalQuestions = ref(0)
  const totalCorrect = ref(0)
  const lastEnergy = ref<EnergyLevel | null>(null)

  // Break timer
  const breakSeconds = ref(0)
  const breakTarget = ref(300) // 5 min default
  let breakInterval: ReturnType<typeof setInterval> | null = null

  // Computed
  const currentDiscipline = computed(() => disciplines.value[currentDisciplineIndex.value] || '')

  const progress = computed(() => {
    if (!currentCycle.value) return 0
    return currentCycle.value.questionsTarget > 0
      ? (currentCycle.value.questionsDone / currentCycle.value.questionsTarget) * 100
      : 0
  })

  const questionsRemaining = computed(() => {
    if (!currentCycle.value) return 0
    return currentCycle.value.questionsTarget - currentCycle.value.questionsDone
  })

  const accuracy = computed(() => {
    if (!currentCycle.value || currentCycle.value.questionsDone === 0) return 0
    return Math.round(
      (currentCycle.value.questionsCorrect / currentCycle.value.questionsDone) * 100,
    )
  })

  // Calculate questions for next block based on energy
  function getAdjustedQuestions(energy: EnergyLevel, baseQuestions: number): number {
    switch (energy) {
      case 'green':
        return Math.min(baseQuestions + 2, 10) // Feeling good, push a bit
      case 'yellow':
        return baseQuestions // Maintain
      case 'red':
        return Math.max(baseQuestions - 2, 2) // Reduce load
      default:
        return baseQuestions
    }
  }

  // Get break duration based on energy
  function getBreakDuration(energy: EnergyLevel): number {
    switch (energy) {
      case 'green':
        return 3 * 60 // 3 min
      case 'yellow':
        return 5 * 60 // 5 min
      case 'red':
        return 10 * 60 // 10 min
      default:
        return 5 * 60
    }
  }

  // Start a new study session
  async function startSession(config: { disciplines: string[]; questionsPerBlock: number }) {
    if (!auth.user) throw new Error('Faça login antes de iniciar uma sessão')

    const { data, error } = await supabase
      .from('study_sessions')
      .insert({ user_id: auth.user.id })
      .select()
      .limit(1)

    if (error) throw error
    if (!data || data.length === 0) throw new Error('Falha ao criar sessão')

    sessionId.value = data[0]!.id
    disciplines.value = config.disciplines
    questionsPerBlock.value = config.questionsPerBlock
    currentDisciplineIndex.value = 0
    totalCycles.value = 0
    totalQuestions.value = 0
    totalCorrect.value = 0
    lastEnergy.value = null

    await startNewCycle()
  }

  // Start a new cycle within the session
  async function startNewCycle() {
    if (!sessionId.value) return

    const cycleNum = totalCycles.value + 1
    const discipline = disciplines.value[currentDisciplineIndex.value] || disciplines.value[0]!
    const target = lastEnergy.value
      ? getAdjustedQuestions(lastEnergy.value, questionsPerBlock.value)
      : questionsPerBlock.value

    const { data, error } = await supabase
      .from('cycles')
      .insert({
        session_id: sessionId.value,
        cycle_number: cycleNum,
        discipline,
        questions_target: target,
        energy_before: lastEnergy.value,
      })
      .select()
      .limit(1)

    if (error) throw error
    if (!data || data.length === 0) throw new Error('Falha ao criar ciclo')

    currentCycle.value = {
      id: data[0]!.id,
      cycleNumber: cycleNum,
      discipline,
      questionsTarget: target,
      questionsDone: 0,
      questionsCorrect: 0,
      energyBefore: lastEnergy.value,
      startedAt: data[0]!.started_at,
    }

    phase.value = 'studying'
  }

  // Record an answer
  async function recordAnswer(correct: boolean) {
    if (!currentCycle.value || !currentCycle.value.id) return

    currentCycle.value.questionsDone++
    if (correct) currentCycle.value.questionsCorrect++
    totalQuestions.value++
    if (correct) totalCorrect.value++

    // Update in database
    await supabase
      .from('cycles')
      .update({
        questions_done: currentCycle.value.questionsDone,
        questions_correct: currentCycle.value.questionsCorrect,
      })
      .eq('id', currentCycle.value.id)

    // Check if cycle is complete
    if (currentCycle.value.questionsDone >= currentCycle.value.questionsTarget) {
      phase.value = 'checkin'
    }
  }

  // Submit energy check-in
  async function submitCheckin(energy: EnergyLevel, note?: string) {
    if (!auth.user || !sessionId.value || !currentCycle.value) return

    // Save check-in
    await supabase.from('energy_checkins').insert({
      user_id: auth.user.id,
      session_id: sessionId.value,
      cycle_id: currentCycle.value.id,
      energy_level: energy,
      note: note || null,
    })

    // Update cycle with energy_after
    if (currentCycle.value.id) {
      await supabase
        .from('cycles')
        .update({
          energy_after: energy,
          ended_at: new Date().toISOString(),
        })
        .eq('id', currentCycle.value.id)
    }

    lastEnergy.value = energy
    totalCycles.value++

    // Update session totals
    await supabase
      .from('study_sessions')
      .update({
        total_questions: totalQuestions.value,
        total_correct: totalCorrect.value,
        total_cycles: totalCycles.value,
      })
      .eq('id', sessionId.value)

    // If red energy, suggest ending or taking long break
    if (energy === 'red') {
      breakTarget.value = getBreakDuration(energy)
      phase.value = 'break'
      return
    }

    // Start break
    breakTarget.value = getBreakDuration(energy)
    phase.value = 'break'
  }

  // Start break timer
  function startBreak() {
    breakSeconds.value = 0
    if (breakInterval) clearInterval(breakInterval)
    breakInterval = setInterval(() => {
      breakSeconds.value++
    }, 1000)
  }

  // End break and move to next cycle
  function endBreak() {
    if (breakInterval) {
      clearInterval(breakInterval)
      breakInterval = null
    }

    // Rotate to next discipline
    currentDisciplineIndex.value = (currentDisciplineIndex.value + 1) % disciplines.value.length

    startNewCycle()
  }

  // End the session
  async function endSession() {
    if (!sessionId.value) return

    if (breakInterval) {
      clearInterval(breakInterval)
      breakInterval = null
    }

    // If no questions were answered, discard the session entirely
    if (totalQuestions.value === 0) {
      // Delete orphan cycle(s) and the empty session
      if (currentCycle.value?.id) {
        await supabase.from('cycles').delete().eq('id', currentCycle.value.id)
      }
      await supabase.from('study_sessions').delete().eq('id', sessionId.value)
      reset()
      return
    }

    // Close current cycle if open
    if (currentCycle.value?.id) {
      await supabase
        .from('cycles')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', currentCycle.value.id)
    }

    // Update session
    await supabase
      .from('study_sessions')
      .update({
        ended_at: new Date().toISOString(),
        total_questions: totalQuestions.value,
        total_correct: totalCorrect.value,
        total_cycles: totalCycles.value,
        final_energy: lastEnergy.value,
      })
      .eq('id', sessionId.value)

    phase.value = 'finished'
  }

  // Reset store
  function reset() {
    if (breakInterval) {
      clearInterval(breakInterval)
      breakInterval = null
    }
    sessionId.value = null
    phase.value = 'idle'
    disciplines.value = []
    questionsPerBlock.value = 5
    currentDisciplineIndex.value = 0
    currentCycle.value = null
    totalCycles.value = 0
    totalQuestions.value = 0
    totalCorrect.value = 0
    lastEnergy.value = null
    breakSeconds.value = 0
  }

  return {
    sessionId,
    phase,
    disciplines,
    questionsPerBlock,
    currentDisciplineIndex,
    currentCycle,
    totalCycles,
    totalQuestions,
    totalCorrect,
    lastEnergy,
    breakSeconds,
    breakTarget,
    currentDiscipline,
    progress,
    questionsRemaining,
    accuracy,
    getAdjustedQuestions,
    getBreakDuration,
    startSession,
    startNewCycle,
    recordAnswer,
    submitCheckin,
    startBreak,
    endBreak,
    endSession,
    reset,
  }
})
