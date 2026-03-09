<script setup lang="ts">
import { ref, computed } from 'vue'
import * as Sentry from '@sentry/vue'
import { useSessionStore, type ErrorReason, type ReviewEntry } from '@/stores/session'
import AppButton from '@/components/ui/AppButton.vue'
import { ClipboardList, Check, X, EyeOff, BookOpen, MessageSquare } from 'lucide-vue-next'

const session = useSessionStore()

interface QuestionEntry {
  isCorrect: boolean | null
  errorReason: ErrorReason | null
  contentNote: string
}

const total = computed(() => session.currentCycle?.questionsDone ?? 0)
const submitting = ref(false)
const submitError = ref('')

const entries = ref<QuestionEntry[]>(
  Array.from({ length: total.value }, () => ({
    isCorrect: null,
    errorReason: null,
    contentNote: '',
  })),
)

const canSubmit = computed(
  () =>
    entries.value.every((e) => e.isCorrect !== null) &&
    entries.value.filter((e) => e.isCorrect === false).every((e) => e.errorReason !== null),
)

const pendingCount = computed(
  () =>
    entries.value.filter((e) => e.isCorrect === null).length +
    entries.value.filter((e) => e.isCorrect === false && e.errorReason === null).length,
)

interface ErrorOption {
  value: ErrorReason
  label: string
  icon: typeof EyeOff
}

const errorOptions: ErrorOption[] = [
  { value: 'attention', label: 'Falta de atenção', icon: EyeOff },
  { value: 'content_gap', label: 'Lacuna no conteúdo', icon: BookOpen },
  { value: 'interpretation', label: 'Interpretação', icon: MessageSquare },
]

function setCorrect(index: number, correct: boolean) {
  const entry = entries.value[index]!
  entry.isCorrect = correct
  if (correct) {
    entry.errorReason = null
    entry.contentNote = ''
  }
}

function selectReason(index: number, reason: ErrorReason) {
  entries.value[index]!.errorReason = reason
}

async function submit() {
  if (submitting.value) return
  submitting.value = true
  submitError.value = ''
  const reviews: ReviewEntry[] = entries.value.map((e) => ({
    correct: e.isCorrect === true,
    errorReason: e.errorReason ?? undefined,
    contentNote: e.contentNote.trim() || undefined,
  }))
  try {
    await session.submitReview(reviews)
  } catch (e: any) {
    Sentry.captureException(e)
    submitError.value = e?.message || 'Falha ao salvar correção. Tente novamente.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="text-center">
    <!-- Header -->
    <div class="mb-6">
      <ClipboardList class="w-7 h-7 mx-auto mb-2 text-white/80" :stroke-width="1.5" />
      <h2 class="text-2xl font-bold text-white mb-1">Correção</h2>
      <p class="text-white/70 text-sm">
        {{ total !== 1 ? `${total} questões` : '1 questão' }} de
        <strong class="text-white">{{ session.currentDiscipline }}</strong>
      </p>
    </div>

    <!-- Question cards -->
    <div class="space-y-3 mb-6 text-left">
      <div
        v-for="(entry, i) in entries"
        :key="i"
        class="rounded-2xl p-4 transition-colors"
        :class="
          entry.isCorrect === true
            ? 'bg-green-500/15'
            : entry.isCorrect === false
              ? 'bg-red-500/15'
              : 'bg-white/10'
        "
      >
        <!-- Question label + acertei/errei row -->
        <div class="flex items-center justify-between">
          <span class="text-white font-semibold text-sm">Questão {{ i + 1 }}</span>
          <div class="flex gap-2">
            <button
              @click="setCorrect(i, true)"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer border"
              :class="
                entry.isCorrect === true
                  ? 'bg-green-500 border-green-400 text-white'
                  : 'bg-white/10 border-transparent text-white/70 hover:bg-white/20'
              "
            >
              <Check class="w-3.5 h-3.5" :stroke-width="2.5" />
              Acertei
            </button>
            <button
              @click="setCorrect(i, false)"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer border"
              :class="
                entry.isCorrect === false
                  ? 'bg-red-500 border-red-400 text-white'
                  : 'bg-white/10 border-transparent text-white/70 hover:bg-white/20'
              "
            >
              <X class="w-3.5 h-3.5" :stroke-width="2.5" />
              Errei
            </button>
          </div>
        </div>

        <!-- Error reason (only if wrong) -->
        <Transition name="fade-slide">
          <div v-if="entry.isCorrect === false" class="mt-3 pt-3 border-t border-white/10">
            <p class="text-white/60 text-xs mb-2">Por que errou?</p>

            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="opt in errorOptions"
                :key="opt.value"
                @click="selectReason(i, opt.value)"
                class="flex flex-col items-center gap-1.5 p-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer border-2"
                :class="
                  entry.errorReason === opt.value
                    ? 'bg-white text-gray-800 border-white'
                    : 'bg-white/10 text-white/80 border-transparent hover:bg-white/20'
                "
              >
                <component :is="opt.icon" class="w-4 h-4" :stroke-width="1.8" />
                <span class="leading-tight text-center">{{ opt.label }}</span>
              </button>
            </div>

            <!-- Content gap note -->
            <Transition name="fade-slide">
              <div v-if="entry.errorReason === 'content_gap'" class="mt-2">
                <input
                  v-model="entry.contentNote"
                  type="text"
                  placeholder="Qual conteúdo precisa revisar?"
                  class="w-full bg-white/10 text-white placeholder-white/40 rounded-lg px-3 py-2 text-sm border-0 outline-none focus:ring-2 focus:ring-white/30"
                />
              </div>
            </Transition>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Submit -->
    <AppButton class="w-full" size="lg" :disabled="!canSubmit || submitting" :loading="submitting" @click="submit">
      Continuar
    </AppButton>
    <p v-if="submitError" class="text-red-200 text-xs mt-2">
      {{ submitError }}
    </p>
    <p v-if="!canSubmit" class="text-white/50 text-xs mt-2">
      {{ pendingCount !== 1 ? `${pendingCount} questões pendentes` : '1 questão pendente' }}
    </p>
  </div>
</template>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
