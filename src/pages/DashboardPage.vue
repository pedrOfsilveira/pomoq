<script setup lang="ts">
import { onMounted, computed, watch, ref } from 'vue'
import { useHistoryStore } from '@/stores/history'
import { useAuthStore } from '@/stores/auth'
import AccuracyLineChart from '@/components/charts/AccuracyLineChart.vue'
import WeeklyVolumeChart from '@/components/charts/WeeklyVolumeChart.vue'
import DisciplineDonutChart from '@/components/charts/DisciplineDonutChart.vue'
import EnergyTrendChart from '@/components/charts/EnergyTrendChart.vue'
import DailyVolumeChart from '@/components/charts/DailyVolumeChart.vue'
import { ChevronLeft, BarChart3, ChevronDown } from 'lucide-vue-next'

const REASON_META: Record<
  'attention' | 'content_gap' | 'interpretation',
  { label: string; barClass: string }
> = {
  attention: { label: 'Falta de atenção', barClass: 'bg-energy-yellow' },
  content_gap: { label: 'Lacuna no conteúdo', barClass: 'bg-energy-red' },
  interpretation: { label: 'Interpretação', barClass: 'bg-white/60' },
}

const history = useHistoryStore()
const auth = useAuthStore()

onMounted(() => {
  if (auth.isAuthenticated) {
    history.fetchSessions().catch(() => {})
  }
})

watch(
  () => auth.isAuthenticated,
  (ready) => {
    if (ready && history.sessions.length === 0) {
      history.fetchSessions().catch(() => {})
    }
  },
)

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
})

const hasData = computed(() => history.sessions.length > 0)
const hasChartData = computed(() => history.dailyStats.length >= 2)

const disciplineChartData = computed(() =>
  history.disciplineStats.map((d) => ({
    discipline: d.discipline,
    totalQuestions: d.totalQuestions,
    accuracy: d.accuracy,
  })),
)

const expandedDisciplines = ref<Set<string>>(new Set())
function toggleDiscipline(name: string) {
  if (expandedDisciplines.value.has(name)) {
    expandedDisciplines.value.delete(name)
  } else {
    expandedDisciplines.value.add(name)
  }
  expandedDisciplines.value = new Set(expandedDisciplines.value)
}

const errorReasonByDiscipline = computed(() => {
  const map = new Map(history.errorReasonStats.map((s) => [s.discipline, s]))
  return map
})
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

      <div
        v-else-if="history.error"
        class="bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-3 text-red-100 text-sm"
      >
        {{ history.error }}
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

        <!-- Discipline accuracy table (expandable with error reasons) -->
        <div v-if="history.disciplineStats.length > 0" class="bg-white/10 rounded-2xl p-5">
          <h2 class="text-white/80 text-xs uppercase tracking-wider mb-4">
            Precisão por Disciplina
          </h2>
          <div class="space-y-2">
            <div
              v-for="d in history.disciplineStats"
              :key="d.discipline"
              class="bg-white/5 rounded-lg overflow-hidden"
            >
              <!-- Summary row (always visible) -->
              <button
                class="w-full flex items-center justify-between p-3 text-left cursor-pointer hover:bg-white/5 transition-colors"
                @click="toggleDiscipline(d.discipline)"
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
                      :style="{ width: d.accuracy + '%' }"
                    />
                  </div>
                  <span
                    class="text-sm font-bold w-12 text-right"
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
                  <ChevronDown
                    v-if="errorReasonByDiscipline.get(d.discipline)"
                    class="w-4 h-4 text-white/40 transition-transform shrink-0"
                    :class="expandedDisciplines.has(d.discipline) ? 'rotate-180' : ''"
                    :stroke-width="2"
                  />
                  <span v-else class="w-4" />
                </div>
              </button>

              <!-- Expandable error detail -->
              <Transition name="expand">
                <div
                  v-if="
                    expandedDisciplines.has(d.discipline) &&
                    errorReasonByDiscipline.get(d.discipline)
                  "
                  class="px-3 pb-3 border-t border-white/10"
                >
                  <div class="pt-3 space-y-2">
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-white/50 text-[10px] uppercase tracking-wider"
                        >Padrão de erros</span
                      >
                      <span class="text-white/40 text-xs"
                        >{{ errorReasonByDiscipline.get(d.discipline)!.total }} erro{{
                          errorReasonByDiscipline.get(d.discipline)!.total !== 1 ? 's' : ''
                        }}</span
                      >
                    </div>

                    <!-- Reason rows -->
                    <div
                      v-for="key in ['attention', 'content_gap', 'interpretation'] as const"
                      :key="key"
                      class="flex items-center gap-2"
                    >
                      <span class="text-white/60 text-xs w-36 shrink-0">{{
                        REASON_META[key].label
                      }}</span>
                      <div class="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          class="h-full rounded-full"
                          :class="REASON_META[key].barClass"
                          :style="{
                            width:
                              errorReasonByDiscipline.get(d.discipline)!.total > 0
                                ? Math.round(
                                    (errorReasonByDiscipline.get(d.discipline)![key] /
                                      errorReasonByDiscipline.get(d.discipline)!.total) *
                                      100,
                                  ) + '%'
                                : '0%',
                          }"
                        />
                      </div>
                      <span class="text-white/50 text-xs w-4 text-right shrink-0">
                        {{ errorReasonByDiscipline.get(d.discipline)![key] }}
                      </span>
                    </div>

                    <!-- Content gap notes -->
                    <div
                      v-if="errorReasonByDiscipline.get(d.discipline)!.contentNotes.length > 0"
                      class="pt-2 mt-1 border-t border-white/10"
                    >
                      <p class="text-white/40 text-[10px] uppercase tracking-wider mb-1.5">
                        Conteúdos a revisar
                      </p>
                      <div class="flex flex-wrap gap-1.5">
                        <span
                          v-for="note in errorReasonByDiscipline.get(d.discipline)!.contentNotes"
                          :key="note"
                          class="px-2 py-0.5 bg-white/10 text-white/70 rounded text-xs"
                        >
                          {{ note }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Transition>
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

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}
.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 400px;
}
</style>
