<script setup lang="ts">
import { ref } from 'vue'
import { usePwaInstall } from '@/composables/usePwaInstall'

defineProps<{ visible: boolean }>()
const emit = defineEmits<{
  close: []
}>()

const { triggerInstall } = usePwaInstall()

const installing = ref(false)

async function handleInstall() {
  if (installing.value) return
  installing.value = true
  try {
    await triggerInstall()
  } finally {
    installing.value = false
    emit('close')
  }
}

function handleDismiss() {
  if (installing.value) return
  emit('close')
}
</script>

<template>
  <Transition name="pwa-prompt">
    <div
      v-if="visible"
      class="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="!installing && handleDismiss()" />

      <!-- Card -->
      <div class="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        <!-- Top accent bar -->
        <div class="h-1.5 w-full bg-gradient-to-r from-pomo-red via-pomo-blue to-pomo-green" />

        <div class="p-6">
          <!-- Icon + Title -->
          <div class="flex items-center gap-4 mb-4">
            <div
              class="flex-shrink-0 w-14 h-14 rounded-2xl bg-pomo-red flex items-center justify-center shadow-md"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="w-7 h-7"
              >
                <path d="M21 2v6h-6" />
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                <path d="M3 22v-6h6" />
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-bold text-text-primary leading-tight">Instalar PomoQ</h2>
              <p class="text-sm text-text-secondary mt-0.5">Acesso rápido, funciona offline</p>
            </div>
          </div>

          <!-- Benefits -->
          <ul class="space-y-2 mb-6">
            <li class="flex items-center gap-3 text-sm text-text-secondary">
              <span
                class="flex-shrink-0 w-5 h-5 rounded-full bg-pomo-green/15 flex items-center justify-center"
              >
                <svg
                  class="w-3 h-3 text-pomo-green"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              Abre direto da tela inicial
            </li>
            <li class="flex items-center gap-3 text-sm text-text-secondary">
              <span
                class="flex-shrink-0 w-5 h-5 rounded-full bg-pomo-green/15 flex items-center justify-center"
              >
                <svg
                  class="w-3 h-3 text-pomo-green"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              Sem barra do navegador — tela cheia
            </li>
            <li class="flex items-center gap-3 text-sm text-text-secondary">
              <span
                class="flex-shrink-0 w-5 h-5 rounded-full bg-pomo-green/15 flex items-center justify-center"
              >
                <svg
                  class="w-3 h-3 text-pomo-green"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              Mais rápido e responsivo
            </li>
          </ul>

          <!-- Actions -->
          <div class="flex gap-3">
            <button
              class="flex-1 bg-pomo-red text-white font-semibold text-sm py-3 px-4 rounded-xl active:scale-95 transition-transform disabled:opacity-60"
              :disabled="installing"
              @click="handleInstall"
            >
              {{ installing ? 'Instalando…' : 'Instalar' }}
            </button>
            <button
              class="flex-1 border border-border text-text-secondary font-medium text-sm py-3 px-4 rounded-xl active:scale-95 transition-transform"
              @click="handleDismiss"
            >
              Agora não
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.pwa-prompt-enter-active {
  transition:
    opacity 0.25s ease,
    transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.pwa-prompt-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.pwa-prompt-enter-from {
  opacity: 0;
  transform: translateY(40px);
}
.pwa-prompt-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
