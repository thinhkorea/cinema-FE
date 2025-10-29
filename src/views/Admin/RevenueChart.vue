<template>
  <div class="container py-4">
    <h4 class="mb-4 d-flex align-items-center">
      <i class="bi bi-graph-up me-2"></i> Thống kê doanh thu 12 tháng gần nhất
    </h4>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary"></div>
    </div>

    <div v-else class="chart-wrapper">
      <LineChart :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend)

const LineChart = Line

const chartData = ref({
  labels: [],
  datasets: [
    {
      label: 'Doanh thu (VNĐ)',
      data: [],
      borderColor: '#0d6efd',
      backgroundColor: 'rgba(13, 110, 253, 0.2)',
      tension: 0.3,
      fill: true,
      pointRadius: 5
    }
  ]
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false, // ⚡️ Cho phép full width/height
  plugins: {
    legend: { position: 'top' },
    title: { display: false }
  },
  scales: {
    y: { beginAtZero: true, ticks: { callback: v => v.toLocaleString() + '₫' } }
  }
}

const loading = ref(true)

onMounted(async () => {
  try {
    const res = await api.get('/admin/revenue')
    chartData.value.labels = res.data.map(r => r.month)
    chartData.value.datasets[0].data = res.data.map(r => r.revenue)
  } catch (err) {
    console.error('Error loading revenue data:', err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.chart-wrapper {
  width: 100%;
  max-width: 900px;
  height: 450px; /* ⚡️ Tăng chiều cao biểu đồ */
  margin: 0 auto;
  background: #fff;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
</style>
