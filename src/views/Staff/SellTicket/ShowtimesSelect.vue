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
    const date = new Date(s.startTime).toLocaleDateString('vi-VN')
    if (!grouped[date]) grouped[date] = []
    grouped[date].push(s)
  })
  groupedShowtimes.value = grouped
})

function formatTime(t) {
  return new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>
