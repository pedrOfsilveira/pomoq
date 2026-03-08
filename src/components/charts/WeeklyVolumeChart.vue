<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
)

const props = defineProps<{
  data: { weekLabel: string; totalQuestions: number; totalCorrect: number; sessions: number }[]
}>()

const chartData = computed(() => ({
  labels: props.data.map((d) => d.weekLabel),
  datasets: [
    {
      label: 'Questões',
      data: props.data.map((d) => d.totalQuestions),
      borderColor: 'rgba(255, 255, 255, 0.7)',
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      pointBackgroundColor: 'rgba(255, 255, 255, 0.9)',
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.3,
      fill: true,
      borderWidth: 2,
    },
    {
      label: 'Acertos',
      data: props.data.map((d) => d.totalCorrect),
      borderColor: 'rgba(76, 175, 80, 0.7)',
      backgroundColor: 'rgba(76, 175, 80, 0.08)',
      pointBackgroundColor: 'rgba(76, 175, 80, 0.9)',
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.3,
      fill: true,
      borderWidth: 2,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      labels: { color: 'rgba(255,255,255,0.6)', font: { size: 10 }, boxWidth: 12 },
    },
    tooltip: {
      backgroundColor: 'rgba(0,0,0,0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      callbacks: {
        afterBody: (ctx: any) => {
          const idx = ctx[0]?.dataIndex
          const item = props.data[idx]
          return item ? `Sessões: ${item.sessions}` : ''
        },
      },
    },
  },
  scales: {
    x: {
      ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 } },
      grid: { display: false },
    },
    y: {
      beginAtZero: true,
      ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 } },
      grid: { color: 'rgba(255,255,255,0.05)' },
    },
  },
}
</script>

<template>
  <div class="h-[220px]">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>
