<template>
  <div class="container py-4">
    <h4 class="mb-4 d-flex align-items-center">
      <i class="bi bi-search me-2"></i> Tra cứu vé bằng mã giao dịch
    </h4>

    <!-- Ô nhập mã giao dịch -->
    <div class="input-group mb-4">
      <input
        v-model="txnRef"
        type="text"
        class="form-control"
        placeholder="Nhập mã giao dịch (txnRef)..."
      />
      <button class="btn btn-primary" @click="searchTicket" :disabled="loading">
        <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
        Tra cứu
      </button>
    </div>

    <!-- Thông báo -->
    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <!-- Kết quả -->
    <div v-if="tickets.length > 0" class="mt-4">
      <h5 class="mb-3">
        Kết quả cho mã giao dịch: 
        <span class="text-primary">{{ txnRef }}</span>
      </h5>

      <table class="table table-bordered align-middle">
        <thead class="table-light">
          <tr>
            <th>#</th>
            <th>Phim</th>
            <th>Phòng</th>
            <th>Ghế</th>
            <th>Suất chiếu</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(ticket, index) in tickets" :key="ticket.bookingId">
            <td>{{ index + 1 }}</td>
            <td>{{ ticket.movieTitle }}</td>
            <td>{{ ticket.roomName }}</td>
            <td>{{ ticket.seatNumber }}</td>
            <td>{{ formatDateTime(ticket.startTime) }}</td>
            <td>
              <span
                class="badge"
                :class="ticket.status === 'PAID' ? 'bg-success' : 'bg-warning text-dark'"
              >
                {{ ticket.status }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Hành động in -->
      <div class="text-center mt-4">
        <button
          class="btn btn-success px-4"
          v-if="!printedTxn.includes(txnRef)"
          @click="printGroup"
          :disabled="printing"
        >
          <span
            v-if="printing"
            class="spinner-border spinner-border-sm me-2"
          ></span>
          <i class="bi bi-printer me-2"></i> In toàn bộ vé
        </button>

        <div v-else class="text-success fw-bold mt-2">
          <i class="bi bi-check-circle-fill me-1"></i> Đã in vé cho mã này
        </div>
      </div>
    </div>

    <!-- Nếu chưa tìm thấy -->
    <div
      v-else-if="searched && tickets.length === 0 && !error"
      class="alert alert-warning"
    >
      Không tìm thấy vé với mã giao dịch này.
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import api from "@/api";

const txnRef = ref("");
const tickets = ref([]);
const loading = ref(false);
const printing = ref(false);
const printedTxn = ref([]); // danh sách txnRef đã in
const error = ref("");
const searched = ref(false);

// === Tra cứu vé ===
async function searchTicket() {
  if (!txnRef.value.trim()) {
    error.value = "Vui lòng nhập mã giao dịch!";
    return;
  }
  error.value = "";
  loading.value = true;
  searched.value = false;

  try {
    const res = await api.get(`/bookings/txn/${txnRef.value.trim()}`);
    tickets.value = res.data || [];
    searched.value = true;

    // Nếu tất cả vé đều printed = true → chặn nút in
    if (tickets.value.length > 0 && tickets.value.every(t => t.printed)) {
      printedTxn.value.push(txnRef.value.trim());
    }

    console.log("Vé tìm được:", res.data);
  } catch (err) {
    console.error("Lỗi tra cứu vé:", err);
    error.value = "Không thể tra cứu vé. Kiểm tra kết nối hoặc mã giao dịch.";
  } finally {
    loading.value = false;
  }
}


// === In tất cả vé trong nhóm ===
async function printGroup() {
  const currentTxnRef = txnRef.value.trim();
  if (!currentTxnRef) return;

  printing.value = true;
  
  // Mở trang in trong một tab mới
  const printUrl = `/ticket/${currentTxnRef}`;
  window.open(printUrl, '_blank');

  // Giả định rằng việc in đã thành công và cập nhật giao diện
  printedTxn.value.push(currentTxnRef);
  printing.value = false;
}



// === Format thời gian ===
function formatDateTime(t) {
  return new Date(t).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
</script>

<style scoped>
.table {
  font-size: 0.95rem;
}

input.form-control {
  max-width: 350px;
}

.text-success i {
  color: #28a745;
}

.bi-printer {
  font-size: 1rem;
}
</style>
