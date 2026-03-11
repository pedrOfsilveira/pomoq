import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as Sentry from '@sentry/vue'
import { supabase } from '@/lib/supabase'
import { withTimeout, DEFAULT_TIMEOUT_MS } from '@/utils/timeout'
import { useAuthStore } from './auth'
import type { EnergyLevel, ErrorReviewRecord, ErrorReason } from '@/types/database'

interface SessionSummary {
  id: string
  started_at: string
  ended_at: string | null
  total_questions: number
  total_correct: number
  total_cycles: number
  total_answer_duration_seconds: number
  final_energy: EnergyLevel | null
}

interface CycleSummary {
  id: string
  session_id: string
  cycle_number: number
  discipline: string
  questions_done: number
  questions_correct: number
  answer_duration_seconds: number
  energy_before: EnergyLevel | null
  energy_after: EnergyLevel | null
  started_at: string
  error_reviews: ErrorReviewRecord[] | null
}

export interface ErrorReasonStat {
  discipline: string
  attention: number
  content_gap: number
  interpretation: number
  total: number
  topReason: ErrorReason
  contentNotes: string[]
}

interface DailyStats {
  date: string
  totalQuestions: number
  totalCorrect: number
  sessions: number
}

interface DisciplineStats {
  discipline: string
  totalQuestions: number
  totalCorrect: number
  accuracy: number
  cycles: number
}

interface EnergyTrend {
  date: string
  green: number
  yellow: number
  red: number
  total: number
}

interface WeeklyVolume {
  weekLabel: string
  totalQuestions: number
  totalCorrect: number
  sessions: number
}

export const useHistoryStore = defineStore('history', () => {
  const auth = useAuthStore()
  const sessions = ref<SessionSummary[]>([])
  const cycles = ref<CycleSummary[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const totalStudySessions = computed(() => sessions.value.length)

  const totalQuestionsAnswered = computed(() =>
    sessions.value.reduce((sum, s) => sum + s.total_questions, 0),
  )

  const totalCorrectAnswers = computed(() =>
    sessions.value.reduce((sum, s) => sum + s.total_correct, 0),
  )

  const overallAccuracy = computed(() => {
    const total = totalQuestionsAnswered.value
    const correct = totalCorrectAnswers.value
    return total > 0 ? Math.round((correct / total) * 100) : 0
  })

  const totalCyclesCompleted = computed(() =>
    sessions.value.reduce((sum, s) => sum + s.total_cycles, 0),
  )

  const totalAnswerDurationSeconds = computed(() =>
    sessions.value.reduce((sum, s) => sum + s.total_answer_duration_seconds, 0),
  )

  const avgQuestionsPerSession = computed(() => {
    if (sessions.value.length === 0) return 0
    return Math.round(totalQuestionsAnswered.value / sessions.value.length)
  })

  const avgAnswerSecondsPerQuestion = computed(() => {
    if (totalQuestionsAnswered.value === 0) return 0
    return Math.round(totalAnswerDurationSeconds.value / totalQuestionsAnswered.value)
  })

  const studyStreak = computed(() => {
    if (sessions.value.length === 0) return 0
    const dates = new Set(sessions.value.map((s) => s.started_at.split('T')[0]!))
    const sortedDates = Array.from(dates).sort((a, b) => b.localeCompare(a))

    const today = new Date().toISOString().split('T')[0]!
    if (!sortedDates.includes(today)) {
      const yesterday = new Date(Date.now() - 86400_000).toISOString().split('T')[0]!
      if (!sortedDates.includes(yesterday)) return 0
    }

    let streak = 0
    let checkDate = new Date()
    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toISOString().split('T')[0]!
      if (dates.has(dateStr)) {
        streak++
      } else if (i > 0) {
        break
      }
      checkDate = new Date(checkDate.getTime() - 86400_000)
    }
    return streak
  })

  const dailyStats = computed<DailyStats[]>(() => {
    const map = new Map<string, DailyStats>()
    for (const s of sessions.value) {
      const date = s.started_at.split('T')[0]!
      const existing = map.get(date)
      if (existing) {
        existing.totalQuestions += s.total_questions
        existing.totalCorrect += s.total_correct
        existing.sessions++
      } else {
        map.set(date, {
          date,
          totalQuestions: s.total_questions,
          totalCorrect: s.total_correct,
          sessions: 1,
        })
      }
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date))
  })

  const disciplineStats = computed<DisciplineStats[]>(() => {
    const map = new Map<string, DisciplineStats>()
    for (const c of cycles.value) {
      const existing = map.get(c.discipline)
      if (existing) {
        existing.totalQuestions += c.questions_done
        existing.totalCorrect += c.questions_correct
        existing.cycles++
        existing.accuracy =
          existing.totalQuestions > 0
            ? Math.round((existing.totalCorrect / existing.totalQuestions) * 100)
            : 0
      } else {
        map.set(c.discipline, {
          discipline: c.discipline,
          totalQuestions: c.questions_done,
          totalCorrect: c.questions_correct,
          accuracy:
            c.questions_done > 0 ? Math.round((c.questions_correct / c.questions_done) * 100) : 0,
          cycles: 1,
        })
      }
    }
    return Array.from(map.values()).sort((a, b) => b.totalQuestions - a.totalQuestions)
  })

  const energyTrend = computed<EnergyTrend[]>(() => {
    const map = new Map<string, EnergyTrend>()
    for (const c of cycles.value) {
      if (!c.energy_after) continue
      const date = c.started_at.split('T')[0]!
      const existing = map.get(date) || { date, green: 0, yellow: 0, red: 0, total: 0 }
      existing[c.energy_after]++
      existing.total++
      map.set(date, existing)
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date))
  })

  const weeklyVolume = computed<WeeklyVolume[]>(() => {
    const weeks: WeeklyVolume[] = []
    const now = new Date()
    for (let w = 7; w >= 0; w--) {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay() - w * 7)
      weekStart.setHours(0, 0, 0, 0)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 7)

      const weekSessions = sessions.value.filter((s) => {
        const d = new Date(s.started_at)
        return d >= weekStart && d < weekEnd
      })

      const startStr = weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      weeks.push({
        weekLabel: startStr,
        totalQuestions: weekSessions.reduce((sum, s) => sum + s.total_questions, 0),
        totalCorrect: weekSessions.reduce((sum, s) => sum + s.total_correct, 0),
        sessions: weekSessions.length,
      })
    }
    return weeks
  })

  const accuracyTrend = computed(() => {
    return dailyStats.value.slice(-14).map((d) => ({
      date: d.date,
      accuracy: d.totalQuestions > 0 ? Math.round((d.totalCorrect / d.totalQuestions) * 100) : 0,
      questions: d.totalQuestions,
    }))
  })

  const errorReasonStats = computed<ErrorReasonStat[]>(() => {
    const map = new Map<string, ErrorReasonStat>()
    for (const c of cycles.value) {
      if (!c.error_reviews || c.error_reviews.length === 0) continue
      for (const review of c.error_reviews) {
        let stat = map.get(c.discipline)
        if (!stat) {
          stat = {
            discipline: c.discipline,
            attention: 0,
            content_gap: 0,
            interpretation: 0,
            total: 0,
            topReason: review.errorReason,
            contentNotes: [],
          }
          map.set(c.discipline, stat)
        }
        stat[review.errorReason]++
        stat.total++
        if (review.errorReason === 'content_gap' && review.contentNote) {
          const note = review.contentNote.trim()
          if (note && !stat.contentNotes.includes(note)) {
            stat.contentNotes.push(note)
          }
        }
      }
    }
    for (const stat of map.values()) {
      const reasons: ErrorReason[] = ['attention', 'content_gap', 'interpretation']
      stat.topReason = reasons.reduce((a, b) => (stat[a] >= stat[b] ? a : b))
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total)
  })

  const bestDiscipline = computed(() => {
    if (disciplineStats.value.length === 0) return null
    return disciplineStats.value.reduce((best, d) =>
      d.accuracy > best.accuracy && d.totalQuestions >= 3 ? d : best,
    )
  })

  const worstDiscipline = computed(() => {
    if (disciplineStats.value.length === 0) return null
    const withEnoughData = disciplineStats.value.filter((d) => d.totalQuestions >= 3)
    if (withEnoughData.length === 0) return null
    return withEnoughData.reduce((worst, d) => (d.accuracy < worst.accuracy ? d : worst))
  })

  async function fetchSessions() {
    if (!auth.user) return
    loading.value = true
    error.value = null
    try {
      const sessionsResult = await withTimeout(
        supabase
          .from('study_sessions')
          .select('id, started_at, ended_at, total_questions, total_correct, total_cycles, total_answer_duration_seconds, final_energy')
          .eq('user_id', auth.user.id)
          .order('started_at', { ascending: false })
          .limit(100),
        DEFAULT_TIMEOUT_MS,
        'History sessions fetch timed out',
      )

      if (sessionsResult.error) throw sessionsResult.error
      sessions.value = (sessionsResult.data ?? []) as SessionSummary[]

      const sessionIds = sessions.value.map((s) => s.id)
      if (sessionIds.length === 0) {
        cycles.value = []
        return
      }

      const cyclesResult = await withTimeout(
        supabase
          .from('cycles')
          .select(
            'id, session_id, cycle_number, discipline, questions_done, questions_correct, answer_duration_seconds, energy_before, energy_after, started_at, error_reviews',
          )
          .in('session_id', sessionIds)
          .order('started_at', { ascending: false })
          .limit(500),
        DEFAULT_TIMEOUT_MS,
        'History cycles fetch timed out',
      )

      if (cyclesResult.error) throw cyclesResult.error
      cycles.value = (cyclesResult.data ?? []) as CycleSummary[]
    } catch (e: any) {
      Sentry.captureException(e)
      error.value = e?.message || 'Falha ao carregar histórico'
      sessions.value = []
      cycles.value = []
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    sessions,
    cycles,
    loading,
    error,
    totalStudySessions,
    totalQuestionsAnswered,
    totalCorrectAnswers,
    overallAccuracy,
    totalCyclesCompleted,
    totalAnswerDurationSeconds,
    avgQuestionsPerSession,
    avgAnswerSecondsPerQuestion,
    studyStreak,
    dailyStats,
    disciplineStats,
    energyTrend,
    weeklyVolume,
    accuracyTrend,
    errorReasonStats,
    bestDiscipline,
    worstDiscipline,
    fetchSessions,
  }
})
