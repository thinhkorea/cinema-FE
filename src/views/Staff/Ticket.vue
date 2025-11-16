<template>
  <div class="min-vh-100 d-flex align-items-center justify-content-center p-3" style="background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);">
    <div class="ticket-container" style="width: 100%; max-width: 400px; background-color: #d4a5a5; border-radius: 20px; padding: 30px 20px; position: relative;">
      <!-- Side perforations -->
      <div class="perforation perforation-left"></div>
      <div class="perforation perforation-right"></div>

      <!-- Header -->
      <div class="text-center mb-4">
        <h1 class="fw-bold" style="font-size: 24px; color: #1a1a1a; margin-bottom: 5px;">
          {{ ticket.movieTitle }}
        </h1>
        <p class="mb-0" style="font-size: 14px; color: #555;">
          {{ ticket.cinema }}
        </p>
      </div>

      <!-- Location Card -->
      <div class="bg-white rounded p-3 mb-3">
        <p style="font-size: 12px; color: #666; line-height: 1.5; margin-bottom: 0;">
          {{ ticket.location }}
        </p>
      </div>

      <!-- Date and Time -->
      <div class="row g-0 mb-3">
        <div class="col-6">
          <div class="bg-white rounded-start p-3">
            <p style="font-size: 11px; color: #888; margin-bottom: 5px;">Date</p>
            <p class="fw-bold" style="font-size: 16px; color: #1a1a1a; margin-bottom: 0;">
              {{ ticket.date }}
            </p>
          </div>
        </div>
        <div class="col-6">
          <div class="bg-white rounded-end p-3">
            <p style="font-size: 11px; color: #888; margin-bottom: 5px;">Time</p>
            <p class="fw-bold" style="font-size: 16px; color: #1a1a1a; margin-bottom: 0;">
              {{ ticket.time }}
            </p>
          </div>
        </div>
      </div>

      <!-- POS and Staff -->
      <div class="row g-0 mb-3">
        <div class="col-6">
          <p style="font-size: 10px; color: #666; margin-bottom: 3px;">POS</p>
          <p class="fw-bold" style="font-size: 14px; color: #1a1a1a; margin-bottom: 0;">
            {{ ticket.pos }}
          </p>
        </div>
        <div class="col-6 text-end">
          <p style="font-size: 10px; color: #666; margin-bottom: 3px;">Staff</p>
          <p class="fw-bold" style="font-size: 14px; color: #1a1a1a; margin-bottom: 0;">
            {{ ticket.staff }}
          </p>
        </div>
      </div>

      <!-- Dashed Divider -->
      <hr style="border-top: 2px dashed #a88585; margin: 15px 0;">

      <!-- Movie Details Card -->
      <div class="bg-white rounded p-3 mb-3">
        <p style="font-size: 10px; color: #888; margin-bottom: 5px; text-transform: uppercase;">Movie</p>
        <h3 class="fw-bold mb-3" style="font-size: 18px; color: #1a1a1a;">
          {{ ticket.movieName }}
        </h3>

        <div class="row g-3">
          <div class="col-6">
            <p style="font-size: 10px; color: #888; margin-bottom: 5px; text-transform: uppercase;">Room</p>
            <p class="fw-bold" style="font-size: 14px; color: #1a1a1a; margin-bottom: 0;">
              {{ ticket.room }}
            </p>
          </div>
          <div class="col-6">
            <p style="font-size: 10px; color: #888; margin-bottom: 5px; text-transform: uppercase;">Seat</p>
            <p class="fw-bold" style="font-size: 14px; color: #1a1a1a; margin-bottom: 0;">
              {{ ticket.seat }}
            </p>
          </div>
        </div>
      </div>

      <!-- Pricing -->
      <div class="mb-3">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span style="font-size: 12px; color: #555;">Số lượng vé</span>
          <span class="fw-bold" style="font-size: 14px; color: #1a1a1a;">{{ ticket.quantity }}</span>
        </div>
        <div v-if="ticket.price1" class="d-flex justify-content-between align-items-center mb-2">
          <span style="font-size: 12px; color: #555;">{{ ticket.priceLabel1 }}</span>
          <span class="fw-bold" style="font-size: 14px; color: #1a1a1a;">{{ ticket.price1 }}</span>
        </div>
      </div>

      <!-- Total -->
      <div class="d-flex justify-content-between align-items-center mb-3">
        <span class="fw-bold" style="font-size: 14px; color: #1a1a1a;">{{ ticket.totalLabel }}</span>
        <span class="fw-bold" style="font-size: 20px; color: #1a1a1a;">{{ ticket.total }}</span>
      </div>

      <!-- Dashed Divider -->
      <hr style="border-top: 2px dashed #a88585; margin: 15px 0;">

      <!-- Sales Number -->
      <p class="text-center" style="font-size: 11px; color: #666; margin-bottom: 12px;">
        {{ ticket.salesNo }}
      </p>

      <!-- Barcode -->
      <div class="bg-white rounded p-3 mb-3 text-center">
        <svg width="100%" height="60" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
          <!-- Simple barcode representation -->
          <rect x="10" y="10" width="2" height="40" fill="black"></rect>
          <rect x="15" y="10" width="3" height="40" fill="black"></rect>
          <rect x="21" y="10" width="2" height="40" fill="black"></rect>
          <rect x="26" y="10" width="4" height="40" fill="black"></rect>
          <rect x="33" y="10" width="2" height="40" fill="black"></rect>
          <rect x="38" y="10" width="3" height="40" fill="black"></rect>
          <rect x="44" y="10" width="2" height="40" fill="black"></rect>
          <rect x="49" y="10" width="3" height="40" fill="black"></rect>
          <rect x="55" y="10" width="2" height="40" fill="black"></rect>
          <rect x="60" y="10" width="4" height="40" fill="black"></rect>
          <rect x="67" y="10" width="2" height="40" fill="black"></rect>
          <rect x="72" y="10" width="3" height="40" fill="black"></rect>
          <rect x="78" y="10" width="2" height="40" fill="black"></rect>
          <rect x="83" y="10" width="3" height="40" fill="black"></rect>
          <rect x="89" y="10" width="2" height="40" fill="black"></rect>
          <rect x="94" y="10" width="4" height="40" fill="black"></rect>
          <rect x="101" y="10" width="2" height="40" fill="black"></rect>
          <rect x="106" y="10" width="3" height="40" fill="black"></rect>
          <rect x="112" y="10" width="2" height="40" fill="black"></rect>
          <rect x="117" y="10" width="3" height="40" fill="black"></rect>
          <rect x="123" y="10" width="2" height="40" fill="black"></rect>
          <rect x="128" y="10" width="4" height="40" fill="black"></rect>
          <rect x="135" y="10" width="2" height="40" fill="black"></rect>
          <rect x="140" y="10" width="3" height="40" fill="black"></rect>
          <rect x="146" y="10" width="2" height="40" fill="black"></rect>
          <rect x="151" y="10" width="3" height="40" fill="black"></rect>
          <rect x="157" y="10" width="2" height="40" fill="black"></rect>
          <rect x="162" y="10" width="4" height="40" fill="black"></rect>
          <rect x="169" y="10" width="2" height="40" fill="black"></rect>
          <rect x="174" y="10" width="3" height="40" fill="black"></rect>
          <rect x="180" y="10" width="2" height="40" fill="black"></rect>
          <rect x="185" y="10" width="3" height="40" fill="black"></rect>
          <text x="100" y="55" text-anchor="middle" font-size="10" fill="black">2303-0103-5178-5396</text>
        </svg>
      </div>

      <!-- Footer -->
      <p class="text-center" style="font-size: 11px; color: #666; font-style: italic; margin-bottom: 0;">
        {{ ticket.footer }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted } from "vue";
import { useRoute } from "vue-router";
import api from "@/api";

const ticket = reactive({
  movieTitle: "Đang tải...",
  cinema: "CAJ",
  location: "1 Võ Văn Ngân, Linh Chiểu, Thủ Đức, TP.HCM",
  date: "",
  time: "",
  pos: "ONLINE",
  staff: "N/A",
  movieName: "Đang tải...",
  room: "...",
  seat: "...",
  priceLabel1: "Tổng giá vé",
  price1: "",
  totalLabel: "Tổng cộng",
  total: "0 VND",
  salesNo: "...",
  footer: "Vui lòng kiểm tra thông tin vé trước khi giao cho khách hàng",
});

const route = useRoute();

// Hàm định dạng ngày tháng
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr)
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .toUpperCase();
};

// Hàm định dạng giờ
const formatTime = (timeStr) => {
  if (!timeStr) return "";
  return new Date(timeStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

onMounted(async () => {
  const txnRef = route.params.txnRef;
  if (!txnRef) {
    ticket.movieTitle = "Lỗi: Không tìm thấy mã giao dịch";
    return;
  }

  try {
    const res = await api.get(`/bookings/group-ticket-info/${txnRef}`);
    const data = res.data;

    // Cập nhật dữ liệu từ API vào object 'ticket'
    Object.assign(ticket, {
      movieTitle: data.movieTitle,
      quantity: data.seat.split(',').length, // Đếm số lượng vé từ chuỗi ghế
      movieName: data.movieTitle,
      date: formatDate(data.startTime),
      time: `${formatTime(data.startTime)} - ${formatTime(data.endTime)}`,
      staff: data.staff,
      room: data.room,
      seat: data.seat,
      total: data.total,
      salesNo: `Sales No. ${data.salesNo}`,
      footer: data.footer,
      pos: data.paymentMethod === 'CASH' ? 'BOX OFFICE' : 'ONLINE',
      price1: data.total, // Hiển thị tổng tiền ở dòng giá vé
    });
  } catch (err) {
    console.error("Lỗi khi tải dữ liệu vé:", err);
    ticket.movieTitle = "Lỗi khi tải dữ liệu vé";
    ticket.movieName = "Vui lòng kiểm tra lại mã giao dịch hoặc kết nối.";
  }
});
</script>

<style scoped>
:root {
  --bs-body-font-size: 1rem;
  --bs-body-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

body {
  font-family: var(--bs-body-font-family);
}

.ticket-container {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.perforation {
  position: absolute;
  width: 15px;
  height: 15px;
  background-color: #f5f5f5;
  border-radius: 50%;
  top: 50%;
  transform: translateY(-50%);
}

.perforation-left {
  left: -8px;
}

.perforation-right {
  right: -8px;
}

@media (max-width: 576px) {
  .ticket-container {
    padding: 20px 15px;
  }
}
</style>