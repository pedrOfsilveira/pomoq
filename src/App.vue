<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted, ref } from 'vue'
import { useSessionStore } from '@/stores/session'
import { useAuthStore } from '@/stores/auth'
import HeaderBar from '@/components/layout/HeaderBar.vue'
import InstallPrompt from '@/components/ui/InstallPrompt.vue'
import { usePwaInstall } from '@/composables/usePwaInstall'

const session = useSessionStore()
const auth = useAuthStore()
const { setupListeners, teardownListeners, hasBeenPrompted, markAsPrompted } = usePwaInstall()

// Install prompt visibility
const showInstallPrompt = ref(false)

// Dynamic background color based on session phase (Pomofocus-style)
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

// Map phase → hex color used to paint html/body so overscroll areas
// (PWA bounce/pull-to-refresh) show the correct phase color instead of red.
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

// Show install prompt once right after the user first logs in
watch(
  () => auth.isAuthenticated,
  (authenticated, wasAuthenticated) => {
    if (authenticated && !wasAuthenticated && !hasBeenPrompted()) {
      // Small delay so the page finishes transitioning
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

  // If user was already authenticated on page load (session restored before mount),
  // the watcher below will never fire — so we check here too.
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
