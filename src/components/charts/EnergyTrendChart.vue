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
  data: { date: string; green: number; yellow: number; red: number; total: number }[]
}>()

function formatDateLabel(dateStr: string) {
  const [, month, day] = dateStr.split('-')
  return `${day}/${month}`
}

const chartData = computed(() => ({
  labels: props.data.map((d) => formatDateLabel(d.date)),
  datasets: [
    {
      label: 'Verde',
      data: props.data.map((d) => (d.total > 0 ? Math.round((d.green / d.total) * 100) : 0)),
      borderColor: '#4caf50',
      backgroundColor: 'rgba(76,175,80,0.1)',
      fill: true,
      tension: 0.35,
      pointRadius: 3,
      pointBackgroundColor: '#4caf50',
    },
    {
      label: 'Amarelo',
      data: props.data.map((d) => (d.total > 0 ? Math.round((d.yellow / d.total) * 100) : 0)),
      borderColor: '#ffc107',
      backgroundColor: 'rgba(255,193,7,0.1)',
      fill: true,
      tension: 0.35,
      pointRadius: 3,
      pointBackgroundColor: '#ffc107',
    },
    {
      label: 'Vermelho',
      data: props.data.map((d) => (d.total > 0 ? Math.round((d.red / d.total) * 100) : 0)),
      borderColor: '#f44336',
      backgroundColor: 'rgba(244,67,54,0.1)',
      fill: true,
      tension: 0.35,
      pointRadius: 3,
      pointBackgroundColor: '#f44336',
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
        label: (ctx: any) => `${ctx.dataset.label}: ${ctx.raw}%`,
      },
    },
  },
  scales: {
    x: {
      ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 } },
      grid: { color: 'rgba(255,255,255,0.05)' },
    },
    y: {
      min: 0,
      max: 100,
      ticks: {
        color: 'rgba(255,255,255,0.5)',
        font: { size: 10 },
        callback: (v: number | string) => `${v}%`,
      },
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
