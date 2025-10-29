<template>
  <div class="container py-4">
    <h4 class="mb-3 d-flex align-items-center">
      <i class="bi bi-ticket-detailed me-2"></i> Bookings Management
    </h4>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary"></div>
    </div>

    <div v-else>
      <table class="table table-bordered table-striped align-middle">
        <thead class="table-light">
          <tr>
            <th>#</th>
            <th>User</th>
            <th>Movie</th>
            <th>Room</th>
            <th>Seat</th>
            <th>Showtime</th>
            <th>Status</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(b, idx) in bookings" :key="b.bookingId">
            <td>{{ idx + 1 }}</td>
            <td>{{ b.username }}</td>
            <td>{{ b.movieTitle }}</td>
            <td>{{ b.roomName }}</td>
            <td>{{ b.seatNumber }}</td>
            <td>{{ formatDate(b.showtime) }}</td>
            <td>
              <span
                :class="{
                  'badge bg-secondary': b.status === 'PENDING',
                  'badge bg-success': b.status === 'PAID',
                  'badge bg-danger': b.status === 'CANCELLED'
                }"
              >
                {{ b.status }}
              </span>
            </td>
            <td>{{ formatDate(b.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api'

const bookings = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await api.get('/admin/bookings')
    bookings.value = res.data
  } catch (err) {
    console.error('Error loading bookings:', err)
  } finally {
    loading.value = false
  }
})

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('vi-VN')
}
</script>
