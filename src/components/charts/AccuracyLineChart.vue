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
  data: { date: string; accuracy: number; questions: number }[]
}>()

function formatDateLabel(dateStr: string) {
  const [, month, day] = dateStr.split('-')
  return `${day}/${month}`
}

const chartData = computed(() => ({
  labels: props.data.map((d) => formatDateLabel(d.date)),
  datasets: [
    {
      label: 'Precisão (%)',
      data: props.data.map((d) => d.accuracy),
      borderColor: 'rgba(255, 255, 255, 0.9)',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      fill: true,
      tension: 0.35,
      pointRadius: 4,
      pointBackgroundColor: '#fff',
      pointBorderColor: 'rgba(255,255,255,0.9)',
      pointHoverRadius: 6,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(0,0,0,0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      callbacks: {
        label: (ctx: any) => {
          const idx = ctx.dataIndex
          const item = props.data[idx]
          return [`Precisão: ${item?.accuracy ?? 0}%`, `Questões: ${item?.questions ?? 0}`]
        },
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
