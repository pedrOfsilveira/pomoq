<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted, ref } from 'vue'
import { useSessionStore } from '@/stores/session'
import { useAuthStore } from '@/stores/auth'
import HeaderBar from '@/components/layout/HeaderBar.vue'
import InstallPrompt from '@/components/ui/InstallPrompt.vue'
import { usePwaInstall } from '@/composables/usePwaInstall'
import { Analytics } from '@vercel/analytics/vue'

const session = useSessionStore()
const auth = useAuthStore()
const { setupListeners, teardownListeners, hasBeenPrompted, markAsPrompted, canInstall } =
  usePwaInstall()

const showInstallPrompt = ref(false)

const bgColor = computed(() => {
  switch (session.phase) {
    case 'studying':
      return 'bg-pomo-red'
    case 'review':
      return 'bg-pomo-blue'
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

const phaseBodyColor: Record<string, string> = {
  studying: '#8B3F3F',
  review: '#3B4E80',
  break: '#3B7272',
  checkin: '#3B4E80',
  finished: '#2F5E5E',
  idle: '#8B3F3F',
  setup: '#8B3F3F',
  default: '#8B3F3F',
}

function syncBodyColor(phase: string | null, authenticated: boolean) {
  const color = authenticated ? (phaseBodyColor[phase ?? 'default'] ?? '#8B3F3F') : '#8B3F3F'
  document.body.style.backgroundColor = color
  document.documentElement.style.backgroundColor = color
}

watch(
  () => [auth.isAuthenticated, session.phase] as const,
  ([authenticated, phase]) => syncBodyColor(phase, authenticated),
  { immediate: true },
)

watch(
  () => auth.isAuthenticated,
  (authenticated, wasAuthenticated) => {
    if (authenticated && !wasAuthenticated && !hasBeenPrompted()) {
      setTimeout(() => {
        showInstallPrompt.value = true
      }, 1200)
    }
  },
)

function handleInstallClose() {
  showInstallPrompt.value = false
  markAsPrompted()
}

onMounted(() => {
  setupListeners()
  syncBodyColor(session.phase, auth.isAuthenticated)

  if (auth.isAuthenticated && !hasBeenPrompted()) {
    setTimeout(() => {
      showInstallPrompt.value = true
    }, 1200)
  }
})

onUnmounted(() => {
  teardownListeners()
})
</script>

<template>
  <Analytics />
  <div
    class="min-h-screen transition-bg flex flex-col safe-area-top safe-area-bottom"
    :class="auth.isAuthenticated ? bgColor : 'bg-pomo-red'"
  >
    <HeaderBar v-if="auth.isAuthenticated" />
    <main class="flex-1 flex flex-col">
      <router-view />
    </main>

    <!-- PWA install prompt — appears once after first login -->
    <InstallPrompt :visible="showInstallPrompt" @close="handleInstallClose" />
  </div>
</template>

<style scoped>
.transition-bg {
  transition: background-color 0.6s ease;
}
</style>
