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
    class="min-h-screen transition-bg flex flex-col safe-area-top"
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
