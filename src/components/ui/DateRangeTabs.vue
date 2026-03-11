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
  <div class="w-full sm:w-auto">
    <div class="grid grid-cols-4 rounded-lg bg-white/5 p-1 sm:inline-flex sm:min-w-0">
      <button
        v-for="option in options"
        :key="option.value"
        class="min-w-0 px-2 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer text-center sm:px-3"
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
  </div>
</template>