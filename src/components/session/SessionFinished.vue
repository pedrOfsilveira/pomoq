<script setup lang="ts">
import { computed } from 'vue'
import { useSessionStore } from '@/stores/session'
import AppButton from '@/components/ui/AppButton.vue'
import EnergyBadge from '@/components/ui/EnergyBadge.vue'
import { Trophy, BedDouble, LayoutDashboard } from 'lucide-vue-next'

const session = useSessionStore()

const overallAccuracy = computed(() => {
  if (session.totalQuestions === 0) return 0
  return Math.round((session.totalCorrect / session.totalQuestions) * 100)
})

const message = computed(() => {
  if (session.forcedRest) return 'Você chegou ao limite — descanso é parte do aprendizado.'
  if (session.totalCycles === 0) return 'Sessão encerrada.'
  if (overallAccuracy.value >= 80) return 'Excelente desempenho!'
  if (overallAccuracy.value >= 60) return 'Bom trabalho, continue assim.'
  return 'Cada questão é um passo à frente.'
})

function startNew() {
  session.reset()
}
</script>

<template>
  <div class="text-center">
    <!-- Header -->
    <div class="mb-6">
      <BedDouble
        v-if="session.forcedRest"
        class="w-8 h-8 mx-auto mb-3 text-energy-red/80"
        :stroke-width="1.5"
      />
      <Trophy v-else class="w-8 h-8 mx-auto mb-3 text-white/80" :stroke-width="1.5" />
      <h2 class="text-2xl font-bold text-white mb-2">
        {{ session.forcedRest ? 'Hora de Descansar' : 'Sessão Completa' }}
      </h2>
      <p class="text-white/80 text-lg">{{ message }}</p>
    </div>

    <!-- Stats -->
    <div class="bg-white/10 rounded-2xl p-6 mb-6">
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-white/10 rounded-xl p-4">
          <div class="text-3xl font-bold text-white">{{ session.totalCycles }}</div>
          <div class="text-white/70 text-xs mt-1">Ciclos</div>
        </div>
        <div class="bg-white/10 rounded-xl p-4">
          <div class="text-3xl font-bold text-white">{{ session.totalQuestions }}</div>
          <div class="text-white/70 text-xs mt-1">Questões</div>
        </div>
        <div class="bg-white/10 rounded-xl p-4">
          <div class="text-3xl font-bold text-white">{{ session.totalCorrect }}</div>
          <div class="text-white/70 text-xs mt-1">Acertos</div>
        </div>
        <div class="bg-white/10 rounded-xl p-4">
          <div class="text-3xl font-bold text-white">{{ overallAccuracy }}%</div>
          <div class="text-white/70 text-xs mt-1">Precisão</div>
        </div>
      </div>

      <!-- Last energy -->
      <div v-if="session.lastEnergy" class="mt-4 flex items-center justify-center gap-2">
        <span class="text-white/70 text-sm">Energia final:</span>
        <EnergyBadge :level="session.lastEnergy" />
      </div>
    </div>

    <!-- Encouragement based on energy -->
    <div
      v-if="session.lastEnergy === 'red'"
      class="bg-energy-red/10 border border-energy-red/30 rounded-xl p-4 mb-6"
    >
      <p class="text-white text-sm">
        Você soube ouvir seu corpo e parou no momento certo. Isso é <strong>inteligência</strong>,
        não fraqueza. Descanse bem.
      </p>
    </div>

    <div
      v-else-if="session.lastEnergy === 'yellow'"
      class="bg-energy-yellow/10 border border-energy-yellow/30 rounded-xl p-4 mb-6"
    >
      <p class="text-white text-sm">Bom equilíbrio entre esforço e descanso. Continue assim.</p>
    </div>

    <div
      v-else-if="session.lastEnergy === 'green'"
      class="bg-energy-green/10 border border-energy-green/30 rounded-xl p-4 mb-6"
    >
      <p class="text-white text-sm">
        Você terminou com energia. Considere aumentar a carga gradualmente.
      </p>
    </div>

    <!-- Actions -->
    <div class="space-y-3">
      <AppButton class="w-full" size="lg" @click="startNew"> Nova Sessão </AppButton>

      <router-link to="/dashboard" class="block">
        <AppButton variant="secondary" class="w-full">
          <LayoutDashboard class="w-4 h-4 mr-2" :stroke-width="1.8" />
          Ver Dashboard
        </AppButton>
      </router-link>
    </div>
  </div>
</template>
