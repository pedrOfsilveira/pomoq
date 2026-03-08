<script setup lang="ts">
import type { EnergyLevel } from '@/types/database'

defineProps<{
  level: EnergyLevel
  size?: 'sm' | 'md' | 'lg'
}>()

const labels: Record<EnergyLevel, string> = {
  green: 'Verde',
  yellow: 'Amarelo',
  red: 'Vermelho',
}

const descriptions: Record<EnergyLevel, string> = {
  green: 'Estou bem, posso continuar!',
  yellow: 'Cansando um pouco...',
  red: 'Preciso parar.',
}
</script>

<template>
  <div
    class="flex items-center gap-2 rounded-full px-3 py-1.5 font-medium"
    :class="[
      size === 'lg' ? 'text-base px-4 py-2' : size === 'sm' ? 'text-xs px-2 py-1' : 'text-sm',
      level === 'green'
        ? 'bg-energy-green/20 text-energy-green'
        : level === 'yellow'
          ? 'bg-energy-yellow/20 text-energy-yellow'
          : 'bg-energy-red/20 text-energy-red',
    ]"
  >
    <span
      class="inline-block rounded-full"
      :class="[
        size === 'lg' ? 'w-4 h-4' : size === 'sm' ? 'w-2 h-2' : 'w-3 h-3',
        level === 'green'
          ? 'bg-energy-green'
          : level === 'yellow'
            ? 'bg-energy-yellow'
            : 'bg-energy-red',
      ]"
    />
    <span>{{ labels[level] }}</span>
  </div>
</template>
