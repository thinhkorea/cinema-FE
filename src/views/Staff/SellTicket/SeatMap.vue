<template>
  <div class="container py-4">
    <!-- Quay lại -->
    <button class="btn btn-outline-secondary mb-3" @click="$emit('back')">
      ← Quay lại chọn suất chiếu
    </button>

    <!-- Tiêu đề -->
    <h4 class="mb-3 text-center">Chọn ghế ngồi</h4>

    <!-- Thông tin suất chiếu -->
    <div v-if="showtime" class="text-center mb-4 text-muted">
      <div><strong>{{ showtime.movie.title }}</strong></div>
      <div>{{ showtime.room.roomName }} • {{ formatTime(showtime.startTime) }}</div>
    </div>

    <!-- Chú thích -->
    <div class="legend mb-3 d-flex justify-content-center flex-wrap gap-3 small">
      <span class="badge bg-secondary">Ghế thường</span>
      <span class="badge bg-warning text-dark">VIP</span>
      <span class="badge sweetbox">Sweetbox</span>
      <span class="badge bg-danger">Đã đặt</span>
      <span class="badge bg-success">Đang chọn</span>
    </div>

    <!-- Màn hình -->
    <div class="screen mb-4 text-center">MÀN HÌNH</div>

    <!-- Sơ đồ ghế -->
    <div v-if="seats.length > 0" class="seat-map">
      <div v-for="(rowSeats, rowLetter) in groupedSeats" :key="rowLetter" class="mb-2 text-center">
        <strong class="me-2">{{ rowLetter }}</strong>
        <div class="seat-row d-inline-grid">
          <div
            v-for="seat in rowSeats"
            :key="seat.seatId"
            class="seat"
            :class="[ seat.seatType?.toLowerCase(), { booked: seat.booked, selected: selectedSeats.includes(seat.seatId) }]"
            @click="toggleSeat(seat)"
          >
            {{ seat.seatNumber }}
          </div>
        </div>
      </div>
    </div>

    <!-- Tổng kết -->
    <div class="mt-4 d-flex justify-content-between align-items-center border-top pt-3">
      <div><strong>Đã chọn:</strong> {{ selectedSeats.length }} ghế</div>
      <button
        class="btn btn-success px-4"
        :disabled="selectedSeats.length === 0 || submitting"
        @click="openPaymentModal"
      >
        <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
        {{ submitting ? 'Đang xử lý...' : 'Xác nhận bán vé' }}
      </button>
    </div>

    <!-- Modal chọn phương thức thanh toán -->
    <div v-if="showPaymentModal" class="modal-backdrop">
      <div class="modal-box">
        <h5 class="mb-3 text-center">Chọn phương thức thanh toán</h5>

        <div class="d-flex justify-content-around mb-4">
          <button class="btn btn-success" @click="handleCashPayment">💵 Tiền mặt</button>
          <button class="btn btn-primary" @click="handleVnPay">💳 VNPay</button>
        </div>

        <!-- QR nếu VNPay -->
        <div v-if="qrUrl" class="text-center">
          <h6>Quét mã QR để thanh toán</h6>
          <img
            :src="`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrUrl)}&size=220x220`"
            alt="QR"
            class="border rounded p-2 bg-white"
          />
          <p class="mt-2 small text-muted">Sau khi khách quét và thanh toán, kiểm tra trạng thái hệ thống.</p>
        </div>

        <div class="text-center mt-3">
          <button class="btn btn-secondary" @click="closePaymentModal">Đóng</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api'
import { useAuthStore } from '@/stores/auth.store'

const props = defineProps({
  showtime: { type: Object, required: true }
})

const authStore = useAuthStore()
const seats = ref([])
const selectedSeats = ref([])
const submitting = ref(false)
const showPaymentModal = ref(false)
const qrUrl = ref('')

// Lấy ghế khi vào
onMounted(async () => {
  const res = await api.get(`/staff/showtimes/${props.showtime.showtimeId}/seats`)
  seats.value = res.data
})

// Gom ghế theo hàng
const groupedSeats = computed(() => {
  const groups = {}
  seats.value.forEach(seat => {
    const row = seat.seatNumber.charAt(0)
    if (!groups[row]) groups[row] = []
    groups[row].push(seat)
  })
  for (const key in groups) {
    groups[key].sort((a, b) => {
      const numA = parseInt(a.seatNumber.match(/\d+/)?.[0])
      const numB = parseInt(b.seatNumber.match(/\d+/)?.[0])
      return numA - numB
    })
  }
  return groups
})

// Toggle chọn ghế
function toggleSeat(seat) {
  if (seat.booked) return
  const index = selectedSeats.value.indexOf(seat.seatId)
  if (index >= 0) selectedSeats.value.splice(index, 1)
  else selectedSeats.value.push(seat.seatId)
}

// Modal xử lý thanh toán
function openPaymentModal() {
  if (selectedSeats.value.length === 0) return
  showPaymentModal.value = true
}
function closePaymentModal() {
  showPaymentModal.value = false
  qrUrl.value = ''
}

// Thanh toán tiền mặt
async function handleCashPayment() {
  try {
    submitting.value = true
    const res = await api.post('/bookings/staff/create-multi', {
      showtimeId: props.showtime.showtimeId,
      seatIds: selectedSeats.value,
      staffUsername: authStore.user?.username
    })

    const txnRef = res.data.txnRef
    await api.post(`/bookings/pay-cash/${txnRef}`)
    alert('Thanh toán tiền mặt thành công!')

    closePaymentModal()
    const refresh = await api.get(`/staff/showtimes/${props.showtime.showtimeId}/seats`)
    seats.value = refresh.data
  } catch (err) {
    console.error('Lỗi thanh toán tiền mặt:', err)
    alert(err.response?.data?.error || 'Có lỗi xảy ra!')
  } finally {
    submitting.value = false
  }
}

// Thanh toán VNPay
async function handleVnPay() {
  try {
    submitting.value = true
    const bookingRes = await api.post('/bookings/staff/create-multi', {
      showtimeId: props.showtime.showtimeId,
      seatIds: selectedSeats.value,
      staffUsername: authStore.user?.username
    })
    const txnRef = bookingRes.data.txnRef
    localStorage.setItem('txnRef', txnRef)

    const totalAmount = props.showtime.price * selectedSeats.value.length
    const paymentRes = await api.post('/payments/create-payment', {
      txnRef,
      amount: totalAmount,
      orderDescription: `Thanh toán ${selectedSeats.value.length} vé xem phim`
    })
    window.location.href = paymentRes.data.paymentUrl
  } catch (err) {
    console.error('Lỗi tạo VNPay:', err)
    alert(err.response?.data?.error || 'Không thể tạo thanh toán VNPay!')
  } finally {
    submitting.value = false
  }
}

function formatTime(t) {
  return new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.screen {
  background: linear-gradient(90deg, #ccc, #eee, #ccc);
  padding: 8px;
  border-radius: 6px;
  font-weight: bold;
  letter-spacing: 1px;
}

.seat-map {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.seat-row {
  display: grid;
  grid-template-columns: repeat(10, 42px);
  gap: 8px;
  justify-content: center;
}

.seat {
  background: #e5e7eb;
  color: #111;
  padding: 10px;
  text-align: center;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
  cursor: pointer;
  user-select: none;
}
.seat:hover:not(.booked) {
  background: #d1d5db;
  transform: scale(1.05);
}
.seat.selected { background: #22c55e; color: #fff; }
.seat.booked { background: #ef4444; color: #fff; cursor: not-allowed; opacity: 0.7; }
.seat.vip { background: #facc15; }
.seat.sweetbox { background: #f472b6; color: white; grid-column: span 2; width: 92px; }

.legend .badge.sweetbox {
  background-color: #f472b6;
  color: white;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}
.modal-box {
  background: #fff;
  padding: 24px;
  border-radius: 12px;
  width: 360px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.3);
  animation: fadeIn 0.25s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
