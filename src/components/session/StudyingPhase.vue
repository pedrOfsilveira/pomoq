<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSessionStore } from '@/stores/session'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import AppButton from '@/components/ui/AppButton.vue'
import EnergyBadge from '@/components/ui/EnergyBadge.vue'
import { ArrowRight } from 'lucide-vue-next'

const session = useSessionStore()
const showConfirmEnd = ref(false)

// Large display: questions done / target
const displayDone = computed(() =>
  String((session.currentCycle?.questionsDone ?? 0) + 1).padStart(2, '0'),
)
const displayTarget = computed(() =>
  String(session.currentCycle?.questionsTarget ?? 0).padStart(2, '0'),
)

function nextQuestion() {
  session.recordAnswer()
}

function confirmEnd() {
  showConfirmEnd.value = true
}

function cancelEnd() {
  showConfirmEnd.value = false
}

async function doEnd() {
  showConfirmEnd.value = false
  await session.endSession()
}
</script>

<template>
  <div class="text-center">
    <!-- Discipline indicator -->
    <div class="mb-4">
      <div class="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
        <span class="text-white/70 text-xs uppercase tracking-wider"
          >Ciclo {{ session.currentCycle?.cycleNumber }}</span
        >
        <span class="text-white/60">•</span>
        <span class="text-white font-semibold text-sm">{{ session.currentDiscipline }}</span>
      </div>
    </div>

    <!-- Last energy level -->
    <div v-if="session.lastEnergy" class="flex justify-center mb-4">
      <EnergyBadge :level="session.lastEnergy" size="sm" />
    </div>

    <!-- Main display (Pomofocus-style large numbers) -->
    <div class="bg-white/10 rounded-2xl p-10 mb-6">
      <div class="text-[7rem] leading-none font-extrabold text-white tabular-nums">
        {{ displayDone }}
      </div>
      <div class="text-white/60 text-lg mt-2">de {{ displayTarget }} questões</div>

      <!-- Progress bar -->
      <div class="mt-6">
        <ProgressBar
          :value="session.currentCycle?.questionsDone ?? 0"
          :max="session.currentCycle?.questionsTarget ?? 1"
          size="md"
        />
      </div>
    </div>

    <!-- Next question button -->
    <div class="mb-4">
      <button
        class="btn-answer btn-answer--next inline-flex items-center justify-center font-semibold rounded-lg w-full py-4 text-lg text-white cursor-pointer transition-all duration-150"
        @click="nextQuestion"
      >
        Próxima questão
        <ArrowRight class="w-5 h-5 ml-2" :stroke-width="2.5" />
      </button>
    </div>

    <!-- Session info bar -->
    <div class="flex justify-center gap-6 text-white/70 text-xs mb-6">
      <span>Total: {{ session.totalQuestions }} questões</span>
      <span>Ciclos: {{ session.totalCycles }}</span>
    </div>

    <!-- Discipline rotation preview -->
    <div class="bg-white/10 rounded-xl p-4 mb-6">
      <p class="text-white/70 text-xs uppercase tracking-wider mb-2">Rotação de disciplinas</p>
      <div class="flex justify-center gap-2 flex-wrap">
        <span
          v-for="(d, i) in session.disciplines"
          :key="d"
          class="px-2 py-1 rounded text-xs font-medium"
          :class="
            i === session.currentDisciplineIndex
              ? 'bg-white text-gray-800'
              : 'bg-white/10 text-white/70'
          "
        >
          {{ d }}
        </span>
      </div>
    </div>

    <!-- End session -->
    <div v-if="!showConfirmEnd">
      <button
        @click="confirmEnd"
        class="text-white/60 hover:text-white/80 text-sm transition-colors cursor-pointer underline bg-transparent border-none"
      >
        Encerrar sessão
      </button>
    </div>

    <!-- Confirm end dialog -->
    <div v-else class="bg-white/10 rounded-xl p-4">
      <p class="text-white text-sm mb-3">Tem certeza que deseja encerrar?</p>
      <div class="flex gap-2 justify-center">
        <AppButton variant="secondary" size="sm" @click="cancelEnd"> Cancelar </AppButton>
        <button
          class="px-3 py-1.5 text-xs font-semibold rounded-lg btn-answer--red text-white cursor-pointer transition-colors"
          @click="doEnd"
        >
          Encerrar
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.btn-answer {
  box-shadow: 0 5px 0 var(--btn-shadow);
}
.btn-answer:active {
  box-shadow: none;
  transform: translateY(5px);
}

.btn-answer--next {
  --btn-shadow: oklch(0.35 0.05 250);
  background: oklch(0.48 0.08 250);
}
.btn-answer--next:hover {
  background: oklch(0.52 0.08 250);
}
</style>
