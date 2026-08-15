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

    <!-- Top phim -->
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

    <div class="row g-4 dashboard-rank-section">
      <!-- Top phim -->
      <div class="col-lg-12">
        <div class="full-width-section h-100">
          <h5 class="mb-4 d-flex align-items-center">
            <i class="bi bi-trophy me-2 text-warning"></i> Top phim theo doanh thu
          </h5>

          <div v-if="loadingMovies" class="text-center py-4">
            <div class="spinner-border text-warning"></div>
          </div>

          <div v-else>
            <table class="table table-hover align-middle text-center ranking-table">
              <thead class="table-light">
                <tr>
                  <th>#</th>
                  <th>Tên phim</th>
                  <th>Doanh thu vé</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="m in topMovies" :key="m.movieTitle" :class="getRankRowClass(m.rank)">
                  <td>
                    <span class="rank-label" :class="getRankClass(m.rank)">
                      {{ getRankLabel(m.rank) }}
                    </span>
                  </td>
                  <td class="fw-semibold">{{ m.movieTitle }}</td>
                  <td class="text-success fw-bold">{{ formatCurrency(m.ticketRevenue) }}</td>
                </tr>
                <tr v-if="!topMovies.length">
                  <td colspan="3" class="text-muted text-center py-4">
                    Chưa có doanh thu phim
                  </td>
                </tr>
              </tbody>
            </table>

            <AdminPagination
              v-if="topMovieTotalItems > 0"
              v-model="topMoviePage"
              :total-items="topMovieTotalItems"
              :page-size="topMoviePageSize"
              :page-size-options="[5, 10, 20, 50]"
              item-label="phim"
              aria-label="Phân trang top phim theo doanh thu"
              @update:page-size="topMoviePageSize = $event"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="dashboard-section-gap" aria-hidden="true"></div>

    <div class="full-width-section mb-5 customer-report-section">
      <div class="customer-report-head">
        <div>
          <h5 class="mb-1 d-flex align-items-center">
            <i class="bi bi-award me-2 text-success"></i>
            Bảng khách mua vé nhiều trong {{ customerReportMonthLabel }}
          </h5>
          <div class="text-muted small">
            {{ customerReportTotalItems }} khách hàng · {{ customerReportSummary.totalTicketCount }} vé ·
            Tiền vé: {{ formatCurrency(customerReportSummary.totalTicketRevenue) }} ·
            Bắp nước mua riêng: {{ formatCurrency(customerReportTotalSnackRevenue) }} ·
            Tổng: {{ formatCurrency(customerReportSummary.totalSpent) }}
          </div>
        </div>

        <div class="customer-report-controls">
          <select v-model.number="selectedCustomerMonth" class="form-select form-select-sm">
            <option v-for="month in monthOptions" :key="month" :value="month">
              Tháng {{ month }}
            </option>
          </select>
          <select v-model.number="selectedCustomerYear" class="form-select form-select-sm">
            <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
          </select>
        </div>
      </div>

      <div v-if="loadingCustomerReport" class="text-center py-4">
        <div class="spinner-border text-success"></div>
      </div>

      <div v-else>
        <div class="table-responsive">
          <table class="table table-hover align-middle customer-report-table ranking-table">
            <thead class="table-light">
              <tr>
                <th class="text-center">#</th>
                <th>Khách hàng</th>
                <th class="text-center">Số vé</th>
                <th class="text-end">Tiền vé</th>
                <th class="text-end">Bắp nước mua riêng</th>
                <th class="text-end">Tổng cộng</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="customer in customerReportRows"
                :key="customer.customerId || customer.userId || customer.rank"
                :class="getRankRowClass(customer.rank)"
              >
                <td class="text-center">
                  <span class="rank-label" :class="getRankClass(customer.rank)">
                    {{ getRankLabel(customer.rank) }}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    class="customer-name-button"
                    :disabled="!customer.userId"
                    @click="openCustomerDetail(customer)"
                  >
                    {{ customer.customerName }}
                  </button>
                  <div class="customer-meta">{{ customer.email || customer.phone || '-' }}</div>
                </td>
                <td class="text-center">{{ customer.ticketCount }}</td>
                <td class="text-end text-success fw-bold">{{ formatCurrency(customer.ticketRevenue) }}</td>
                <td class="text-end fw-semibold">{{ formatCurrency(customer.snackRevenue) }}</td>
                <td class="text-end fw-bold total-spent-cell">{{ formatCurrency(customer.totalSpent) }}</td>
              </tr>
              <tr v-if="!customerReportRows.length">
                <td colspan="6" class="text-muted text-center py-4">
                  Chưa có khách hàng mua vé trong tháng này
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <AdminPagination
          v-if="customerReportTotalItems > 0"
          v-model="customerReportPage"
          :total-items="customerReportTotalItems"
          :page-size="customerReportPageSize"
          :page-size-options="[5, 10, 20, 50]"
          item-label="khách hàng"
          aria-label="Phân trang khách hàng mua vé"
          @update:page-size="customerReportPageSize = $event"
        />
      </div>
    </div>

    <div
      v-if="selectedCustomerDetail"
      class="customer-detail-backdrop"
      role="dialog"
      aria-modal="true"
      @click.self="closeCustomerDetail"
    >
      <div class="customer-detail-modal">
        <div class="customer-detail-header">
          <div>
            <div class="customer-detail-eyebrow">
              {{ getRankLabel(selectedCustomerDetail.rank) }} trong {{ customerReportMonthLabel }}
            </div>
            <h4>{{ selectedCustomerDetail.customerName }}</h4>
            <p>{{ selectedCustomerDetail.email || selectedCustomerDetail.phone || 'Chưa có thông tin liên hệ' }}</p>
          </div>
          <button type="button" class="customer-detail-close" aria-label="Đóng" @click="closeCustomerDetail">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="customer-detail-stats">
          <div>
            <span>Số vé</span>
            <strong>{{ selectedCustomerDetail.ticketCount }}</strong>
          </div>
          <div>
            <span>Tiền vé</span>
            <strong>{{ formatCurrency(selectedCustomerDetail.ticketRevenue) }}</strong>
          </div>
          <div>
            <span>Bắp nước mua riêng</span>
            <strong>{{ formatCurrency(selectedCustomerDetail.snackRevenue) }}</strong>
          </div>
          <div>
            <span>Tổng cộng</span>
            <strong>{{ formatCurrency(selectedCustomerDetail.totalSpent) }}</strong>
          </div>
        </div>

        <div class="customer-detail-money-breakdown">
          <div>
            <span>Tiền vé</span>
            <strong>{{ formatCurrency(selectedCustomerDetail.ticketRevenue) }}</strong>
          </div>
          <i class="bi bi-plus-lg"></i>
          <div>
            <span>Bắp nước mua riêng</span>
            <strong>{{ formatCurrency(selectedCustomerDetail.snackRevenue) }}</strong>
          </div>
          <i class="bi bi-equals"></i>
          <div class="breakdown-total">
            <span>Tổng cộng</span>
            <strong>{{ formatCurrency(selectedCustomerDetail.totalSpent) }}</strong>
          </div>
        </div>

        <div class="customer-detail-section-title">
          Chi tiết booking trong {{ customerReportMonthLabel }}
        </div>

        <div v-if="customerDetailLoading" class="text-center py-4">
          <div class="spinner-border text-success"></div>
        </div>

        <div v-else-if="customerDetailBookingGroups.length" class="table-responsive customer-detail-table-wrap">
          <table class="table table-hover align-middle customer-detail-table">
            <thead class="table-light">
              <tr>
                <th>Mã giao dịch</th>
                <th>Phim</th>
                <th>Ghế</th>
                <th>Suất chiếu</th>
                <th>Thanh toán</th>
                <th class="text-end">Tiền vé</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="group in customerDetailBookingGroups" :key="group.key">
                <td>
                  <div class="fw-semibold">{{ group.txnRef || `#${group.bookingIds.join(', ')}` }}</div>
                  <div class="customer-meta">Đặt: {{ formatDateTime(group.createdAt) }}</div>
                </td>
                <td>
                  <div class="fw-semibold">{{ group.movieTitle }}</div>
                  <div class="customer-meta">{{ group.roomName || '-' }}</div>
                </td>
                <td>{{ group.seats.join(', ') }}</td>
                <td>{{ formatDateTime(group.startTime) }}</td>
                <td>
                  <span class="badge bg-success">{{ group.paymentMethod || '-' }}</span>
                  <span class="badge bg-secondary ms-1">{{ group.status || '-' }}</span>
                </td>
                <td class="text-end fw-bold text-success">{{ formatCurrency(group.total) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="customer-detail-empty">
          Chưa có booking vé trong tháng đang chọn.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import api from '@/api'
import AdminPagination from '@/views/Admin/components/AdminPagination.vue'
import { getApiErrorMessage, showCinemaAlert } from '@/utils/cinemaAlert'
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
const topMoviePage = ref(1)
const topMoviePageSize = ref(5)
const topMovieTotalItems = ref(0)

const timeSlotRevenue = ref([])
const loadingTimeSlots = ref(true)
const currentMonth = new Date().getMonth() + 1
const monthOptions = Array.from({ length: 12 }, (_, index) => index + 1)

// Danh sách khách mua vé theo tháng
const customerReportRows = ref([])
const loadingCustomerReport = ref(true)
const selectedCustomerYear = ref(currentYear)
const selectedCustomerMonth = ref(currentMonth)
const customerReportPage = ref(1)
const customerReportPageSize = ref(10)
const customerReportTotalItems = ref(0)
const customerReportSummary = ref({
  totalTicketCount: 0,
  totalTicketRevenue: 0,
  totalSpent: 0
})
const selectedCustomerDetail = ref(null)
const customerDetailBookings = ref([])
const customerDetailLoading = ref(false)
const customerReportMonthLabel = computed(
  () => `tháng ${selectedCustomerMonth.value}/${selectedCustomerYear.value}`
)
const customerReportTotalSnackRevenue = computed(() =>
  Math.max(0, Number(customerReportSummary.value.totalSpent || 0) - Number(customerReportSummary.value.totalTicketRevenue || 0))
)
const customerDetailMonthlyBookings = computed(() =>
  customerDetailBookings.value.filter(booking => isInSelectedCustomerMonth(booking.startTime || booking.createdAt))
)
const customerDetailBookingGroups = computed(() => {
  const groups = new Map()

  customerDetailMonthlyBookings.value.forEach(booking => {
    const key = booking.txnRef || `booking-${booking.bookingId}`
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        txnRef: booking.txnRef || '',
        bookingIds: [],
        movieTitle: booking.movieTitle || '-',
        roomName: booking.roomName || '-',
        startTime: booking.startTime,
        createdAt: booking.createdAt,
        paymentMethod: booking.paymentMethod || '-',
        status: booking.status || '-',
        seats: [],
        total: 0
      })
    }

    const group = groups.get(key)
    group.bookingIds.push(booking.bookingId)
    if (booking.seatNumber) {
      group.seats.push(booking.seatNumber)
    }
    group.total += Number(booking.total || 0)
  })

  return Array.from(groups.values()).sort((left, right) => {
    return new Date(right.startTime || right.createdAt) - new Date(left.startTime || left.createdAt)
  })
})

// API
const fetchStats = async () => {
  try {
    const res = await api.get('/admin/dashboard')
    stats[0].value = res.data.movies
    stats[1].value = res.data.rooms
    stats[2].value = res.data.showtimes
    stats[3].value = res.data.bookings
  } catch (err) {
    console.error('Error loading dashboard stats:', err)
  }
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
    const { data } = await api.get('/admin/revenue/movies', {
      params: {
        page: topMoviePage.value,
        pageSize: topMoviePageSize.value
      }
    })
    const rows = Array.isArray(data) ? data : data.items || []
    const currentPage = Number(data.page || topMoviePage.value)
    const currentPageSize = Number(data.pageSize || topMoviePageSize.value)
    topMovies.value = rows.map((movie, index) => ({
      ...movie,
      rank: Number(movie.rank || (currentPage - 1) * currentPageSize + index + 1),
      ticketRevenue: Number(movie.ticketRevenue || 0),
      snackRevenue: Number(movie.snackRevenue || 0),
      revenue: Number(movie.revenue || 0)
    }))
    topMoviePage.value = currentPage
    topMoviePageSize.value = currentPageSize
    topMovieTotalItems.value = Array.isArray(data) ? rows.length : Number(data.totalItems || 0)
  } catch (err) {
    console.error('Error loading top movies:', err)
  } finally {
    loadingMovies.value = false
  }
}

// 🚀 Khi component mount
const fetchCustomerReport = async () => {
  loadingCustomerReport.value = true
  try {
    const { data } = await api.get('/admin/revenue/customers/monthly', {
      params: {
        year: selectedCustomerYear.value,
        month: selectedCustomerMonth.value,
        page: customerReportPage.value,
        pageSize: customerReportPageSize.value
      }
    })

    customerReportRows.value = (data.items || []).map(customer => ({
      ...customer,
      rank: Number(customer.rank || 0),
      userId: Number(customer.userId || 0),
      ticketCount: Number(customer.ticketCount || 0),
      snackOrderCount: Number(customer.snackOrderCount || 0),
      ticketRevenue: Number(customer.ticketRevenue || 0),
      snackRevenue: Number(customer.snackRevenue || 0),
      totalSpent: Number(customer.totalSpent || 0)
    }))
    customerReportPage.value = Number(data.page || customerReportPage.value)
    customerReportPageSize.value = Number(data.pageSize || customerReportPageSize.value)
    customerReportTotalItems.value = Number(data.totalItems || 0)
    customerReportSummary.value = {
      totalTicketCount: Number(data.totalTicketCount || 0),
      totalTicketRevenue: Number(data.totalTicketRevenue || 0),
      totalSpent: Number(data.totalSpent || 0)
    }
  } catch (err) {
    console.error('Error loading monthly customer report:', err)
  } finally {
    loadingCustomerReport.value = false
  }
}

const openCustomerDetail = async (customer) => {
  if (!customer.userId) {
    await showCinemaAlert({
      icon: 'warning',
      title: 'Không thể xem chi tiết',
      text: 'Khách hàng này chưa có tài khoản user để xem lịch sử booking.'
    })
    return
  }

  selectedCustomerDetail.value = customer
  customerDetailBookings.value = []
  customerDetailLoading.value = true

  try {
    const { data } = await api.get(`/admin/users/${customer.userId}/bookings`)
    customerDetailBookings.value = (Array.isArray(data) ? data : []).map(booking => ({
      ...booking,
      total: Number(booking.total || 0),
      pointsUsed: Number(booking.pointsUsed || 0)
    }))
  } catch (err) {
    await showCinemaAlert({
      icon: 'error',
      title: 'Không thể tải booking',
      text: getApiErrorMessage(err)
    })
  } finally {
    customerDetailLoading.value = false
  }
}

const closeCustomerDetail = () => {
  selectedCustomerDetail.value = null
  customerDetailBookings.value = []
}

const isInSelectedCustomerMonth = (value) => {
  if (!value) return false
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return false
  return (
    date.getFullYear() === Number(selectedCustomerYear.value) &&
    date.getMonth() + 1 === Number(selectedCustomerMonth.value)
  )
}

watch([selectedCustomerYear, selectedCustomerMonth], () => {
  if (customerReportPage.value !== 1) {
    customerReportPage.value = 1
  } else {
    fetchCustomerReport()
  }
})

watch([topMoviePage, topMoviePageSize], () => {
  fetchTopMovies()
})

watch([customerReportPage, customerReportPageSize], () => {
  fetchCustomerReport()
})

onMounted(() => {
  Promise.allSettled([
    fetchStats(),
    fetchRevenue(),
    fetchTopMovies(),
    fetchCustomerReport()
  ])
})

function formatCurrency(value) {
  return `${Math.round(Number(value || 0)).toLocaleString('vi-VN')}đ`
}

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return '-'
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
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

function getRankRowClass(rank) {
  const rankNumber = Number(rank || 0)
  return rankNumber >= 1 && rankNumber <= 3 ? `rank-row-${rankNumber}` : ''
}

function getRankClass(rank) {
  const rankNumber = Number(rank || 0)
  return rankNumber >= 1 && rankNumber <= 3 ? `rank-${rankNumber}` : 'rank-default'
}

function getRankLabel(rank) {
  const rankNumber = Number(rank || 0)
  return rankNumber >= 1 && rankNumber <= 3 ? `TOP ${rankNumber}` : rankNumber
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

.dashboard-rank-section {
  margin-bottom: 0;
}

.dashboard-section-gap {
  height: 3.5rem;
}

.customer-report-section {
  margin-top: 0;
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

.customer-report-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.customer-report-controls {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.customer-report-controls .form-select {
  width: auto;
  min-width: 116px;
}

.customer-report-table th {
  white-space: nowrap;
}

.customer-name-button {
  border: 0;
  background: transparent;
  padding: 0;
  color: #212529;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
}

.customer-name-button:hover:not(:disabled) {
  color: #ff6b35;
  text-decoration: underline;
}

.customer-name-button:disabled {
  cursor: default;
}

.total-spent-cell {
  color: #ff6b35;
}

.customer-meta {
  color: #6c757d;
  font-size: 0.8125rem;
}

.customer-detail-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: rgba(15, 23, 42, 0.54);
}

.customer-detail-modal {
  width: min(1080px, 100%);
  max-height: 88vh;
  overflow: auto;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.3);
  padding: 1.5rem;
}

.customer-detail-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f0ddd5;
}

.customer-detail-header h4 {
  margin: 0.15rem 0;
  font-weight: 800;
}

.customer-detail-header p,
.customer-detail-eyebrow {
  margin: 0;
  color: #6c757d;
}

.customer-detail-eyebrow {
  font-size: 0.82rem;
  font-weight: 800;
  text-transform: uppercase;
}

.customer-detail-close {
  width: 36px;
  height: 36px;
  border: 1px solid #f0ddd5;
  border-radius: 8px;
  background: #fff;
  color: #495057;
}

.customer-detail-close:hover {
  background: #fff6f1;
  color: #ff6b35;
}

.customer-detail-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.85rem;
  margin: 1rem 0;
}

.customer-detail-stats > div {
  border: 1px solid #f0ddd5;
  border-radius: 10px;
  padding: 0.85rem;
  background: #fffaf7;
}

.customer-detail-stats span {
  display: block;
  color: #6c757d;
  font-size: 0.82rem;
  margin-bottom: 0.25rem;
}

.customer-detail-stats strong {
  font-size: 1rem;
}

.customer-detail-money-breakdown {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin: 0 0 1.25rem;
  padding: 0.9rem;
  border: 1px solid #f0ddd5;
  border-radius: 10px;
  background: #fff;
}

.customer-detail-money-breakdown > div {
  min-width: 150px;
  border-radius: 8px;
  padding: 0.65rem 0.8rem;
  background: #fffaf7;
}

.customer-detail-money-breakdown span {
  display: block;
  color: #6c757d;
  font-size: 0.78rem;
  margin-bottom: 0.2rem;
}

.customer-detail-money-breakdown strong {
  font-size: 0.98rem;
}

.customer-detail-money-breakdown i {
  color: #ff6b35;
}

.customer-detail-money-breakdown .breakdown-total {
  background: #fff1e8;
}

.customer-detail-money-breakdown .breakdown-total strong {
  color: #ff6b35;
}

.customer-detail-section-title {
  font-weight: 800;
  margin-bottom: 0.75rem;
}

.customer-detail-table-wrap {
  border: 1px solid #f0ddd5;
  border-radius: 10px;
  overflow: hidden;
}

.customer-detail-table {
  margin-bottom: 0;
}

.customer-detail-table th {
  white-space: nowrap;
}

.customer-detail-empty {
  border: 1px dashed #f0ddd5;
  border-radius: 10px;
  padding: 1.5rem;
  text-align: center;
  color: #6c757d;
  background: #fffaf7;
}

.ranking-table tbody tr.rank-row-1 > td {
  background: #fff7d6;
}

.ranking-table tbody tr.rank-row-2 > td {
  background: #eef4ff;
}

.ranking-table tbody tr.rank-row-3 > td {
  background: #fff0e3;
}

.ranking-table tbody tr.rank-row-1 > td:first-child {
  border-left: 4px solid #e0a800;
}

.ranking-table tbody tr.rank-row-2 > td:first-child {
  border-left: 4px solid #5b86d6;
}

.ranking-table tbody tr.rank-row-3 > td:first-child {
  border-left: 4px solid #e1732f;
}

.ranking-table tbody tr.rank-row-1:hover > td {
  background: #fff0b8;
}

.ranking-table tbody tr.rank-row-2:hover > td {
  background: #e3edff;
}

.ranking-table tbody tr.rank-row-3:hover > td {
  background: #ffe4cf;
}

.rank-label {
  display: inline-block;
  min-width: 40px;
  color: #495057;
  font-size: 0.9rem;
  font-weight: 900;
  letter-spacing: 0;
  white-space: nowrap;
}

.rank-label.rank-1 {
  color: #8a5a00;
}

.rank-label.rank-2 {
  color: #24579d;
}

.rank-label.rank-3 {
  color: #9d420d;
}

@media (max-width: 992px) {
  .chart-wrapper {
    height: 400px;
  }

  .time-slot-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .customer-report-head {
    flex-direction: column;
  }

  .customer-report-controls {
    justify-content: flex-start;
    width: 100%;
  }

  .customer-detail-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 576px) {
  .time-slot-grid {
    grid-template-columns: 1fr;
  }

  .customer-report-controls .form-select {
    width: 100%;
    max-width: none;
  }

  .customer-detail-backdrop {
    padding: 0.75rem;
  }

  .customer-detail-modal {
    padding: 1rem;
  }

  .customer-detail-stats {
    grid-template-columns: 1fr;
  }

  .customer-detail-money-breakdown,
  .customer-detail-money-breakdown > div {
    width: 100%;
  }
}
</style>


