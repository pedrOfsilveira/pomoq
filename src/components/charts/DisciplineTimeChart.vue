<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
import { formatDuration } from '@/utils/duration'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const props = defineProps<{
  data: { discipline: string; avgSeconds: number; totalQuestions: number }[]
}>()

const sorted = computed(() => [...props.data].sort((a, b) => b.avgSeconds - a.avgSeconds))

const chartData = computed(() => ({
  labels: sorted.value.map((d) => d.discipline),
  datasets: [
    {
      label: 'Tempo médio',
      data: sorted.value.map((d) => d.avgSeconds),
      backgroundColor: 'rgba(129, 140, 248, 0.6)',
      borderRadius: 4,
      barPercentage: 0.65,
      categoryPercentage: 0.8,
    },
  ],
}))

const chartOptions = {
  indexAxis: 'y' as const,
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(0,0,0,0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      callbacks: {
        label: (ctx: any) => `Tempo médio: ${formatDuration(ctx.raw)}`,
        afterBody: (ctx: any) => {
          const idx = ctx[0]?.dataIndex
          const item = sorted.value[idx]
          return item ? `Questões respondidas: ${item.totalQuestions}` : ''
        },
      },
    },
  },
  scales: {
    x: {
      beginAtZero: true,
      ticks: {
        color: 'rgba(255,255,255,0.5)',
        font: { size: 10 },
        callback: (v: number | string) => formatDuration(Number(v)),
      },
      grid: { color: 'rgba(255,255,255,0.05)' },
    },
    y: {
      ticks: { color: 'rgba(255,255,255,0.7)', font: { size: 11 } },
      grid: { display: false },
    },
  },
}
</script>

<template>
  <div :style="{ height: `${Math.max(180, sorted.length * 48)}px` }">
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>
