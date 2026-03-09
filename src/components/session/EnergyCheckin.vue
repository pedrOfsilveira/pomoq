<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSessionStore } from '@/stores/session'
import type { EnergyLevel } from '@/types/database'
import AppButton from '@/components/ui/AppButton.vue'
import { Activity } from 'lucide-vue-next'

const session = useSessionStore()
const selectedEnergy = ref<EnergyLevel | null>(null)
const note = ref('')
const loading = ref(false)

const energyOptions: {
  level: EnergyLevel
  label: string
  description: string
  color: string
}[] = [
  {
    level: 'green',
    label: 'Verde',
    description: 'Me sinto bem, posso continuar com mais questões.',
    color: 'border-energy-green bg-energy-green/10 hover:bg-energy-green/20',
  },
  {
    level: 'yellow',
    label: 'Amarelo',
    description: 'Estou um pouco cansado, mas ainda consigo focar.',
    color: 'border-energy-yellow bg-energy-yellow/10 hover:bg-energy-yellow/20',
  },
  {
    level: 'red',
    label: 'Vermelho',
    description: 'Estou esgotado. Preciso de uma pausa maior.',
    color: 'border-energy-red bg-energy-red/10 hover:bg-energy-red/20',
  },
]

const selectedColor = computed(() => {
  if (!selectedEnergy.value) return ''
  return selectedEnergy.value === 'green'
    ? 'ring-energy-green'
    : selectedEnergy.value === 'yellow'
      ? 'ring-energy-yellow'
      : 'ring-energy-red'
})

const isLastDiscipline = computed(
  () => session.currentDisciplineIndex >= session.disciplines.length - 1,
)

// Show what will happen next
const nextInfo = computed(() => {
  if (!selectedEnergy.value) return ''

  // Warn that the session will end if red energy + current cycle is already at the minimum
  if (selectedEnergy.value === 'red' && (session.currentCycle?.questionsTarget ?? 0) <= 2) {
    return 'Sessão encerrada — hora de descansar.'
  }

  const breakDuration = session.getBreakDuration(selectedEnergy.value) / 60

  // Last discipline + no loop: session ends after the break
  if (isLastDiscipline.value && !session.loopDisciplines) {
    return `Pausa: ${breakDuration} min • Sessão encerrada após o intervalo`
  }

  const base = session.questionsPerBlock
  const adjusted = session.getAdjustedQuestions(selectedEnergy.value, base)
  const diff = adjusted - base

  let qText = `${adjusted} questões`
  if (diff > 0) qText += ` (+${diff})`
  else if (diff < 0) qText += ` (${diff})`

  // Last discipline + loop: show next discipline is the first one
  if (isLastDiscipline.value && session.loopDisciplines) {
    const nextDiscipline = session.disciplines[0]
    return `Próximo bloco: ${qText} em ${nextDiscipline} • Pausa: ${breakDuration} min`
  }

  return `Próximo bloco: ${qText} • Pausa: ${breakDuration} min`
})

async function submit() {
  if (!selectedEnergy.value) return
  loading.value = true
  try {
    await session.submitCheckin(selectedEnergy.value, note.value || undefined)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="text-center">
    <!-- Header -->
    <div class="mb-6">
      <Activity class="w-7 h-7 mx-auto mb-2 text-white/80" :stroke-width="1.5" />
      <h2 class="text-2xl font-bold text-white mb-2">Check-in de Energia</h2>
      <p class="text-white/80 text-sm">
        Como você está se sentindo após este bloco de
        <strong class="text-white">{{ session.currentDiscipline }}</strong
        >?
      </p>
    </div>

    <!-- Cycle summary -->
    <div class="bg-white/10 rounded-xl p-4 mb-6 flex justify-around">
      <div>
        <div class="text-2xl font-bold text-white">{{ session.currentCycle?.questionsDone }}</div>
        <div class="text-white/70 text-xs">Respondidas</div>
      </div>
      <div>
        <div class="text-2xl font-bold text-white">
          {{ session.currentCycle?.questionsCorrect }}
        </div>
        <div class="text-white/70 text-xs">Acertos</div>
      </div>
      <div>
        <div class="text-2xl font-bold text-white">{{ session.accuracy }}%</div>
        <div class="text-white/70 text-xs">Precisão</div>
      </div>
    </div>

    <!-- Energy options -->
    <div class="space-y-3 mb-6">
      <button
        v-for="opt in energyOptions"
        :key="opt.level"
        @click="selectedEnergy = opt.level"
        class="w-full p-4 rounded-xl border-2 text-left transition-all cursor-pointer"
        :class="[
          opt.color,
          selectedEnergy === opt.level
            ? 'ring-2 ring-offset-2 ring-offset-transparent ' + selectedColor + ' scale-[1.02]'
            : 'border-transparent',
        ]"
      >
        <div class="flex items-center gap-3">
          <span
            class="w-4 h-4 rounded-full flex-shrink-0"
            :class="
              opt.level === 'green'
                ? 'bg-energy-green'
                : opt.level === 'yellow'
                  ? 'bg-energy-yellow'
                  : 'bg-energy-red'
            "
          ></span>
          <div>
            <div class="text-white font-semibold">{{ opt.label }}</div>
            <div class="text-white/70 text-sm">{{ opt.description }}</div>
          </div>
        </div>
      </button>
    </div>

    <!-- Next block preview -->
    <div v-if="selectedEnergy" class="bg-white/10 rounded-xl p-3 mb-4 text-white/70 text-sm">
      {{ nextInfo }}
    </div>

    <!-- Optional note -->
    <div class="mb-6">
      <textarea
        v-model="note"
        placeholder="Alguma observação? (opcional)"
        rows="2"
        class="w-full bg-white/10 text-white placeholder-white/50 rounded-xl px-4 py-3 text-sm border-0 outline-none focus:ring-2 focus:ring-white/30 resize-none"
      />
    </div>

    <!-- Submit -->
    <AppButton
      class="w-full"
      size="lg"
      :disabled="!selectedEnergy"
      :loading="loading"
      @click="submit"
    >
      {{ selectedEnergy === 'red' ? 'Fazer pausa longa' : 'Continuar' }}
    </AppButton>
  </div>
</template>
