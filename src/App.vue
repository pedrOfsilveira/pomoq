<script setup lang="ts">
import { computed } from 'vue'
import { useSessionStore } from '@/stores/session'
import { useAuthStore } from '@/stores/auth'
import HeaderBar from '@/components/layout/HeaderBar.vue'

const session = useSessionStore()
const auth = useAuthStore()

// Dynamic background color based on session phase (Pomofocus-style)
const bgColor = computed(() => {
  switch (session.phase) {
    case 'studying':
      return 'bg-pomo-red'
    case 'break':
      return 'bg-pomo-green'
    case 'checkin':
      return 'bg-pomo-blue'
    case 'finished':
      return 'bg-pomo-green-dark'
    default:
      return 'bg-pomo-red'
  }
})
</script>

<template>
  <div
    class="min-h-screen transition-bg flex flex-col"
    :class="auth.isAuthenticated ? bgColor : 'bg-pomo-red'"
  >
    <HeaderBar v-if="auth.isAuthenticated" />
    <main class="flex-1 flex flex-col">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.transition-bg {
  transition: background-color 0.6s ease;
}
</style>
