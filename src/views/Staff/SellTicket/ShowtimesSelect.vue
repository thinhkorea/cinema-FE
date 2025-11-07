<template>
  <div class="container py-4">
    <button class="btn btn-outline-secondary mb-3" @click="$emit('back')">← Quay lại</button>
    <h4 class="mb-3">🕓 Chọn suất chiếu</h4>

    <div v-for="(list, date) in groupedShowtimes" :key="date" class="mb-4">
      <h5 class="fw-bold">{{ date }}</h5>
      <div class="d-flex flex-wrap gap-2">
        <button
          v-for="s in list"
          :key="s.showtimeId"
          class="btn btn-outline-primary"
          @click="$emit('select', s)"
        >
          {{ formatTime(s.startTime) }} - {{ s.room.roomName }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api'

const props = defineProps({ movieId: Number })
const groupedShowtimes = ref({})

onMounted(async () => {
  const res = await api.get(`/staff/showtimes/movie/${props.movieId}`) // Gọi endpoint mới
  const data = res.data // data giờ là List<Showtime>
  const grouped = {}
  data.forEach(s => {
    // Cắt ngày trực tiếp từ chuỗi ISO
    const displayDate = s.startTime.split('T')[0] // 2025-11-06
    const [year, month, day] = displayDate.split('-')
    const formattedDate = `${day}/${month}/${year}`

    if (!grouped[formattedDate]) grouped[formattedDate] = []
    grouped[formattedDate].push(s)
  })
  groupedShowtimes.value = grouped
})

function formatTime(time) {
  if (!time) return ''
  // cắt phần giờ mà không dùng Date()
  const timePart = time.split('T')[1]
  return timePart ? timePart.substring(0, 5) : ''
}
</script>
