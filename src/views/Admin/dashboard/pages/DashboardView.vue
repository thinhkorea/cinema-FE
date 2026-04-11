<template>
  <div class="container py-4">
    <div class="row g-3 mb-5">
      <div class="col-md-3" v-for="item in stats" :key="item.title">
        <div class="card shadow-sm text-center border-0">
          <div class="card-body">
            <h6 class="text-muted">{{ item.title }}</h6>
            <h3 class="fw-bold">{{ item.value }}</h3>
          </div>
        </div>
      </div>
    </div>

    <!-- Biểu đồ doanh thu -->
    <div class="full-width-section mb-5">
      <h5 class="mb-3 d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center">
          <i class="bi bi-graph-up me-2 text-primary"></i>
          <span>Thống kê doanh thu theo năm</span>
        </div>

        <!-- Dropdown chọn năm -->
        <div class="d-flex align-items-center">
          <select
            v-model="selectedYear"
            class="form-select form-select-sm me-3"
            style="width: auto"
            @change="fetchRevenue"
          >
            <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
          </select>
          <span class="text-success fw-semibold">
            Tháng hiện tại: {{ currentMonthRevenue.toLocaleString() }}₫
          </span>
        </div>
      </h5>

      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary"></div>
      </div>

      <div v-else class="chart-wrapper">
        <LineChart :data="chartData" :options="chartOptions" />
      </div>
    </div>

    <!-- Top phim & Top nhân viên -->
    <div class="row g-4">
      <!-- Top phim -->
      <div class="col-lg-6">
        <div class="full-width-section h-100">
          <h5 class="mb-4 d-flex align-items-center">
            <i class="bi bi-trophy me-2 text-warning"></i> Top phim theo doanh thu
          </h5>

          <div v-if="loadingMovies" class="text-center py-4">
            <div class="spinner-border text-warning"></div>
          </div>

          <div v-else>
            <table class="table table-hover align-middle text-center">
              <thead class="table-light">
                <tr>
                  <th>#</th>
                  <th>Tên phim</th>
                  <th>Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(m, i) in topMovies" :key="i">
                  <td>{{ i + 1 }}</td>
                  <td class="fw-semibold">{{ m.movieTitle }}</td>
                  <td class="text-success fw-bold">{{ m.revenue.toLocaleString() }}₫</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Top nhân viên -->
      <div class="col-lg-6">
        <div class="full-width-section h-100">
          <h5 class="mb-4 d-flex align-items-center">
            <i class="bi bi-person-workspace me-2 text-info"></i> Top nhân viên theo doanh thu bán vé
          </h5>

          <div v-if="loadingStaffs" class="text-center py-4">
            <div class="spinner-border text-info"></div>
          </div>

          <div v-else>
            <table class="table table-hover align-middle text-center">
              <thead class="table-light">
                <tr>
                  <th>#</th>
                  <th>Nhân viên</th>
                  <th>Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(s, i) in topStaffs" :key="i">
                  <td>{{ i + 1 }}</td>
                  <td class="fw-semibold">{{ s.staffName }}</td>
                  <td class="text-primary fw-bold">{{ s.totalRevenue.toLocaleString() }}₫</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '@/api'
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

// Các thống kê
const stats = reactive([
  { title: 'Movies', value: 0 },
  { title: 'Rooms', value: 0 },
  { title: 'Showtimes', value: 0 },
  { title: 'Bookings', value: 0 }
])

// 📊 Biểu đồ doanh thu
const chartData = ref({
  labels: [],
  datasets: [
    {
      label: 'Doanh thu (VNĐ)',
      data: [],
      borderColor: '#ff6b35',
      backgroundColor: 'rgba(255, 107, 53, 0.2)',
      tension: 0.3,
      fill: true,
      pointRadius: 5
    }
  ]
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' },
    title: { display: false }
  },
  scales: {
    y: { beginAtZero: true, ticks: { callback: v => v.toLocaleString() + '₫' } }
  }
}

// 🗓 Năm & doanh thu tháng hiện tại
const years = ref([2023, 2024, 2025])
const selectedYear = ref(new Date().getFullYear())
const currentMonthRevenue = ref(0)
const loading = ref(true)

// Top phim
const topMovies = ref([])
const loadingMovies = ref(true)

// Top nhân viên
const topStaffs = ref([])
const loadingStaffs = ref(true)

// API
const fetchStats = async () => {
  const res = await api.get('/admin/dashboard')
  stats[0].value = res.data.movies
  stats[1].value = res.data.rooms
  stats[2].value = res.data.showtimes
  stats[3].value = res.data.bookings
}

const fetchRevenue = async () => {
  loading.value = true
  try {
    const { data } = await api.get(`/admin/revenue?year=${selectedYear.value}`)
    chartData.value.labels = data.map(r => 'Tháng ' + r.month)
    chartData.value.datasets[0].data = data.map(r => r.revenue)

    const nowMonth = new Date().getMonth() + 1
    const current = data.find(r => r.month === nowMonth)
    currentMonthRevenue.value = current ? current.revenue : 0
  } catch (err) {
    console.error('Error loading revenue:', err)
  } finally {
    loading.value = false
  }
}

const fetchTopMovies = async () => {
  loadingMovies.value = true
  try {
    const { data } = await api.get('/admin/revenue/movies')
    topMovies.value = data
  } catch (err) {
    console.error('Error loading top movies:', err)
  } finally {
    loadingMovies.value = false
  }
}

const fetchTopStaffs = async () => {
  loadingStaffs.value = true
  try {
    const { data } = await api.get('/admin/revenue/staffs')
    topStaffs.value = data
  } catch (err) {
    console.error('Error loading top staffs:', err)
  } finally {
    loadingStaffs.value = false
  }
}

// 🚀 Khi component mount
onMounted(async () => {
  await fetchStats()
  await fetchRevenue()
  await fetchTopMovies()
  await fetchTopStaffs()
})
</script>

<style scoped>
.card {
  border-radius: 10px;
  background: #fff;
}

.full-width-section {
  width: 100%;
  background: #fff;
  padding: 2rem;
  border-radius: 14px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.1);
  margin-top: 2rem;
}

.chart-wrapper {
  width: 100%;
  height: 520px;
}

@media (max-width: 992px) {
  .chart-wrapper {
    height: 400px;
  }
}
</style>
