<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useSessionStore } from '@/stores/session'
import AppButton from '@/components/ui/AppButton.vue'
import EnergyBadge from '@/components/ui/EnergyBadge.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import { Coffee, ArrowRight } from 'lucide-vue-next'

const session = useSessionStore()
const canSkip = ref(false)

// Format seconds as MM:SS
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const displayTime = computed(() => {
  const remaining = Math.max(session.breakTarget - session.breakSeconds, 0)
  return formatTime(remaining)
})

const breakComplete = computed(() => session.breakSeconds >= session.breakTarget)

const isRedEnergy = computed(() => session.lastEnergy === 'red')

// Practical break tips
const messages = [
  'Levante, tome água e alongue-se.',
  'Afaste o olhar da tela por alguns segundos.',
  'Respire fundo três vezes antes de continuar.',
  'Aproveite para hidratar e descansar a vista.',
  'Uma pausa curta mantém o rendimento ao longo do dia.',
]
const randomMessage = messages[Math.floor(Math.random() * messages.length)]

// Allow skip after 30 seconds minimum
let skipTimer: ReturnType<typeof setTimeout>

onMounted(() => {
  skipTimer = setTimeout(() => {
    canSkip.value = true
  }, 30000)
})

onUnmounted(() => {
  clearTimeout(skipTimer)
})

async function endBreakAndContinue() {
  await session.endBreak()
}

async function endSessionNow() {
  await session.endSession()
}
</script>

<template>
  <div class="text-center">
    <!-- Header -->
    <div class="mb-4">
      <Coffee class="w-7 h-7 mx-auto mb-2 text-white/80" :stroke-width="1.5" />
      <h2 class="text-2xl font-bold text-white mb-2">Hora da Pausa</h2>
      <p class="text-white/80 text-sm">{{ randomMessage }}</p>
    </div>

    <!-- Current energy -->
    <div v-if="session.lastEnergy" class="flex justify-center mb-6">
      <EnergyBadge :level="session.lastEnergy" size="md" />
    </div>

    <!-- Timer display (Pomofocus-style) -->
    <div class="bg-white/10 rounded-2xl p-10 mb-6">
      <div class="text-[6rem] leading-none font-extrabold text-white tabular-nums">
        {{ displayTime }}
      </div>
      <div class="mt-4">
        <ProgressBar :value="session.breakSeconds" :max="session.breakTarget" size="md" />
      </div>
      <p class="text-white/70 text-sm mt-3">
        {{
          breakComplete
            ? 'Pausa completa!'
            : `Pausa de ${Math.ceil(session.breakTarget / 60)} minutos`
        }}
      </p>
    </div>

    <!-- Tips for red energy -->
    <div
      v-if="isRedEnergy"
      class="bg-energy-red/10 border border-energy-red/30 rounded-xl p-4 mb-6 text-left"
    >
      <p class="text-white font-semibold text-sm mb-2">Sinal Vermelho</p>
      <ul class="text-white/80 text-sm space-y-1 list-disc list-inside">
        <li>Considere encerrar por hoje</li>
        <li>Não há problema em parar — preservar sua saúde é prioridade</li>
        <li>Amanhã você renderá mais se descansar agora</li>
      </ul>
    </div>

    <!-- Actions -->
    <div class="space-y-3">
      <AppButton v-if="breakComplete" class="w-full" size="lg" @click="endBreakAndContinue">
        <ArrowRight class="w-4 h-4 mr-2" :stroke-width="2" />
        Próximo Bloco
      </AppButton>

      <AppButton
        v-if="canSkip && !breakComplete"
        class="w-full"
        variant="secondary"
        @click="endBreakAndContinue"
      >
        Pular pausa
      </AppButton>

      <AppButton v-if="isRedEnergy" class="w-full" variant="danger" @click="endSessionNow">
        Encerrar sessão por hoje
      </AppButton>

      <button
        v-if="!isRedEnergy && !breakComplete"
        @click="endSessionNow"
        class="text-white/50 hover:text-white/80 text-xs transition-colors cursor-pointer bg-transparent border-none underline"
      >
        Encerrar sessão
      </button>
    </div>

    <!-- Next discipline preview -->
    <div class="mt-6 bg-white/10 rounded-xl p-3">
      <template v-if="session.currentDisciplineIndex < session.disciplines.length - 1">
        <p class="text-white/60 text-xs">Próxima disciplina</p>
        <p class="text-white font-semibold">
          {{ session.disciplines[session.currentDisciplineIndex + 1] }}
        </p>
      </template>
      <template v-else-if="session.loopDisciplines">
        <p class="text-white/60 text-xs">Próxima disciplina (reiniciando ciclo)</p>
        <p class="text-white font-semibold">{{ session.disciplines[0] }}</p>
      </template>
      <template v-else>
        <p class="text-white/60 text-xs">Última disciplina concluída</p>
        <p class="text-white font-semibold">A sessão encerrará após esta pausa</p>
      </template>
    </div>
  </div>
</template>
