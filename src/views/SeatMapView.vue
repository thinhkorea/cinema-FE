<template>
  <AppHeader />

  <div class="seat-map container py-5">
    <!-- Loading -->
    <div v-if="loading" class="text-center mt-5 py-5">
      <div class="spinner-border text-warning" role="status"></div>
      <p class="text-secondary mt-3">Đang tải sơ đồ ghế...</p>
    </div>

    <!-- Nội dung chính -->
    <div v-else-if="movie && showtime">
      <!-- Thông tin phim -->
      <div class="text-center mb-5">
        <h2 class="fw-bold">{{ movie.title }}</h2>
        <p class="text-muted mb-1">
          <i class="bi bi-calendar-event me-2"></i>Ngày chiếu: 
          {{ formatDate(showtime.startTime) }}
        </p>
        <p class="text-muted mb-1">
          <i class="bi bi-clock me-2"></i>Giờ chiếu:
          {{ formatTime(showtime.startTime) }}
        </p>
        <p class="text-muted">
          <i class="bi bi-house me-2"></i>Phòng:
          {{ showtime.room?.roomName }}
        </p>
      </div>

      <!-- Màn hình -->
      <div class="screen text-center mb-4 py-2 text-dark fw-bold bg-warning rounded">
        MÀN HÌNH
      </div>

      <!-- Sơ đồ ghế -->
      <div class="seat-grid mb-4">
        <div
          v-for="(row, rowIndex) in seatLayout"
          :key="rowIndex"
          class="seat-row d-flex justify-content-center mb-2"
        >
          <div
            v-for="seat in row"
            :key="seat.seatId"
            class="seat text-center"
            :class="{
              'seat-selected': selectedSeats.includes(seat.seatId),
              'seat-booked': seat.booked,
              'seat-vip': seat.seatType === 'VIP',
            }"
            @click="toggleSeat(seat)"
          >
            {{ seat.seatNumber }}
          </div>
        </div>
      </div>

      <!-- Ghi chú -->
      <div class="d-flex justify-content-center gap-4 mb-4 text-secondary small">
        <div><span class="legend seat-regular"></span> Thường</div>
        <div><span class="legend seat-vip"></span> VIP</div>
        <div><span class="legend seat-selected"></span> Đang chọn</div>
        <div><span class="legend seat-booked"></span> Đã đặt</div>
      </div>

      <!-- Tổng tiền -->
      <div class="text-center mt-4">
        <p class="fw-bold fs-5">
          Tổng: <span class="text-warning">{{ totalPrice.toLocaleString() }}</span> đ
        </p>
        <button
          class="btn btn-warning btn-lg px-5 fw-bold"
          :disabled="selectedSeats.length === 0"
          @click="confirmBooking"
        >
          Xác nhận đặt vé
        </button>
      </div>
    </div>

    <!-- Nếu không tải được -->
    <div v-else class="text-center text-danger py-5">
      <p>Không thể tải dữ liệu ghế. Vui lòng thử lại sau.</p>
    </div>
  </div>
</template>

<script setup>
import AppHeader from "@/components/AppHeader.vue";
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "@/api";
import { useAuthStore } from "@/stores/auth.store";

const route = useRoute();
const router = useRouter();

const auth = useAuthStore();
const movieId = route.params.movieId;
const showtimeId = route.params.showtimeId;

const loading = ref(true);
const movie = ref(null);
const showtime = ref(null);
const seats = ref([]);
const selectedSeats = ref([]);

// Tải dữ liệu phim, suất chiếu, ghế
onMounted(async () => {
  try {
    const [resMovie, resShowtime, resSeats] = await Promise.all([
      api.get(`/movies/${movieId}`),
      api.get(`/showtimes/${showtimeId}`),
      api.get(`/seats/showtime/${showtimeId}`), // Endpoint công khai để lấy ghế
    ]);

    movie.value = resMovie.data;
    showtime.value = resShowtime.data;
    seats.value = resSeats.data || [];
  } catch (err) {
    console.error("Lỗi khi tải dữ liệu ghế:", err);
  } finally {
    loading.value = false;
  }
});

// Tạo lưới ghế (theo hàng A–F)
const seatLayout = computed(() => {
  const grouped = {};
  seats.value.forEach((s) => {
    const row = s.rowLabel || s.seatNumber.charAt(0);
    if (!grouped[row]) grouped[row] = [];
    grouped[row].push(s);
  });
  return Object.values(grouped);
});

// Tổng tiền
const totalPrice = computed(() => {
  const basePrice = showtime.value?.price || 0;
  if (basePrice === 0) return 0;

  // Định nghĩa các mức phụ thu
  const VIP_SURCHARGE = 20000; // Phụ thu cho ghế VIP

  return selectedSeats.value
    .map((id) => seats.value.find((s) => s.seatId === id))
    .filter(Boolean)
    .reduce((sum, seat) => {
      let seatPrice = basePrice;
      if (seat.type === 'VIP') {
        seatPrice += VIP_SURCHARGE;
      } else if (seat.type === 'SWEETBOX') {
        // Ghế đôi thường có giá gấp đôi
        seatPrice = basePrice * 2;
      }
      return sum + seatPrice;
    }, 0);
});

// Chọn / bỏ chọn ghế
const toggleSeat = (seat) => {
  if (seat.booked) return;

  const index = selectedSeats.value.indexOf(seat.seatId);
  if (index !== -1) selectedSeats.value.splice(index, 1);
  else selectedSeats.value.push(seat.seatId);
};

// Format ngày & giờ
const formatDate = (d) =>
  new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

const formatTime = (time) => (time ? time.split("T")[1].substring(0, 5) : "");

// Xác nhận đặt vé + thanh toán VNPay
const confirmBooking = async () => {
  if (selectedSeats.value.length === 0) {
    alert("Vui lòng chọn ghế!");
    return;
  }

  // Kiểm tra xem người dùng đã đăng nhập chưa
  if (!auth.isAuthenticated) {
    alert("Bạn cần đăng nhập để có thể đặt vé!");
    router.push("/login"); // Chuyển hướng đến trang đăng nhập
    return;
  }

  try {
    // Tạo booking giữ ghế (PENDING)
    const res = await api.post(`/bookings`, {
      showtimeId,
      seatIds: selectedSeats.value,
    });

    const txnRef = res.data.txnRef;

    // Gọi BE tạo link VNPay Sandbox
    const payRes = await api.post(`/payments/create-payment`, {
      txnRef,
      amount: totalPrice.value, // tổng tiền hiện tại
      orderDescription: `Thanh toán vé xem phim ${movie.value.title}`,
    });

    const paymentUrl = payRes.data.paymentUrl;

    // Redirect đến VNPay thật (sandbox)
    window.location.href = paymentUrl;
  } catch (err) {
    console.error("Lỗi khi tạo thanh toán VNPay:", err);
    alert("Không thể khởi tạo thanh toán VNPay!");
  }
};



</script>

<style scoped>
/* Màn hình */
.screen {
  font-size: 18px;
  letter-spacing: 1px;
  text-transform: uppercase;
}

/* Ghế */
.seat-grid {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.seat-row {
  gap: 10px;
}

.seat {
  width: 36px;
  height: 36px;
  line-height: 36px;
  border-radius: 6px;
  font-size: 14px;
  background: #444;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.seat:hover {
  transform: scale(1.05);
}

.seat-vip {
  background: #9c27b0;
}

.seat-selected {
  background: #ffc107;
  color: #000;
  font-weight: bold;
}

.seat-booked {
  background: #777;
  cursor: not-allowed;
  text-decoration: line-through;
}

/* Ghi chú */
.legend {
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  margin-right: 5px;
  vertical-align: middle;
}

.seat-regular {
  background: #444;
}

.seat-vip {
  background: #9c27b0;
}

.seat-selected {
  background: #ffc107;
}

.seat-booked {
  background: #777;
}
</style>
