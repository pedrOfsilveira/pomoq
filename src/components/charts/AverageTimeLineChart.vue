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
import { formatDuration } from '@/utils/duration'

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
  data: { date: string; avgSeconds: number; questions: number }[]
}>()

function formatDateLabel(dateStr: string) {
  const [, month, day] = dateStr.split('-')
  return `${day}/${month}`
}

const maxValue = computed(() =>
  props.data.reduce((max, item) => Math.max(max, item.avgSeconds), 0),
)

const chartData = computed(() => ({
  labels: props.data.map((d) => formatDateLabel(d.date)),
  datasets: [
    {
      label: 'Tempo médio',
      data: props.data.map((d) => d.avgSeconds),
      borderColor: 'rgba(129, 140, 248, 0.95)',
      backgroundColor: 'rgba(129, 140, 248, 0.12)',
      fill: true,
      tension: 0.35,
      pointRadius: 4,
      pointBackgroundColor: '#a5b4fc',
      pointBorderColor: 'rgba(165, 180, 252, 0.95)',
      pointHoverRadius: 6,
    },
  ],
}))

const chartOptions = computed(() => ({
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
          return [
            `Tempo médio: ${formatDuration(item?.avgSeconds ?? 0)}`,
            `Questões: ${item?.questions ?? 0}`,
          ]
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
      beginAtZero: true,
      suggestedMax: Math.max(maxValue.value + 10, 60),
      ticks: {
        color: 'rgba(255,255,255,0.5)',
        font: { size: 10 },
        callback: (v: number | string) => formatDuration(Number(v)),
      },
      grid: { color: 'rgba(255,255,255,0.05)' },
    },
  },
}))
</script>

<template>
  <div class="h-[220px]">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>
