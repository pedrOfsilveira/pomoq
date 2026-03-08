import { ref, onMounted, onUnmounted } from 'vue'

// Shared state across the app
const deferredPrompt = ref<Event | null>(null)
const canInstall = ref(false)
const isInstalled = ref(false)

let promptHandler: ((e: Event) => void) | null = null
let appInstalledHandler: (() => void) | null = null

export function usePwaInstall() {
  const STORAGE_KEY = 'pomoq-pwa-install-prompted'

  const hasBeenPrompted = () => localStorage.getItem(STORAGE_KEY) === 'true'
  const markAsPrompted = () => localStorage.setItem(STORAGE_KEY, 'true')

  function setupListeners() {
    // Check if already running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      isInstalled.value = true
      return
    }

    promptHandler = (e: Event) => {
      e.preventDefault()
      deferredPrompt.value = e
      canInstall.value = true
    }

    appInstalledHandler = () => {
      isInstalled.value = true
      canInstall.value = false
      deferredPrompt.value = null
      markAsPrompted()
    }

    window.addEventListener('beforeinstallprompt', promptHandler)
    window.addEventListener('appinstalled', appInstalledHandler)
  }

  function teardownListeners() {
    if (promptHandler) window.removeEventListener('beforeinstallprompt', promptHandler)
    if (appInstalledHandler) window.removeEventListener('appinstalled', appInstalledHandler)
  }

  async function triggerInstall() {
    if (!deferredPrompt.value) return false
    const promptEvent = deferredPrompt.value as BeforeInstallPromptEvent
    promptEvent.prompt()
    const { outcome } = await promptEvent.userChoice
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

// Extend Window type for TypeScript
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
