// Handle Vite chunk preload errors caused by stale cached index.html after deployments
window.addEventListener('vite:preloadError', () => {
  const reloadKey = 'vite-preload-reload'
  if (!sessionStorage.getItem(reloadKey)) {
    sessionStorage.setItem(reloadKey, '1')
    window.location.reload()
  }
})

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import * as Sentry from '@sentry/vue'

import App from './App.vue'
import router from './router'
import './assets/main.css'

import { inject } from "@vercel/analytics"

inject()
const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

const sentryDsn = import.meta.env.VITE_SENTRY_DSN
if (sentryDsn) {
  const traceRate = Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? '0.2')
  Sentry.init({
    app,
    dsn: sentryDsn,
    integrations: [Sentry.browserTracingIntegration({ router })],
    tracesSampleRate: Number.isFinite(traceRate) ? traceRate : 0.2,
    environment: import.meta.env.MODE,
  })
}

// Initialize auth before mounting the app
import { useAuthStore } from './stores/auth'
const auth = useAuthStore()
auth.initialize().finally(() => {
  app.mount('#app')
})
