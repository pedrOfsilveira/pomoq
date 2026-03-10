import { ref } from 'vue'

// Shared state across all composable instances
const deferredPrompt = ref<Event | null>(null)
const canInstall = ref(false)
const isInstalled = ref(false)

if (typeof window !== 'undefined') {
  if (window.matchMedia('(display-mode: standalone)').matches) {
    isInstalled.value = true
  }

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    console.log('[PWA] beforeinstallprompt captured ✓')
    e.preventDefault()
    deferredPrompt.value = e
    canInstall.value = true
  })

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] appinstalled fired ✓')
    isInstalled.value = true
    canInstall.value = false
    deferredPrompt.value = null
  })
}

export function usePwaInstall() {
  const STORAGE_KEY = 'pomoq-pwa-install-prompted'

  const hasBeenPrompted = () => localStorage.getItem(STORAGE_KEY) === 'true'
  const markAsPrompted = () => localStorage.setItem(STORAGE_KEY, 'true')

  function setupListeners() {}
  function teardownListeners() {}

  async function triggerInstall() {
    if (!deferredPrompt.value) {
      console.warn('[PWA] triggerInstall called but deferredPrompt is null')
      return false
    }
    const promptEvent = deferredPrompt.value as BeforeInstallPromptEvent
    await promptEvent.prompt()
    const { outcome } = await promptEvent.userChoice
    console.log('[PWA] User choice:', outcome)
    deferredPrompt.value = null
    canInstall.value = false
    markAsPrompted()
    return outcome === 'accepted'
  }

  return {
    deferredPrompt,
    canInstall,
    isInstalled,
    hasBeenPrompted,
    markAsPrompted,
    setupListeners,
    teardownListeners,
    triggerInstall,
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
