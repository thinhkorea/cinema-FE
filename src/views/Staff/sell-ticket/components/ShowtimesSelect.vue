<template>
  <div class="container py-4">
    <button class="btn btn-outline-secondary mb-3" @click="$emit('back')">← Quay lại</button>
    <h4 class="mb-3">Chọn suất chiếu</h4>

    <div v-if="loading" class="state-block">
      <i class="bi bi-hourglass-split state-icon"></i>
      <h6 class="mb-1">Đang tải suất chiếu</h6>
      <p class="mb-0 text-muted">Vui lòng chờ trong giây lát.</p>
    </div>

    <div v-else-if="error" class="state-block is-error">
      <i class="bi bi-exclamation-triangle state-icon"></i>
      <h6 class="mb-1">Không thể tải suất chiếu</h6>
      <p class="mb-2 text-muted">Kết nối có thể bị gián đoạn hoặc dữ liệu chưa sẵn sàng.</p>
      <button class="btn btn-primary btn-sm" @click="fetchShowtimes">Tải lại</button>
    </div>

    <div v-else-if="showtimeCount === 0" class="state-block">
      <i class="bi bi-calendar-x state-icon"></i>
      <h6 class="mb-1">Chưa có suất chiếu khả dụng</h6>
      <p class="mb-0 text-muted">Phim này chưa mở lịch hoặc tất cả suất chiếu đã qua giờ bán.</p>
    </div>

    <div v-for="(list, date) in groupedShowtimes" :key="date" class="mb-4">
      <h5 class="fw-bold">{{ date }}</h5>
      <div class="d-flex flex-wrap gap-2 session-wrap">
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
import { ref, onMounted, computed } from 'vue'
import api from '@/api'

const props = defineProps({ movieId: Number })
const groupedShowtimes = ref({})
const loading = ref(false)
const error = ref(false)

const showtimeCount = computed(() => {
  return Object.values(groupedShowtimes.value).reduce((acc, list) => acc + list.length, 0)
})

const fetchShowtimes = async () => {
  loading.value = true
  error.value = false
  try {
    const res = await api.get(`/staff/showtimes/movie/${props.movieId}`)
    const data = res.data
    const now = new Date()

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
  } catch (e) {
    error.value = true
    console.error('Lỗi tải suất chiếu:', e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchShowtimes)

function formatTime(time) {
  if (!time) return ''
  // cắt phần giờ mà không dùng Date()
  const timePart = time.split('T')[1]
  return timePart ? timePart.substring(0, 5) : ''
}
</script>

<style scoped>
.session-wrap .btn {
  border-radius: 999px;
  padding-inline: 0.9rem;
}

.state-block {
  border: 1px dashed #f1c8b6;
  border-radius: 14px;
  background: linear-gradient(140deg, #fff9f5 0%, #fff 70%);
  text-align: center;
  padding: 24px;
  margin-top: 8px;
}

.state-block.is-error {
  border-color: #f5b5b5;
  background: linear-gradient(140deg, #fff7f7 0%, #fff 70%);
}

.state-icon {
  font-size: 1.4rem;
  color: #ff6b35;
  margin-bottom: 8px;
  display: inline-block;
}
</style>
