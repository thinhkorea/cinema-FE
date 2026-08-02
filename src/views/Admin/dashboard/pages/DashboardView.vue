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
            Tháng hiện tại: {{ formatCurrency(currentMonthRevenue) }}
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

    <!-- Top phim & Top khách hàng -->
    <div class="full-width-section mb-5">
      <h5 class="mb-4 d-flex align-items-center">
        <i class="bi bi-clock-history me-2 text-danger"></i> Doanh thu theo khung giờ
      </h5>

      <div v-if="loadingTimeSlots" class="text-center py-4">
        <div class="spinner-border text-danger"></div>
      </div>

      <div v-else class="time-slot-grid">
        <div v-for="slot in timeSlotRevenue" :key="slot.slot" class="time-slot-card">
          <div class="time-slot-head">
            <div>
              <h6>{{ slot.label }}</h6>
              <span>{{ slot.timeRange }}</span>
            </div>
            <strong>{{ formatCurrency(slot.revenue) }}</strong>
          </div>
          <div class="time-slot-bar">
            <div :style="{ width: `${getTimeSlotPercent(slot.revenue)}%` }"></div>
          </div>
          <div class="time-slot-breakdown">
            <span>Vé: {{ formatCurrency(slot.ticketRevenue) }}</span>
            <span>Bắp nước: {{ formatCurrency(slot.snackRevenue) }}</span>
          </div>
        </div>
      </div>
    </div>

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
                  <td class="text-success fw-bold">{{ formatCurrency(m.revenue) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Top khách hàng -->
      <div class="col-lg-6">
        <div class="full-width-section h-100">
          <h5 class="mb-4 d-flex align-items-center">
            <i class="bi bi-person-heart me-2 text-info"></i>
            Khách hàng tiêu tiền nhiều nhất trong {{ currentMonthLabel }}
          </h5>

          <div v-if="loadingCustomers" class="text-center py-4">
            <div class="spinner-border text-info"></div>
          </div>

          <div v-else>
            <table class="table table-hover align-middle text-center">
              <thead class="table-light">
                <tr>
                  <th>#</th>
                  <th>Khách hàng</th>
                  <th>Email</th>
                  <th>Chi tiêu</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(customer, i) in topCustomers" :key="customer.customerId || i">
                  <td>{{ i + 1 }}</td>
                  <td class="fw-semibold">{{ customer.customerName }}</td>
                  <td class="text-muted">{{ customer.email || '-' }}</td>
                  <td class="text-primary fw-bold">{{ formatCurrency(customer.totalSpent) }}</td>
                </tr>
                <tr v-if="!topCustomers.length">
                  <td colspan="4" class="text-muted py-3">Chưa có chi tiêu trong tháng này</td>
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
import { ref, reactive, computed, onMounted } from 'vue'
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
  { title: 'Phim', value: 0 },
  { title: 'Phòng chiếu', value: 0 },
  { title: 'Suất chiếu', value: 0 },
  { title: 'Đặt vé', value: 0 }
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
    y: {
      beginAtZero: true,
      suggestedMax: 100000,
      ticks: {
        precision: 0,
        callback: value => formatCurrency(value)
      }
    }
  }
}

// 🗓 Năm & doanh thu tháng hiện tại
const currentYear = new Date().getFullYear()
const years = ref(Array.from({ length: 5 }, (_, index) => currentYear - index))
const selectedYear = ref(currentYear)
const currentMonthRevenue = ref(0)
const loading = ref(true)

// Top phim
const topMovies = ref([])
const loadingMovies = ref(true)

// Top khách hàng
const topCustomers = ref([])
const loadingCustomers = ref(true)

const timeSlotRevenue = ref([])
const loadingTimeSlots = ref(true)
const currentMonth = new Date().getMonth() + 1
const currentMonthLabel = computed(() => `tháng ${currentMonth}/${currentYear}`)

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
    const revenueByMonth = new Map(
      data.map(row => [Number(row.month), Number(row.revenue || 0)])
    )
    const monthlyRows = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1
      return {
        month,
        revenue: revenueByMonth.get(month) || 0
      }
    })

    chartData.value.labels = monthlyRows.map(r => 'Tháng ' + r.month)
    chartData.value.datasets[0].data = monthlyRows.map(r => r.revenue)

    const nowMonth = new Date().getMonth() + 1
    const current = monthlyRows.find(r => r.month === nowMonth)
    currentMonthRevenue.value = current ? current.revenue : 0
    await fetchTimeSlotRevenue()
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
    topMovies.value = data.map(movie => ({
      ...movie,
      revenue: Number(movie.revenue || 0)
    }))
  } catch (err) {
    console.error('Error loading top movies:', err)
  } finally {
    loadingMovies.value = false
  }
}

const fetchTopCustomers = async () => {
  loadingCustomers.value = true
  try {
    const { data } = await api.get(`/admin/revenue/customers/top-month?year=${currentYear}&month=${currentMonth}`)
    topCustomers.value = data.map(customer => ({
      ...customer,
      totalSpent: Number(customer.totalSpent || 0),
      ticketRevenue: Number(customer.ticketRevenue || 0),
      snackRevenue: Number(customer.snackRevenue || 0)
    }))
  } catch (err) {
    console.error('Error loading top customers:', err)
  } finally {
    loadingCustomers.value = false
  }
}

// 🚀 Khi component mount
onMounted(async () => {
  await fetchStats()
  await fetchRevenue()
  await fetchTopMovies()
  await fetchTopCustomers()
})

function formatCurrency(value) {
  return `${Math.round(Number(value || 0)).toLocaleString('vi-VN')}đ`
}

const fetchTimeSlotRevenue = async () => {
  loadingTimeSlots.value = true
  try {
    const { data } = await api.get(`/admin/revenue/time-slots?year=${selectedYear.value}`)
    timeSlotRevenue.value = data.map(slot => ({
      ...slot,
      revenue: Number(slot.revenue || 0),
      ticketRevenue: Number(slot.ticketRevenue || 0),
      snackRevenue: Number(slot.snackRevenue || 0)
    }))
  } catch (err) {
    console.error('Error loading time slot revenue:', err)
  } finally {
    loadingTimeSlots.value = false
  }
}
function getTimeSlotPercent(revenue) {
  const maxRevenue = Math.max(...timeSlotRevenue.value.map(slot => slot.revenue), 0)
  if (maxRevenue <= 0) return 0
  return Math.max(4, Math.round((Number(revenue || 0) / maxRevenue) * 100))
}
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

.time-slot-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.time-slot-card {
  border: 1px solid #eef0f3;
  border-radius: 8px;
  padding: 1rem;
  background: #fff;
}

.time-slot-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.time-slot-head h6 {
  margin: 0;
  font-weight: 700;
}

.time-slot-head span,
.time-slot-breakdown {
  color: #6c757d;
  font-size: 0.875rem;
}

.time-slot-head strong {
  color: #dc3545;
  white-space: nowrap;
}

.time-slot-bar {
  height: 8px;
  background: #f1f3f5;
  border-radius: 999px;
  overflow: hidden;
  margin: 1rem 0 0.75rem;
}

.time-slot-bar div {
  height: 100%;
  background: #dc3545;
  border-radius: inherit;
}

.time-slot-breakdown {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

@media (max-width: 992px) {
  .chart-wrapper {
    height: 400px;
  }

  .time-slot-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 576px) {
  .time-slot-grid {
    grid-template-columns: 1fr;
  }
}
</style>
