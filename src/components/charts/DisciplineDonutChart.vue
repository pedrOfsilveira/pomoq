<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const props = defineProps<{
  data: { discipline: string; totalQuestions: number; accuracy: number }[]
}>()

const sorted = computed(() => [...props.data].sort((a, b) => b.totalQuestions - a.totalQuestions))

const chartData = computed(() => ({
  labels: sorted.value.map((d) => d.discipline),
  datasets: [
    {
      label: 'Questões',
      data: sorted.value.map((d) => d.totalQuestions),
      backgroundColor: 'rgba(255, 255, 255, 0.55)',
      borderRadius: 4,
      barPercentage: 0.65,
      categoryPercentage: 0.8,
    },
    {
      label: 'Acertos',
      data: sorted.value.map((d) => Math.round((d.totalQuestions * d.accuracy) / 100)),
      backgroundColor: 'rgba(76, 175, 80, 0.55)',
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
    legend: {
      display: true,
      position: 'top' as const,
      labels: {
        color: 'rgba(255,255,255,0.6)',
        font: { size: 10 },
        boxWidth: 12,
        padding: 12,
      },
    },
    tooltip: {
      backgroundColor: 'rgba(0,0,0,0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      callbacks: {
        afterBody: (ctx: any) => {
          const idx = ctx[0]?.dataIndex
          const item = sorted.value[idx]
          return item ? `Precisão: ${item.accuracy}%` : ''
        },
      },
    },
  },
  scales: {
    x: {
      beginAtZero: true,
      ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 } },
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
