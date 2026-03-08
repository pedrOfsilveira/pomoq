<script setup lang="ts">
const props = defineProps<{
  value: number
  max: number
  size?: 'sm' | 'md' | 'lg'
  color?: string
}>()
</script>

<template>
  <div class="w-full">
    <div
      class="w-full rounded-full overflow-hidden bg-white/20"
      :class="[size === 'lg' ? 'h-4' : size === 'sm' ? 'h-1.5' : 'h-2.5']"
    >
      <div
        class="h-full rounded-full transition-all duration-500 ease-out"
        :class="color || 'bg-white'"
        :style="{ width: `${max > 0 ? Math.min((value / max) * 100, 100) : 0}%` }"
      />
    </div>
  </div>
</template>
