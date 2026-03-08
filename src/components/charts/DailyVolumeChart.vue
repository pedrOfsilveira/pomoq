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
  data: { date: string; totalQuestions: number; sessions: number }[]
}>()

function formatDateLabel(dateStr: string) {
  const [, month, day] = dateStr.split('-')
  return `${day}/${month}`
}

const chartData = computed(() => ({
  labels: props.data.map((d) => formatDateLabel(d.date)),
  datasets: [
    {
      label: 'Questões',
      data: props.data.map((d) => d.totalQuestions),
      borderColor: 'rgba(255, 255, 255, 0.9)',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      fill: true,
      tension: 0.35,
      pointRadius: 3,
      pointBackgroundColor: '#fff',
      yAxisID: 'y',
    },
    {
      label: 'Sessões',
      data: props.data.map((d) => d.sessions),
      borderColor: 'rgba(76, 175, 80, 0.8)',
      backgroundColor: 'transparent',
      borderDash: [5, 3],
      tension: 0.35,
      pointRadius: 3,
      pointBackgroundColor: '#4caf50',
      yAxisID: 'y1',
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
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
    },
  },
  scales: {
    x: {
      ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 } },
      grid: { color: 'rgba(255,255,255,0.05)' },
    },
    y: {
      type: 'linear' as const,
      position: 'left' as const,
      beginAtZero: true,
      ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 } },
      grid: { color: 'rgba(255,255,255,0.05)' },
      title: {
        display: true,
        text: 'Questões',
        color: 'rgba(255,255,255,0.4)',
        font: { size: 10 },
      },
    },
    y1: {
      type: 'linear' as const,
      position: 'right' as const,
      beginAtZero: true,
      ticks: { color: 'rgba(76,175,80,0.6)', font: { size: 10 }, stepSize: 1 },
      grid: { display: false },
      title: { display: true, text: 'Sessões', color: 'rgba(76,175,80,0.4)', font: { size: 10 } },
    },
  },
}
</script>

<template>
  <div class="h-[220px]">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>
