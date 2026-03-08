<script setup lang="ts">
import { onMounted, computed, watch } from 'vue'
import { useHistoryStore } from '@/stores/history'
import { useAuthStore } from '@/stores/auth'
import AccuracyLineChart from '@/components/charts/AccuracyLineChart.vue'
import WeeklyVolumeChart from '@/components/charts/WeeklyVolumeChart.vue'
import DisciplineDonutChart from '@/components/charts/DisciplineDonutChart.vue'
import EnergyTrendChart from '@/components/charts/EnergyTrendChart.vue'
import DailyVolumeChart from '@/components/charts/DailyVolumeChart.vue'
import { ChevronLeft, BarChart3 } from 'lucide-vue-next'

const history = useHistoryStore()
const auth = useAuthStore()

// Fetch sessions when the component mounts AND whenever auth becomes ready
onMounted(() => {
  if (auth.isAuthenticated) {
    history.fetchSessions()
  }
})

watch(
  () => auth.isAuthenticated,
  (ready) => {
    if (ready && history.sessions.length === 0) {
      history.fetchSessions()
    }
  },
)

// Greeting based on time
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
})

const hasData = computed(() => history.sessions.length > 0)
const hasChartData = computed(() => history.dailyStats.length >= 2)

// Discipline accuracy data for chart
const disciplineChartData = computed(() =>
  history.disciplineStats.map((d) => ({
    discipline: d.discipline,
    totalQuestions: d.totalQuestions,
    accuracy: d.accuracy,
  })),
)

// Best discipline colored badge
const bestColor = computed(() => {
  if (!history.bestDiscipline) return ''
  if (history.bestDiscipline.accuracy >= 80) return 'text-energy-green'
  if (history.bestDiscipline.accuracy >= 60) return 'text-energy-yellow'
  return 'text-energy-red'
})
const worstColor = computed(() => {
  if (!history.worstDiscipline) return ''
  if (history.worstDiscipline.accuracy >= 80) return 'text-energy-green'
  if (history.worstDiscipline.accuracy >= 60) return 'text-energy-yellow'
  return 'text-energy-red'
})
</script>

<template>
  <div class="flex-1 flex flex-col items-center px-4 py-6">
    <div class="w-full max-w-[620px]">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-6">
        <router-link to="/" class="text-white/60 hover:text-white transition-colors">
          <ChevronLeft class="w-5 h-5" :stroke-width="2" />
        </router-link>
        <div>
          <h1 class="text-2xl font-bold text-white">Dashboard</h1>
          <p class="text-white/70 text-sm">{{ greeting }}, {{ auth.displayName }}!</p>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="history.loading" class="text-center py-16">
        <div
          class="inline-block w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4"
        />
        <p class="text-white/50">Carregando dados...</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="!hasData" class="text-center py-16">
        <BarChart3 class="w-14 h-14 mx-auto mb-4 text-white/40" :stroke-width="1.5" />
        <h2 class="text-xl font-semibold text-white mb-2">Nenhum dado ainda</h2>
        <p class="text-white/70 text-sm mb-6">
          Complete algumas sessões para visualizar seu progresso aqui.
        </p>
        <router-link
          to="/"
          class="inline-block px-6 py-3 bg-white text-gray-800 font-semibold rounded-lg hover:bg-gray-100 transition-colors no-underline"
        >
          Iniciar Sessão
        </router-link>
      </div>

      <!-- Dashboard content -->
      <div v-else class="space-y-5">
        <!-- Stat Cards Row -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="bg-white/10 rounded-xl p-4 text-center">
            <div class="text-2xl sm:text-3xl font-bold text-white">{{ history.studyStreak }}</div>
            <div class="text-white/70 text-xs mt-1">Sequência (dias)</div>
          </div>
          <div class="bg-white/10 rounded-xl p-4 text-center">
            <div class="text-2xl sm:text-3xl font-bold text-white">
              {{ history.totalStudySessions }}
            </div>
            <div class="text-white/70 text-xs mt-1">Sessões</div>
          </div>
          <div class="bg-white/10 rounded-xl p-4 text-center">
            <div class="text-2xl sm:text-3xl font-bold text-white">
              {{ history.totalQuestionsAnswered }}
            </div>
            <div class="text-white/70 text-xs mt-1">Questões</div>
          </div>
          <div class="bg-white/10 rounded-xl p-4 text-center">
            <div class="text-2xl sm:text-3xl font-bold text-white">
              {{ history.overallAccuracy }}%
            </div>
            <div class="text-white/70 text-xs mt-1">Precisão</div>
          </div>
        </div>

        <!-- Secondary stats row -->
        <div class="grid grid-cols-3 gap-3">
          <div class="bg-white/10 rounded-xl p-3 text-center">
            <div class="text-lg font-bold text-white">{{ history.totalCyclesCompleted }}</div>
            <div class="text-white/70 text-[10px] mt-1">Ciclos completos</div>
          </div>
          <div class="bg-white/10 rounded-xl p-3 text-center">
            <div class="text-lg font-bold text-white">{{ history.avgQuestionsPerSession }}</div>
            <div class="text-white/70 text-[10px] mt-1">Média por sessão</div>
          </div>
          <div class="bg-white/10 rounded-xl p-3 text-center">
            <div class="text-lg font-bold text-white">{{ history.totalCorrectAnswers }}</div>
            <div class="text-white/70 text-[10px] mt-1">Total de acertos</div>
          </div>
        </div>

        <!-- Best / Worst Discipline -->
        <div
          v-if="history.bestDiscipline || history.worstDiscipline"
          class="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <div v-if="history.bestDiscipline" class="bg-white/10 rounded-xl p-4">
            <div class="text-white/70 text-xs uppercase tracking-wider mb-2">Melhor disciplina</div>
            <div class="text-white font-semibold">{{ history.bestDiscipline.discipline }}</div>
            <div class="text-sm mt-1" :class="bestColor">
              {{ history.bestDiscipline.accuracy }}% precisão
              <span class="text-white/60"
                >· {{ history.bestDiscipline.totalQuestions }} questões</span
              >
            </div>
          </div>
          <div v-if="history.worstDiscipline" class="bg-white/10 rounded-xl p-4">
            <div class="text-white/70 text-xs uppercase tracking-wider mb-2">Foco de melhoria</div>
            <div class="text-white font-semibold">{{ history.worstDiscipline.discipline }}</div>
            <div class="text-sm mt-1" :class="worstColor">
              {{ history.worstDiscipline.accuracy }}% precisão
              <span class="text-white/60"
                >· {{ history.worstDiscipline.totalQuestions }} questões</span
              >
            </div>
          </div>
        </div>

        <!-- Accuracy over time (Line chart) -->
        <div v-if="hasChartData" class="bg-white/10 rounded-2xl p-5">
          <h2 class="text-white/80 text-xs uppercase tracking-wider mb-4">Evolução da Precisão</h2>
          <AccuracyLineChart :data="history.accuracyTrend" />
        </div>

        <!-- Daily volume (Line chart) -->
        <div v-if="hasChartData" class="bg-white/10 rounded-2xl p-5">
          <h2 class="text-white/80 text-xs uppercase tracking-wider mb-4">Volume Diário</h2>
          <DailyVolumeChart :data="history.dailyStats" />
        </div>

        <!-- Weekly volume (Bar chart) -->
        <div class="bg-white/10 rounded-2xl p-5">
          <h2 class="text-white/80 text-xs uppercase tracking-wider mb-4">Volume Semanal</h2>
          <WeeklyVolumeChart :data="history.weeklyVolume" />
        </div>

        <!-- Discipline breakdown (Donut) -->
        <div v-if="disciplineChartData.length > 0" class="bg-white/10 rounded-2xl p-5">
          <h2 class="text-white/80 text-xs uppercase tracking-wider mb-4">
            Distribuição por Disciplina
          </h2>
          <DisciplineDonutChart :data="disciplineChartData" />
        </div>

        <!-- Discipline accuracy table -->
        <div v-if="history.disciplineStats.length > 0" class="bg-white/10 rounded-2xl p-5">
          <h2 class="text-white/80 text-xs uppercase tracking-wider mb-4">
            Precisão por Disciplina
          </h2>
          <div class="space-y-2">
            <div
              v-for="d in history.disciplineStats"
              :key="d.discipline"
              class="flex items-center justify-between bg-white/5 rounded-lg p-3"
            >
              <div class="flex-1 min-w-0">
                <div class="text-white font-medium text-sm truncate">{{ d.discipline }}</div>
                <div class="text-white/60 text-xs">
                  {{ d.totalQuestions }} questões · {{ d.cycles }} ciclos
                </div>
              </div>
              <div class="flex items-center gap-3 ml-3">
                <!-- Mini progress bar -->
                <div class="w-20 h-2 bg-white/10 rounded-full overflow-hidden hidden sm:block">
                  <div
                    class="h-full rounded-full transition-all"
                    :class="
                      d.accuracy >= 80
                        ? 'bg-energy-green'
                        : d.accuracy >= 60
                          ? 'bg-energy-yellow'
                          : 'bg-energy-red'
                    "
                    :style="{ width: `${d.accuracy}%` }"
                  />
                </div>
                <span
                  class="text-sm font-bold min-w-[3rem] text-right"
                  :class="
                    d.accuracy >= 80
                      ? 'text-energy-green'
                      : d.accuracy >= 60
                        ? 'text-energy-yellow'
                        : 'text-energy-red'
                  "
                >
                  {{ d.accuracy }}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Energy Trend (Line chart) -->
        <div v-if="history.energyTrend.length >= 2" class="bg-white/10 rounded-2xl p-5">
          <h2 class="text-white/80 text-xs uppercase tracking-wider mb-4">Tendência de Energia</h2>
          <EnergyTrendChart :data="history.energyTrend" />
        </div>

        <!-- Recent sessions summary -->
        <div class="bg-white/10 rounded-2xl p-5">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-white/80 text-xs uppercase tracking-wider">Últimas Sessões</h2>
            <router-link
              to="/report"
              class="text-white/60 hover:text-white/80 text-xs transition-colors no-underline"
            >
              Ver todas →
            </router-link>
          </div>
          <div class="space-y-2">
            <div
              v-for="s in history.sessions.slice(0, 5)"
              :key="s.id"
              class="flex items-center justify-between bg-white/5 rounded-lg p-3"
            >
              <div>
                <div class="text-white text-sm">
                  {{
                    new Date(s.started_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                    })
                  }}
                </div>
                <div class="text-white/60 text-xs">{{ s.total_cycles }} ciclos</div>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-white/70 text-xs">{{ s.total_questions }} q</span>
                <span
                  class="text-sm font-bold"
                  :class="
                    s.total_questions > 0 && s.total_correct / s.total_questions >= 0.8
                      ? 'text-energy-green'
                      : s.total_questions > 0 && s.total_correct / s.total_questions >= 0.6
                        ? 'text-energy-yellow'
                        : 'text-energy-red'
                  "
                >
                  {{
                    s.total_questions > 0
                      ? Math.round((s.total_correct / s.total_questions) * 100)
                      : 0
                  }}%
                </span>
                <span
                  v-if="s.final_energy"
                  class="w-2.5 h-2.5 rounded-full"
                  :class="
                    s.final_energy === 'green'
                      ? 'bg-energy-green'
                      : s.final_energy === 'yellow'
                        ? 'bg-energy-yellow'
                        : 'bg-energy-red'
                  "
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
