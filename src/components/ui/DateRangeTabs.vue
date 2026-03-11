<script setup lang="ts">
import type { HistoryRange } from '@/stores/history'

const model = defineModel<HistoryRange>({ required: true })

const options: { value: HistoryRange; label: string }[] = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: 'all', label: 'Tudo' },
]
</script>

<template>
  <div class="inline-flex rounded-lg bg-white/5 p-1">
    <button
      v-for="option in options"
      :key="option.value"
      class="px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer"
      :class="
        model === option.value
          ? 'bg-white text-gray-900'
          : 'text-white/70 hover:text-white'
      "
      @click="model = option.value"
    >
      {{ option.label }}
    </button>
  </div>
</template>