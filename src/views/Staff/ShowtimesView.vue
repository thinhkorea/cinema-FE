<template>
  <div class="container py-4">
    <table class="table table-hover align-middle">
      <thead class="table-light">
        <tr>
          <th>#</th>
          <th>Phim</th>
          <th>Phòng</th>
          <th>Giờ bắt đầu</th>
          <th>Giờ kết thúc</th>
          <th>Giá vé (VNĐ)</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(s, i) in showtimes" :key="s.showtimeId">
          <td>{{ i + 1 }}</td>
          <td>{{ s.movie.title }}</td>
          <td>{{ s.room.roomName }}</td>
          <td>{{ formatTime(s.startTime) }}</td>
          <td>{{ formatTime(s.endTime) }}</td>
          <td>{{ s.price.toLocaleString() }}</td>
        </tr>
      </tbody>
    </table>

    <p v-if="showtimes.length === 0" class="text-muted mt-3">Không có suất chiếu nào.</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api'

const showtimes = ref([])

onMounted(async () => {
  try {
    const res = await api.get('/staff/showtimes')
    showtimes.value = res.data
  } catch (err) {
    console.error('Lỗi khi load suất chiếu:', err)
  }
})

function formatTime(t) {
  return new Date(t).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}
</script>
