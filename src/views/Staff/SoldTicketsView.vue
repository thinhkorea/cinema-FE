<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="d-flex align-items-center mb-0">
        <i class="bi bi-ticket-perforated me-2"></i> Vé đã bán
      </h4>

      <!-- Bộ lọc ngày -->
      <div class="d-flex align-items-center gap-2">
        <label class="fw-semibold text-secondary large mb-0">📅 Lọc theo ngày:</label>
        <input
          type="date"
          v-model="selectedDate"
          class="form-control form-control-sm"
          style="width: 180px;"
        />
        <button class="btn btn-outline-secondary btn-sm" @click="resetFilter">
          <i class="bi bi-x-circle"></i> Xóa lọc
        </button>
      </div>
    </div>

    <!-- Bảng vé đã bán -->
    <table class="table table-striped align-middle" v-if="filteredBookings.length > 0">
      <thead class="table-light">
        <tr>
          <th>#</th>
          <th>Phim</th>
          <th>Phòng</th>
          <th>Ghế</th>
          <th>Suất chiếu</th>
          <th>Phương thức</th>
          <th>Trạng thái</th>
          <th>Ngày bán</th>
          <th>Hành động</th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="(group, index) in filteredBookings"
          :key="group.txnRef || `group-${index}`"
        >
          <td>{{ index + 1 }}</td>
          <td>{{ group.movieTitle }}</td>
          <td>{{ group.roomName }}</td>
          <td>{{ group.seatDisplay }}</td>
          <td>{{ formatTime(group.startTime) }}</td>
          <td>
            <span
              class="badge"
              :class="group.paymentMethod === 'VNPAY' ? 'bg-primary' : 'bg-success'"
            >
              {{ group.paymentMethod }}
            </span>
          </td>
          <td>
            <span
              class="badge"
              :class="group.status === 'PAID' ? 'bg-success' : 'bg-warning text-dark'"
            >
              {{ group.status }}
            </span>
          </td>
          <td>{{ formatDate(group.createdAt) }}</td>

          <td class="text-center">
            <span
              v-if="downloadedRefs.has(group.txnRef)"
              class="text-success fw-bold"
              data-bs-toggle="tooltip"
              title="Đã tải vé PDF"
            >
              <i class="bi bi-check-circle-fill"></i> Đã tải
            </span>

            <button
              class="btn btn-outline-primary btn-sm"
              @click="printTicket(group.txnRef)"
            >
              <i class="bi bi-printer"></i> In vé
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-else class="text-muted mt-4 text-center">
      Không có vé nào được bán trong ngày này.
    </p>
  </div>
</template>

<script setup>
import { ref, watchEffect, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";
import api from "@/api";

const bookings = ref([]);
const authStore = useAuthStore();
const downloadingId = ref(null);
const selectedDate = ref(""); // Ngày được chọn để lọc
const downloadedRefs = ref(new Set());
const router = useRouter();

// === Đọc cache vé đã tải
onMounted(() => {
  const stored = JSON.parse(localStorage.getItem("downloadedRefs") || "[]");
  downloadedRefs.value = new Set(stored);
});

// === Lấy danh sách vé đã bán ===
watchEffect(async () => {
  if (!authStore.username) return;
  try {
    const username = authStore.username;
    const res = await api.get(`/bookings/staff/sold?username=${username}`);
    bookings.value = res.data;
    console.log("Vé đã bán:", res.data);
  } catch (err) {
    console.error("Lỗi tải vé đã bán:", err);
  }
});

// === Gom nhóm vé ===
const groupedBookings = computed(() => {
  const groupedByTxn = {};

  bookings.value.forEach((booking) => {
    const key =
      booking.txnRef ||
      `cash_${booking.createdAt}_${booking.roomName}_${booking.startTime}`;

    if (!groupedByTxn[key]) {
      groupedByTxn[key] = {
        txnRef: booking.txnRef || null,
        movieTitle: booking.movieTitle,
        roomName: booking.roomName,
        startTime: booking.startTime,
        paymentMethod: booking.paymentMethod,
        status: booking.status,
        createdAt: booking.createdAt,
        seatNumbers: [booking.seatNumber],
      };
    } else {
      groupedByTxn[key].seatNumbers.push(booking.seatNumber);
    }
  });

  return Object.values(groupedByTxn).map((group) => {
    const sortedSeats = group.seatNumbers.sort((a, b) => {
      const rowA = a.charAt(0);
      const rowB = b.charAt(0);
      const numA = parseInt(a.match(/\d+/)?.[0] || 0);
      const numB = parseInt(b.match(/\d+/)?.[0] || 0);
      return rowA === rowB ? numA - numB : rowA.localeCompare(rowB);
    });

    return {
      ...group,
      seatDisplay: sortedSeats.join(", "),
    };
  });
});

// === Lọc theo ngày được chọn ===
const filteredBookings = computed(() => {
  if (!selectedDate.value) return groupedBookings.value;

  const targetDate = new Date(selectedDate.value).toDateString();

  return groupedBookings.value.filter((group) => {
    const created = new Date(group.createdAt).toDateString();
    return created === targetDate;
  });
});

// === Xóa bộ lọc ===
function resetFilter() {
  selectedDate.value = "";
}

// === Formatters ===
function formatTime(t) {
  return new Date(t).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("vi-VN");
}

function printTicket(txnRef) {
  if (!txnRef) {
    alert("Không tìm thấy mã giao dịch!");
    return;
  }
  // Mở trang in trong tab mới
  const printUrl = router.resolve(`/ticket/${txnRef}`).href;
  window.open(printUrl, "_blank");

  // Cập nhật trạng thái đã tải/in
  downloadedRefs.value.add(txnRef);
  localStorage.setItem("downloadedRefs", JSON.stringify([...downloadedRefs.value]));
}
</script>
