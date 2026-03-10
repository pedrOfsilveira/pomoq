<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useHistoryStore } from '@/stores/history'
import { useAuthStore } from '@/stores/auth'
import type { EnergyLevel } from '@/types/database'
import EnergyBadge from '@/components/ui/EnergyBadge.vue'
import { ChevronLeft } from 'lucide-vue-next'

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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDateShort(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}`
}
</script>

<template>
  <div class="flex-1 flex flex-col items-center px-4 py-6">
    <div class="w-full max-w-[480px]">
      <!-- Title -->
      <div class="flex items-center gap-3 mb-6">
        <router-link to="/" class="text-white/70 hover:text-white transition-colors">
          <ChevronLeft class="w-5 h-5" :stroke-width="2" />
        </router-link>
        <h1 class="text-2xl font-bold text-white">Relatório</h1>
      </div>

      <!-- Overall stats -->
      <div class="bg-white/10 rounded-2xl p-6 mb-6">
        <h2 class="text-white/80 text-xs uppercase tracking-wider mb-4">Resumo Geral</h2>
        <div class="grid grid-cols-3 gap-4 text-center">
          <div>
            <div class="text-3xl font-bold text-white">{{ history.totalStudySessions }}</div>
            <div class="text-white/70 text-xs mt-1">Sessões</div>
          </div>
          <div>
            <div class="text-3xl font-bold text-white">{{ history.totalQuestionsAnswered }}</div>
            <div class="text-white/70 text-xs mt-1">Questões</div>
          </div>
          <div>
            <div class="text-3xl font-bold text-white">{{ history.overallAccuracy }}%</div>
            <div class="text-white/70 text-xs mt-1">Precisão</div>
          </div>
        </div>
      </div>

      <!-- Daily breakdown -->
      <div v-if="history.dailyStats.length > 0" class="bg-white/10 rounded-2xl p-6 mb-6">
        <h2 class="text-white/80 text-xs uppercase tracking-wider mb-4">Por Dia</h2>
        <div class="space-y-3">
          <div
            v-for="day in history.dailyStats"
            :key="day.date"
            class="flex items-center justify-between bg-white/5 rounded-xl p-3"
          >
            <div>
              <div class="text-white font-medium text-sm">{{ formatDateShort(day.date) }}</div>
              <div class="text-white/70 text-xs">
                {{ day.sessions }} sessão{{ day.sessions > 1 ? 'ões' : '' }}
              </div>
            </div>
            <div class="text-right">
              <div class="text-white font-medium text-sm">{{ day.totalQuestions }} questões</div>
              <div class="text-white/70 text-xs">
                {{
                  day.totalQuestions > 0
                    ? Math.round((day.totalCorrect / day.totalQuestions) * 100)
                    : 0
                }}% acerto
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Session list -->
      <div class="bg-white/10 rounded-2xl p-6">
        <h2 class="text-white/80 text-xs uppercase tracking-wider mb-4">Sessões Recentes</h2>

        <div
          v-if="history.error"
          class="mb-3 bg-red-500/20 border border-red-400/30 rounded-lg px-3 py-2 text-red-100 text-xs"
        >
          {{ history.error }}
        </div>

        <div v-if="history.loading" class="text-center py-8">
          <div class="text-white/60">Carregando...</div>
        </div>

        <div v-else-if="history.sessions.length === 0" class="text-center py-8">
          <div class="text-white/60 text-sm">Nenhuma sessão registrada ainda</div>
        </div>

        <div v-else class="space-y-3">
          <div v-for="s in history.sessions" :key="s.id" class="bg-white/5 rounded-xl p-4">
            <div class="flex items-start justify-between mb-2">
              <div class="text-white/70 text-xs">{{ formatDate(s.started_at) }}</div>
              <EnergyBadge v-if="s.final_energy" :level="s.final_energy as EnergyLevel" size="sm" />
            </div>
            <div class="flex gap-4 text-sm">
              <span class="text-white">{{ s.total_questions }} questões</span>
              <span class="text-white/70">{{ s.total_correct }} acertos</span>
              <span class="text-white/70">{{ s.total_cycles }} ciclos</span>
            </div>
            <div class="mt-1 text-white/60 text-xs">
              Precisão:
              {{
                s.total_questions > 0 ? Math.round((s.total_correct / s.total_questions) * 100) : 0
              }}%
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
