<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AppButton from '@/components/ui/AppButton.vue'
import { ChevronLeft } from 'lucide-vue-next'

const auth = useAuthStore()

const displayName = ref('')
const questionsPerBlock = ref(5)
const disciplines = ref<string[]>([])
const saving = ref(false)
const saved = ref(false)
const saveError = ref('')
const newDiscipline = ref('')

const defaultDisciplines = [
  'Matemática',
  'Português',
  'Ciências Humanas',
  'Ciências da Natureza',
  'Redação',
  'Inglês',
]

onMounted(() => {
  if (auth.profile) {
    displayName.value = auth.profile.display_name || ''
    questionsPerBlock.value = auth.profile.default_questions_per_block
    disciplines.value = [...auth.profile.default_disciplines]
  }
})

function toggleDiscipline(d: string) {
  const idx = disciplines.value.indexOf(d)
  if (idx > -1) {
    disciplines.value.splice(idx, 1)
  } else {
    disciplines.value.push(d)
  }
}

function addDiscipline() {
  const name = newDiscipline.value.trim()
  if (name && !disciplines.value.includes(name)) {
    disciplines.value.push(name)
    newDiscipline.value = ''
  }
}

function removeDiscipline(d: string) {
  const idx = disciplines.value.indexOf(d)
  if (idx > -1) disciplines.value.splice(idx, 1)
}

async function save() {
  saving.value = true
  saved.value = false
  saveError.value = ''
  try {
    await auth.updateProfile({
      display_name: displayName.value,
      default_questions_per_block: questionsPerBlock.value,
      default_disciplines: disciplines.value,
    })
    saved.value = true
    setTimeout(() => {
      saved.value = false
    }, 2000)
  } catch (e: any) {
    saveError.value = e.message || 'Erro ao salvar configurações'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="flex-1 flex flex-col items-center px-4 py-6">
    <div class="w-full max-w-[480px]">
      <!-- Title -->
      <div class="flex items-center gap-3 mb-6">
        <router-link to="/" class="text-white/70 hover:text-white transition-colors">
          <ChevronLeft class="w-5 h-5" :stroke-width="2" />
        </router-link>
        <h1 class="text-2xl font-bold text-white">Configurações</h1>
      </div>

      <!-- Profile -->
      <div class="bg-white/10 rounded-2xl p-6 mb-6">
        <h2 class="text-white/80 text-xs uppercase tracking-wider mb-4">Perfil</h2>

        <div class="flex items-center gap-4 mb-4">
          <img
            v-if="auth.avatarUrl"
            :src="auth.avatarUrl"
            :alt="auth.displayName"
            class="w-14 h-14 rounded-full"
          />
          <div
            v-else
            class="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold"
          >
            {{ (displayName || 'E')[0]?.toUpperCase() }}
          </div>
          <div>
            <div class="text-white font-medium">{{ auth.user?.email }}</div>
            <div class="text-white/70 text-sm">Google Account</div>
          </div>
        </div>

        <label class="block mb-1 text-white/70 text-sm">Nome de exibição</label>
        <input
          v-model="displayName"
          type="text"
          class="w-full bg-white/10 text-white placeholder-white/50 rounded-lg px-3 py-2 text-sm border-0 outline-none focus:ring-2 focus:ring-white/30"
        />
      </div>

      <!-- Study defaults -->
      <div class="bg-white/10 rounded-2xl p-6 mb-6">
        <h2 class="text-white/80 text-xs uppercase tracking-wider mb-4">Padrões de Estudo</h2>

        <label class="block mb-2 text-white/70 text-sm">
          Questões por bloco: <strong class="text-white">{{ questionsPerBlock }}</strong>
        </label>
        <input
          v-model.number="questionsPerBlock"
          type="range"
          min="1"
          max="10"
          class="w-full accent-white mb-6"
        />

        <label class="block mb-2 text-white/70 text-sm">Disciplinas padrão</label>
        <div class="flex flex-wrap gap-2 mb-3">
          <button
            v-for="d in defaultDisciplines"
            :key="d"
            @click="toggleDiscipline(d)"
            class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
            :class="
              disciplines.includes(d)
                ? 'bg-white text-gray-800'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            "
          >
            {{ d }}
          </button>
        </div>

        <!-- Custom disciplines -->
        <div class="flex gap-2 mb-3">
          <input
            v-model="newDiscipline"
            @keyup.enter="addDiscipline"
            type="text"
            placeholder="Adicionar disciplina..."
            class="flex-1 bg-white/10 text-white placeholder-white/50 rounded-lg px-3 py-2 text-sm border-0 outline-none focus:ring-2 focus:ring-white/30"
          />
          <button
            @click="addDiscipline"
            class="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors cursor-pointer"
          >
            +
          </button>
        </div>

        <div
          v-if="disciplines.some((d) => !defaultDisciplines.includes(d))"
          class="flex flex-wrap gap-2"
        >
          <span
            v-for="d in disciplines.filter((d) => !defaultDisciplines.includes(d))"
            :key="d"
            class="inline-flex items-center gap-1 px-2 py-1 bg-white/20 text-white rounded text-xs"
          >
            {{ d }}
            <button @click="removeDiscipline(d)" class="hover:text-red-300 cursor-pointer">
              &times;
            </button>
          </span>
        </div>
      </div>

      <!-- Save -->
      <AppButton class="w-full" size="lg" :loading="saving" @click="save">
        {{ saved ? 'Salvo!' : 'Salvar Configurações' }}
      </AppButton>

      <p v-if="saveError" class="mt-3 text-red-300 text-sm text-center">
        {{ saveError }}
      </p>
    </div>
  </div>
</template>
