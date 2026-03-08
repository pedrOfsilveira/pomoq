<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
}>()
</script>

<template>
  <button
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white/30"
    :class="[
      size === 'sm'
        ? 'px-3 py-1.5 text-xs'
        : size === 'lg'
          ? 'px-8 py-3.5 text-lg'
          : 'px-6 py-3 text-sm',
      variant === 'secondary'
        ? 'bg-white/20 hover:bg-white/30 text-white'
        : variant === 'ghost'
          ? 'bg-transparent hover:bg-white/10 text-white'
          : variant === 'danger'
            ? 'btn-raised btn-danger bg-red-500/80 hover:bg-red-500 text-white'
            : 'btn-raised bg-white text-gray-800 hover:bg-gray-50',
    ]"
  >
    <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
    <slot />
  </button>
</template>

<style scoped>
/* Pomofocus-style 3D raised button */
.btn-raised {
  --btn-shadow: oklch(0.75 0 0);
  box-shadow: 0 5px 0 var(--btn-shadow);
}
.btn-raised:active:not(:disabled) {
  box-shadow: none;
  transform: translateY(5px);
}
.btn-danger {
  --btn-shadow: oklch(0.3 0.1 25);
}
</style>
