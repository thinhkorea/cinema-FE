<template>
  <AppHeader />

  <div class="container py-5 text-light">
    <h2 class="fw-bold mb-4 text-center">🎟️ Vé của bạn</h2>

    <!-- Nếu chưa có dữ liệu -->
    <div v-if="!bookings.length" class="text-center py-5">
      <div class="spinner-border text-warning mb-3"></div>
      <p>Đang tải thông tin vé...</p>
    </div>

    <!-- Nếu có dữ liệu -->
    <div v-else class="ticket-card mx-auto shadow-lg">
      <!-- HEADER -->
      <div class="ticket-header d-flex p-3">
        <img
          :src="moviePoster || '/placeholder.svg?height=400&width=300'"
          alt="poster"
          class="poster rounded-start"
        />
        <div class="ps-4 flex-fill">
          <h4 class="fw-bold text-warning mb-2">{{ movieTitle }}</h4>
          <p class="mb-1">
            <i class="bi bi-calendar-event me-2"></i>{{ formatDate(startTime) }}
          </p>
          <p class="mb-1">
            <i class="bi bi-clock me-2"></i>{{ formatTime(startTime) }}
          </p>
          <p class="mb-1">
            <i class="bi bi-house me-2"></i>{{ roomName }}
          </p>
          <p class="mb-0">
            <i class="bi bi-chair me-2"></i>Ghế:
            <strong>{{ seatList }}</strong>
          </p>
        </div>
      </div>

      <!-- ĐƯỜNG CẮT -->
      <div class="cut-line">
        <div class="circle left"></div>
        <div class="dashed"></div>
        <div class="circle right"></div>
      </div>

      <!-- BODY -->
      <div class="ticket-body p-4 text-light text-center">
        <qrcode-vue :value="`CINEMA-TXN-${txnRef}`" :size="140" level="M" />
        <p class="mt-3 text-secondary small">
          Mã giao dịch: <strong>{{ txnRef }}</strong>
        </p>

        <div class="mt-4 small text-start">
          <div class="d-flex justify-content-between mb-2">
            <span>Giá vé trung bình:</span>
            <span>{{ formatCurrency(avgPrice) }}</span>
          </div>
          <div class="d-flex justify-content-between mb-2">
            <span>Số lượng vé:</span>
            <span>{{ bookings.length }}</span>
          </div>
          <div class="d-flex justify-content-between mb-2">
            <span>Phương thức thanh toán:</span>
            <span>{{ bookings[0].paymentMethod || "VNPAY" }}</span>
          </div>
          <hr class="text-secondary" />
          <div class="d-flex justify-content-between fw-bold">
            <span>Tổng cộng:</span>
            <span class="text-warning fs-5">{{ formatCurrency(totalAmount) }}</span>
          </div>
        </div>
      </div>

      <!-- FOOTER -->
      <div class="ticket-footer text-center text-secondary small p-3 border-top border-secondary">
        <p class="mb-1">
          Vui lòng đưa mã này đến quầy vé hoặc quét QR khi vào rạp để nhận vé giấy.
        </p>
      </div>
    </div>

    <!-- Nút quay về -->
    <div class="text-center mt-4">
      <RouterLink to="/" class="btn btn-primary">
        <i class="bi bi-house-door me-2"></i>Về trang chủ
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import AppHeader from "@/components/AppHeader.vue";
import QrcodeVue from "qrcode.vue";
import { useRoute } from "vue-router";
import { ref, onMounted, computed } from "vue";
import api from "@/api";

const route = useRoute();
const txnRef = route.params.txnRef;
const bookings = ref([]);

onMounted(async () => {
  try {
    const res = await api.get(`/bookings/txn/${txnRef}`);
    console.log("Vé theo giao dịch:", res.data);
    bookings.value = res.data;
  } catch (err) {
    console.error("Lỗi tải vé:", err);
  }
});

// ==== Các giá trị tính toán ====
const movieTitle = computed(() => bookings.value[0]?.movieTitle || "N/A");
const moviePoster = computed(() => bookings.value[0]?.moviePoster || "");
const roomName = computed(() => bookings.value[0]?.roomName || "N/A");
const startTime = computed(() => bookings.value[0]?.startTime || null);

const seatList = computed(() =>
  bookings.value.map((b) => b.seatNumber).join(", ")
);

const totalAmount = computed(() =>
  bookings.value.reduce((sum, b) => sum + (b.total || 0), 0)
);

const avgPrice = computed(() =>
  bookings.value.length ? totalAmount.value / bookings.value.length : 0
);

// ==== Formatters ====
const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("vi-VN", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "N/A";

const formatTime = (date) =>
  date
    ? new Date(date).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A";

const formatCurrency = (temp) =>
  (temp || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });
</script>

<style scoped>
.ticket-card {
  background: #1a1a1a;
  color: #fff;
  border-radius: 20px;
  overflow: hidden;
  max-width: 700px;
  position: relative;
}
.poster {
  width: 150px;
  height: 220px;
  object-fit: cover;
}
.ticket-header {
  background: #2c2c2c;
}
.ticket-body {
  background: #111;
}
.ticket-footer {
  background: #000;
}
.cut-line {
  position: relative;
  height: 30px;
  background: #111;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cut-line .dashed {
  width: 90%;
  border-top: 2px dashed rgba(255, 255, 255, 0.3);
}
.cut-line .circle {
  position: absolute;
  top: 50%;
  width: 30px;
  height: 30px;
  background: #f5f5f5;
  border-radius: 50%;
  transform: translateY(-50%);
}
.cut-line .circle.left {
  left: -15px;
}
.cut-line .circle.right {
  right: -15px;
}
.btn-outline-warning:hover {
  background: #ffc107;
  color: #000;
  transform: translateY(-2px);
  transition: all 0.3s ease;
}
</style>
