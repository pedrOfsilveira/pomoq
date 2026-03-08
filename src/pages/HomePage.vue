<script setup lang="ts">
import { useSessionStore } from '@/stores/session'
import SessionSetup from '@/components/session/SessionSetup.vue'
import StudyingPhase from '@/components/session/StudyingPhase.vue'
import EnergyCheckin from '@/components/session/EnergyCheckin.vue'
import BreakPhase from '@/components/session/BreakPhase.vue'
import SessionFinished from '@/components/session/SessionFinished.vue'

const session = useSessionStore()
</script>

<template>
  <div class="flex-1 flex flex-col items-center px-4 py-6">
    <div class="w-full max-w-[480px]">
      <!-- Idle / Setup -->
      <SessionSetup v-if="session.phase === 'idle' || session.phase === 'setup'" />

      <!-- Studying -->
      <StudyingPhase v-else-if="session.phase === 'studying'" />

      <!-- Energy Check-in -->
      <EnergyCheckin v-else-if="session.phase === 'checkin'" />

      <!-- Break -->
      <BreakPhase v-else-if="session.phase === 'break'" />

      <!-- Finished -->
      <SessionFinished v-else-if="session.phase === 'finished'" />
    </div>
  </div>
</template>
