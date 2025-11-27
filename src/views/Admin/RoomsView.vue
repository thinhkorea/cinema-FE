<template>
  <div class="container py-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="mb-0 d-flex align-items-center">
        <i class="bi bi-door-open me-2"></i> Room Management
      </h4>
      <button class="btn btn-primary" @click="openModal()">+ Add Room</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary"></div>
    </div>

    <!-- Table -->
    <div v-else>
      <table class="table table-bordered table-striped align-middle">
        <thead class="table-light">
          <tr>
            <th>#</th>
            <th>Room Name</th>
            <th>Capacity</th>
            <th>Type</th>
            <th style="width: 160px">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(room, i) in rooms" :key="room.roomId">
            <td>{{ i + 1 }}</td>
            <td>{{ room.roomName }}</td>
            <td>{{ room.capacity }}</td>
            <td>{{ room.roomType }}</td>
            <td>
              <button class="btn btn-sm btn-outline-secondary me-2" @click="openModal(room)">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger" @click="deleteRoom(room.roomId)">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <p v-if="!rooms.length" class="text-center text-muted mt-3">
        No rooms found.
      </p>
    </div>

    <!-- Modal Add/Edit -->
    <div class="modal fade" id="roomModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <form @submit.prevent="saveRoom">
            <div class="modal-header">
              <h5 class="modal-title">{{ form.roomId ? 'Edit Room' : 'Add Room' }}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Room Name</label>
                <input v-model="form.roomName" class="form-control" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Capacity</label>
                <input type="number" v-model="form.capacity" class="form-control" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Room Type</label>
                <input v-model="form.roomType" class="form-control" placeholder="2D, 3D, IMAX..." />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                Close
              </button>
              <button type="submit" class="btn btn-primary">Save</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../../api'
import * as bootstrap from 'bootstrap'

const rooms = ref([])
const loading = ref(true)
const form = reactive({ roomId: null, roomName: '', capacity: '', roomType: '' })
let modal = null

onMounted(async () => {
  modal = new bootstrap.Modal(document.getElementById('roomModal'))
  await loadRooms()
})

async function loadRooms() {
  try {
    const res = await api.get('/rooms')
    rooms.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function openModal(room = null) {
  if (room) Object.assign(form, room)
  else Object.assign(form, { roomId: null, roomName: '', capacity: '', roomType: '' })
  modal.show()
}

async function saveRoom() {
  try {
    if (form.roomId) await api.put(`/rooms/${form.roomId}`, form)
    else await api.post('/rooms', form)
    await loadRooms()
    modal.hide()
  } catch (e) {
    alert('Failed to save room!')
  }
}

async function deleteRoom(id) {
  if (!confirm('Are you sure to delete this room?')) return
  try {
    await api.delete(`/rooms/${id}`)
    await loadRooms()
  } catch (e) {
    const errorMsg = e.response?.data?.message || e.response?.data || 'Failed to delete room!'
    alert(`Lỗi: ${errorMsg}`)
    console.error('Delete error:', e)
  }
}
</script>

<style scoped>
.table th,
.table td {
  vertical-align: middle;
}
</style>
