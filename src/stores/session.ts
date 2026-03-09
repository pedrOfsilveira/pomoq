import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'
import type { EnergyLevel } from '@/types/database'

const STORAGE_KEY = 'pomoq_session'
const PREFS_KEY = 'pomoq_prefs'

export type SessionPhase =
  | 'idle' // No session active
  | 'setup' // Configuring session
  | 'studying' // Answering questions
  | 'review' // Reviewing errors after micro-cycle
  | 'checkin' // Energy check-in after cycle
  | 'break' // Break time
  | 'finished' // Session ended

export type ErrorReason = 'attention' | 'content_gap' | 'interpretation'

export interface ReviewEntry {
  correct: boolean
  errorReason?: ErrorReason
  contentNote?: string
}

export interface ErrorReview {
  questionIndex: number // 0-based index among all questions
  errorReason: ErrorReason
  contentNote?: string
}

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
  const forcedRest = ref(false)

  // ── User preferences (persisted separately, survive reset) ─────────────────
  const loopDisciplines = ref(false)

  function savePrefs() {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ loopDisciplines: loopDisciplines.value }))
    } catch {
      // ignore
    }
  }

  function loadPrefs() {
    try {
      const raw = localStorage.getItem(PREFS_KEY)
      if (!raw) return
      const p = JSON.parse(raw)
      loopDisciplines.value = p.loopDisciplines ?? false
    } catch {
      // ignore
    }
  }

  watch(loopDisciplines, savePrefs)
  loadPrefs()
  // ─────────────────────────────────────────────────────────────────────────

  // Per-cycle error reviews
  const cycleErrorReviews = ref<ErrorReview[]>([])

  // Break timer
  const breakSeconds = ref(0)
  const breakTarget = ref(300) // 5 min default
  let breakInterval: ReturnType<typeof setInterval> | null = null

  // ── LocalStorage persistence ────────────────────────────────────────────────

  function saveToStorage() {
    if (phase.value === 'idle') {
      localStorage.removeItem(STORAGE_KEY)
      return
    }
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          sessionId: sessionId.value,
          phase: phase.value,
          disciplines: disciplines.value,
          questionsPerBlock: questionsPerBlock.value,
          currentDisciplineIndex: currentDisciplineIndex.value,
          currentCycle: currentCycle.value,
          cycleErrorReviews: cycleErrorReviews.value,
          totalCycles: totalCycles.value,
          totalQuestions: totalQuestions.value,
          totalCorrect: totalCorrect.value,
          lastEnergy: lastEnergy.value,
          forcedRest: forcedRest.value,
          breakSeconds: breakSeconds.value,
          breakTarget: breakTarget.value,
        }),
      )
    } catch {
      // storage full or unavailable — silently ignore
    }
  }

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const s = JSON.parse(raw)
      sessionId.value = s.sessionId ?? null
      phase.value = s.phase ?? 'idle'
      disciplines.value = s.disciplines ?? []
      questionsPerBlock.value = s.questionsPerBlock ?? 5
      currentDisciplineIndex.value = s.currentDisciplineIndex ?? 0
      currentCycle.value = s.currentCycle ?? null
      cycleErrorReviews.value = s.cycleErrorReviews ?? []
      totalCycles.value = s.totalCycles ?? 0
      totalQuestions.value = s.totalQuestions ?? 0
      totalCorrect.value = s.totalCorrect ?? 0
      lastEnergy.value = s.lastEnergy ?? null
      forcedRest.value = s.forcedRest ?? false
      breakSeconds.value = s.breakSeconds ?? 0
      breakTarget.value = s.breakTarget ?? 300

      // Resume break timer if we were mid-break
      if (phase.value === 'break') {
        if (breakInterval) clearInterval(breakInterval)
        breakInterval = setInterval(() => {
          breakSeconds.value++
        }, 1000)
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  // Persist on every meaningful state change
  watch(
    [
      sessionId,
      phase,
      disciplines,
      questionsPerBlock,
      currentDisciplineIndex,
      currentCycle,
      cycleErrorReviews,
      totalCycles,
      totalQuestions,
      totalCorrect,
      lastEnergy,
      forcedRest,
      breakSeconds,
      breakTarget,
    ],
    saveToStorage,
    { deep: true },
  )

  // Restore on store creation
  loadFromStorage()

  // ───────────────────────────────────────────────────────────────────────────

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

    cycleErrorReviews.value = []

    phase.value = 'studying'
  }

  // Record a question being done (no correct/wrong — that happens in review)
  async function recordAnswer() {
    if (!currentCycle.value || !currentCycle.value.id) return
    // Guard: prevent incrementing past the target (race condition on rapid clicks)
    if (currentCycle.value.questionsDone >= currentCycle.value.questionsTarget) return

    currentCycle.value.questionsDone++
    totalQuestions.value++

    // Update in database
    await supabase
      .from('cycles')
      .update({ questions_done: currentCycle.value.questionsDone })
      .eq('id', currentCycle.value.id)

    // Cycle complete → always go to review
    if (currentCycle.value.questionsDone >= currentCycle.value.questionsTarget) {
      phase.value = 'review'
    }
  }

  // Submit per-question review (correct/wrong + error reasons) and proceed to check-in
  async function submitReview(reviews: ReviewEntry[]) {
    if (!currentCycle.value) return

    const correctCount = reviews.filter((r) => r.correct).length
    currentCycle.value.questionsCorrect = correctCount
    totalCorrect.value += correctCount

    // Build error reviews payload
    const errorReviews = reviews
      .map((r, i) => ({ ...r, questionIndex: i }))
      .filter((r) => !r.correct)
      .map((r) => ({
        questionIndex: r.questionIndex,
        errorReason: r.errorReason as ErrorReason,
        contentNote: r.contentNote,
      }))

    cycleErrorReviews.value = errorReviews

    // Persist to DB
    if (currentCycle.value.id) {
      await supabase
        .from('cycles')
        .update({ questions_correct: correctCount, error_reviews: errorReviews })
        .eq('id', currentCycle.value.id)
    }

    phase.value = 'checkin'
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

    // If red energy and cycle had ≤2 questions, there's nowhere left to reduce — end the session
    if (energy === 'red' && (currentCycle.value?.questionsTarget ?? 0) <= 2) {
      forcedRest.value = true
      await endSession()
      return
    }

    // Start break
    breakTarget.value = getBreakDuration(energy)
    startBreak()
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

  // End break and move to next cycle (or end the session after the last discipline)
  async function endBreak() {
    if (breakInterval) {
      clearInterval(breakInterval)
      breakInterval = null
    }

    const isLastDiscipline = currentDisciplineIndex.value >= disciplines.value.length - 1

    if (isLastDiscipline && !loopDisciplines.value) {
      // Default behaviour: end the session after the last discipline
      await endSession()
      return
    }

    // Rotate to next discipline (loop back to start when enabled)
    currentDisciplineIndex.value = loopDisciplines.value
      ? (currentDisciplineIndex.value + 1) % disciplines.value.length
      : currentDisciplineIndex.value + 1

    await startNewCycle()
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
    cycleErrorReviews.value = []
    totalCycles.value = 0
    totalQuestions.value = 0
    totalCorrect.value = 0
    lastEnergy.value = null
    forcedRest.value = false
    breakSeconds.value = 0
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    sessionId,
    phase,
    disciplines,
    questionsPerBlock,
    loopDisciplines,
    currentDisciplineIndex,
    currentCycle,
    cycleErrorReviews,
    totalCycles,
    totalQuestions,
    totalCorrect,
    lastEnergy,
    forcedRest,
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
    submitReview,
    submitCheckin,
    startBreak,
    endBreak,
    endSession,
    reset,
  }
})
