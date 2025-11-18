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
  const res = await api.get(`/staff/showtimes/movie/${props.movieId}`)
  const data = res.data
  const now = new Date()
  
  // Lọc chỉ những suất chiếu có thời gian bắt đầu sau thời gian hiện tại
  const validShowtimes = data.filter(s => new Date(s.startTime) > now)
  
  const grouped = {}
  validShowtimes.forEach(s => {
    const displayDate = s.startTime.split('T')[0]
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
