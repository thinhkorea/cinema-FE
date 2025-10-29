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
</script>
