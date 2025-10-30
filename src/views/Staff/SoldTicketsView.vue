<template>
  <div class="container py-4">
    <h4 class="mb-4 d-flex align-items-center">
      <i class="bi bi-ticket-perforated me-2"></i> Vé đã bán
    </h4>

    <table class="table table-striped align-middle">
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
        <tr v-for="(b, i) in bookings" :key="b.bookingId">
          <td>{{ i + 1 }}</td>
          <td>{{ b.movieTitle }}</td>
          <td>{{ b.roomName }}</td>
          <td>{{ b.seatNumber }}</td>
          <td>{{ formatTime(b.startTime) }}</td>
          <td>
            <span class="badge" :class="b.paymentMethod === 'VNPAY' ? 'bg-primary' : 'bg-success'">
              {{ b.paymentMethod }}
            </span>
          </td>
          <td>
            <span class="badge" :class="b.status === 'PAID' ? 'bg-success' : 'bg-warning text-dark'">
              {{ b.status }}
            </span>
          </td>
          <td>{{ formatDate(b.createdAt) }}</td>

          <!-- Nút tải vé PDF -->
          <td>
            <button
              class="btn btn-outline-primary btn-sm"
              @click="downloadTicket(b.bookingId)"
              :disabled="b.status !== 'PAID' || downloadingId === b.bookingId"
            >
              <span v-if="downloadingId === b.bookingId" class="spinner-border spinner-border-sm me-1"></span>
              <i v-else class="bi bi-file-earmark-pdf"></i> Tải vé
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-if="bookings.length === 0" class="text-muted mt-3">Chưa có vé nào được bán.</p>
  </div>
</template>

<script setup>
import { ref, watchEffect } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/api'

const bookings = ref([])
const authStore = useAuthStore()

// Sử dụng watchEffect để đảm bảo authStore.user đã được khởi tạo
watchEffect(async () => {
  // Chỉ chạy khi có user và username
  if (authStore.user?.username) {
    try {
      const username = authStore.user.username
      const res = await api.get(`/bookings/staff/sold?username=${username}`)
      bookings.value = res.data
    } catch (err) {
      console.error('Lỗi load vé đã bán:', err)
    }
  }
})

function formatTime(t) {
  return new Date(t).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('vi-VN')
}

const downloadingId = ref(null)

async function downloadTicket(bookingId) {
  downloadingId.value = bookingId
  try {
    // Gọi API backend trả về file PDF
    const res = await api.get(`/bookings/${bookingId}/ticket`, {
      responseType: 'blob', // Quan trọng để nhận dạng file PDF
    });

    // Tạo Blob và link tải file
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ticket_${bookingId}.pdf`; // Tên file tải xuống
    link.click();

    // Giải phóng bộ nhớ sau khi tải xong
    URL.revokeObjectURL(link.href);
  } catch (err) {
    console.error('Lỗi khi tải vé PDF:', err);
    alert('Không thể tải vé PDF! Kiểm tra lại booking ID hoặc đăng nhập.');
  } finally {
    downloadingId.value = null
  }
}

</script>
