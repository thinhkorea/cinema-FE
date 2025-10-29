<template>
  <div class="d-flex justify-content-between align-items-center mb-3">
    <h5>🎞️ Showtimes Management</h5>
    <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#showtimeModal" @click="openCreate">
      + Add Showtime
    </button>
  </div>

  <div class="card shadow-sm">
    <div class="card-body table-responsive">
      <table class="table table-hover align-middle">
        <thead>
          <tr>
            <th>#</th>
            <th>Movie</th>
            <th>Room</th>
            <th>Start Time</th>
            <th>End Time</th>
            <th>Price (VNĐ)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody v-if="showtimes.length">
          <tr v-for="(st, i) in showtimes" :key="st.showtimeId">
            <td>{{ i + 1 }}</td>
            <td>{{ st.movie?.title }}</td>
            <td>{{ st.room?.roomName }}</td>
            <td>{{ formatTime(st.startTime) }}</td>
            <td>{{ formatTime(st.endTime) }}</td>
            <td>{{ st.price?.toLocaleString('vi-VN') }}</td>
            <td>
              <button class="btn btn-sm btn-outline-secondary me-2"
                data-bs-toggle="modal" data-bs-target="#showtimeModal"
                @click="openEdit(st)">Edit</button>
              <button class="btn btn-sm btn-outline-danger" @click="remove(st.showtimeId)">Delete</button>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr><td colspan="7" class="text-center text-muted">No data</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- 🕒 Modal thêm/sửa suất chiếu -->
  <div class="modal fade" id="showtimeModal" tabindex="-1" aria-hidden="true" ref="modalEl">
    <div class="modal-dialog">
      <form class="modal-content" @submit.prevent="save">
        <div class="modal-header">
          <h5 class="modal-title">{{ form.showtimeId ? 'Edit Showtime' : 'Add Showtime' }}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>

        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label">Movie</label>
            <select v-model="form.movieId" class="form-select" required @change="autoCalculateEndTime">
              <option disabled value="">Select movie</option>
              <option v-for="m in movies" :key="m.movieId" :value="m.movieId">
                {{ m.title }} ({{ m.duration }} min)
              </option>
            </select>
          </div>

          <div class="mb-3">
            <label class="form-label">Room</label>
            <select v-model="form.roomId" class="form-select" required>
              <option disabled value="">Select room</option>
              <option v-for="r in rooms" :key="r.roomId" :value="r.roomId">{{ r.roomName }}</option>
            </select>
          </div>

          <div class="mb-3">
            <label class="form-label">Start Time</label>
            <input type="datetime-local" v-model="form.startTime" class="form-control" required @change="autoCalculateEndTime" />
          </div>

          <div class="mb-3">
            <label class="form-label">End Time</label>
            <input type="datetime-local" v-model="form.endTime" class="form-control" readonly />
            <small class="text-muted">Tự tính dựa theo thời lượng phim + 30 phút nghỉ</small>
          </div>

          <div class="mb-3">
            <label class="form-label">Price (VNĐ)</label>
            <input type="number" min="0" step="1000" v-model.number="form.price" class="form-control" required />
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" type="button" data-bs-dismiss="modal">Cancel</button>
          <button class="btn btn-primary" type="submit" :disabled="saving">
            <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>Save
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../../api'
import { Modal } from 'bootstrap'

const showtimes = ref([])
const movies = ref([])
const rooms = ref([])
const saving = ref(false)
const modalEl = ref(null)
let modal

const BUFFER_MINUTES = 30 // thêm 30 phút nghỉ giữa các suất

const form = reactive({
  showtimeId: null,
  movieId: '',
  roomId: '',
  startTime: '',
  endTime: '',
  price: 0
})

// ==================== LOAD DATA ====================
const fetchShowtimes = async () => {
  const { data } = await api.get('/showtimes')
  showtimes.value = data
}
const fetchMovies = async () => {
  const { data } = await api.get('/movies')
  movies.value = data
}
const fetchRooms = async () => {
  const { data } = await api.get('/rooms')
  rooms.value = data
}

// ==================== CALCULATE END TIME ====================
const autoCalculateEndTime = () => {
  if (!form.startTime || !form.movieId) return
  const movie = movies.value.find(m => m.movieId === form.movieId)
  if (!movie?.duration) return
  const start = new Date(form.startTime)
  const end = new Date(start.getTime() + (movie.duration + BUFFER_MINUTES) * 60000)
  form.endTime = new Date(end.getTime() - end.getTimezoneOffset() * 60000)
  .toISOString()
  .slice(0, 16)

}

// ==================== MODAL LOGIC ====================
const openCreate = () => {
  Object.assign(form, { showtimeId: null, movieId: '', roomId: '', startTime: '', endTime: '', price: 0 })
}
const openEdit = (st) => {
  Object.assign(form, {
    showtimeId: st.showtimeId,
    movieId: st.movie.movieId,
    roomId: st.room.roomId,
    startTime: st.startTime.slice(0, 16),
    endTime: st.endTime.slice(0, 16),
    price: st.price
  })
}

// ==================== SAVE / DELETE ====================
const save = async () => {
  saving.value = true
  try {
    const payload = {
      movieId: form.movieId,
      roomId: form.roomId,
      startTime: form.startTime,
      endTime: form.endTime,
      price: form.price
    }
    if (form.showtimeId)
      await api.put(`/showtimes/${form.showtimeId}`, payload)
    else
      await api.post('/showtimes', payload)

    await fetchShowtimes()
    modal.hide()
  } finally {
    saving.value = false
  }
}
const remove = async (id) => {
  if (!confirm('Delete this showtime?')) return
  await api.delete(`/showtimes/${id}`)
  await fetchShowtimes()
}

const formatTime = (time) => new Date(time).toLocaleString('vi-VN')

// ==================== INIT ====================
onMounted(async () => {
  modal = new Modal(modalEl.value)
  await Promise.all([fetchShowtimes(), fetchMovies(), fetchRooms()])
})
</script>
