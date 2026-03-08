<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSessionStore } from '@/stores/session'
import { useAuthStore } from '@/stores/auth'
import AppButton from '@/components/ui/AppButton.vue'

const session = useSessionStore()
const auth = useAuthStore()

// Default disciplines
const defaultDisciplines = [
  'Matemática',
  'Português',
  'Ciências Humanas',
  'Ciências da Natureza',
  'Redação',
  'Inglês',
]

const selectedDisciplines = ref<string[]>(
  auth.profile?.default_disciplines || defaultDisciplines.slice(0, 4),
)
const questionsPerBlock = ref(auth.profile?.default_questions_per_block || 5)
const customDiscipline = ref('')
const loading = ref(false)

const canStart = computed(
  () => selectedDisciplines.value.length >= 2 && questionsPerBlock.value >= 1,
)

function toggleDiscipline(d: string) {
  const idx = selectedDisciplines.value.indexOf(d)
  if (idx > -1) {
    selectedDisciplines.value.splice(idx, 1)
  } else {
    selectedDisciplines.value.push(d)
  }
}

function addCustomDiscipline() {
  const name = customDiscipline.value.trim()
  if (name && !selectedDisciplines.value.includes(name)) {
    selectedDisciplines.value.push(name)
    customDiscipline.value = ''
  }
}

const errorMsg = ref('')

async function start() {
  loading.value = true
  errorMsg.value = ''
  try {
    await session.startSession({
      disciplines: selectedDisciplines.value,
      questionsPerBlock: questionsPerBlock.value,
    })
  } catch (e: any) {
    errorMsg.value = e?.message || 'Erro ao iniciar sessão'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="text-center">
    <!-- Title area (Pomofocus-style centered display) -->
    <div class="bg-white/10 rounded-2xl p-8 mb-6">
      <h2 class="text-white/80 text-sm font-medium uppercase tracking-wider mb-4">
        Nova Sessão de Estudos
      </h2>

      <div
        v-if="errorMsg"
        class="mb-4 bg-red-500/20 border border-red-400/30 rounded-lg px-4 py-2 text-red-200 text-sm"
      >
        {{ errorMsg }}
      </div>

      <div class="text-8xl font-bold text-white mb-2 tabular-nums">
        {{ questionsPerBlock }}
      </div>
      <p class="text-white/70 text-sm">questões por bloco</p>

      <div class="mt-6 px-4">
        <input
          v-model.number="questionsPerBlock"
          type="range"
          min="1"
          max="10"
          class="w-full accent-white"
        />
        <div class="relative w-full text-white/60 text-xs mt-1 h-4">
          <span class="absolute left-0">1</span>
          <span class="absolute left-[44.44%] -translate-x-1/2">5</span>
          <span class="absolute right-0">10</span>
        </div>
      </div>
    </div>

    <!-- Disciplines -->
    <div class="bg-white/10 rounded-2xl p-6 mb-6">
      <h3 class="text-white/80 text-sm font-medium mb-4 text-left">Disciplinas (mínimo 2)</h3>
      <div class="flex flex-wrap gap-2 mb-4">
        <button
          v-for="d in defaultDisciplines"
          :key="d"
          @click="toggleDiscipline(d)"
          class="px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
          :class="
            selectedDisciplines.includes(d)
              ? 'bg-white text-gray-800'
              : 'bg-white/10 text-white/80 hover:bg-white/20'
          "
        >
          {{ d }}
        </button>
      </div>

      <!-- Custom discipline input -->
      <div class="flex gap-2">
        <input
          v-model="customDiscipline"
          @keyup.enter="addCustomDiscipline"
          type="text"
          placeholder="Outra disciplina..."
          class="flex-1 bg-white/10 text-white placeholder-white/50 rounded-lg px-3 py-2 text-sm border-0 outline-none focus:ring-2 focus:ring-white/30"
        />
        <button
          @click="addCustomDiscipline"
          class="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors cursor-pointer"
        >
          +
        </button>
      </div>

      <!-- Selected custom disciplines -->
      <div
        v-if="selectedDisciplines.some((d) => !defaultDisciplines.includes(d))"
        class="mt-3 flex flex-wrap gap-2"
      >
        <span
          v-for="d in selectedDisciplines.filter((d) => !defaultDisciplines.includes(d))"
          :key="d"
          class="inline-flex items-center gap-1 px-3 py-1 bg-white text-gray-800 rounded-lg text-sm font-medium"
        >
          {{ d }}
          <button @click="toggleDiscipline(d)" class="ml-1 hover:text-red-500 cursor-pointer">
            &times;
          </button>
        </span>
      </div>
    </div>

    <!-- How it works -->
    <div class="bg-white/10 rounded-2xl p-6 mb-6 text-left">
      <h3 class="text-white/80 text-sm font-medium mb-3">Como funciona?</h3>
      <ol class="text-white/70 text-sm space-y-2 list-decimal list-inside">
        <li>
          Responda <strong class="text-white/80">{{ questionsPerBlock }} questões</strong> de cada
          disciplina
        </li>
        <li>
          Faça um <strong class="text-white/80">Check-in de Energia</strong> ao final de cada bloco
        </li>
        <li>
          A carga se ajusta automaticamente ao seu
          <strong class="text-white/80">nível de cansaço</strong>
        </li>
        <li>
          Alterne entre
          <strong class="text-white/80">{{ selectedDisciplines.length }} disciplinas</strong> para
          manter o foco
        </li>
      </ol>
    </div>

    <!-- Start button -->
    <AppButton
      class="w-full text-lg"
      size="lg"
      :disabled="!canStart"
      :loading="loading"
      @click="start"
    >
      Iniciar Sessão
    </AppButton>

    <p v-if="!canStart" class="text-white/60 text-xs mt-2">
      Selecione pelo menos 2 disciplinas para começar
    </p>
  </div>
</template>
