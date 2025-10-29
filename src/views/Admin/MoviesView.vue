<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="mb-0 d-flex align-items-center">
        <i class="bi bi-film me-2"></i> Movies Management
      </h4>
      <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#movieModal" @click="openCreate">
        + Add Movie
      </button>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary"></div>
    </div>

    <div v-else>
      <table class="table table-hover align-middle">
        <thead class="table-light">
          <tr>
            <th>#</th>
            <th>Poster</th>
            <th>Title</th>
            <th>Genre</th>
            <th>Duration</th>
            <th>Description</th>
            <th>Trailer</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody v-if="movies.length">
          <tr v-for="(m, i) in movies" :key="m.movieId">
            <td>{{ i + 1 }}</td>
            <td>
              <img
                v-if="m.posterUrl"
                :src="m.posterUrl"
                alt="Poster"
                width="60"
                class="rounded shadow-sm"
              />
              <span v-else class="text-muted">N/A</span>
            </td>
            <td>{{ m.title }}</td>
            <td>{{ m.genre || '-' }}</td>
            <td>{{ m.duration }} min</td>
            <td style="max-width: 250px">{{ m.description || '-' }}</td>
            <td>
              <a
                v-if="m.trailerUrl"
                :href="m.trailerUrl"
                target="_blank"
                class="btn btn-sm btn-outline-primary"
              >
                <i class="bi bi-play-circle"></i>
              </a>
              <span v-else class="text-muted">N/A</span>
            </td>
            <td>
              <button
                class="btn btn-sm btn-outline-secondary me-2"
                data-bs-toggle="modal"
                data-bs-target="#movieModal"
                @click="openEdit(m)"
              >
                Edit
              </button>
              <button class="btn btn-sm btn-outline-danger" @click="remove(m.movieId)">
                Delete
              </button>
            </td>
          </tr>
        </tbody>

        <tbody v-else>
          <tr>
            <td colspan="8" class="text-center text-muted">No movies found</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- 🎞️ Modal thêm/sửa phim -->
  <div class="modal fade" id="movieModal" tabindex="-1" aria-hidden="true" ref="modalEl">
    <div class="modal-dialog modal-lg">
      <form class="modal-content" @submit.prevent="save">
        <div class="modal-header">
          <h5 class="modal-title">{{ form.movieId ? 'Edit Movie' : 'Add Movie' }}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>

        <div class="modal-body">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Title</label>
              <input v-model="form.title" class="form-control" required />
            </div>

            <div class="col-md-6">
              <label class="form-label">Genre</label>
              <input v-model="form.genre" class="form-control" placeholder="e.g. Action, Comedy" />
            </div>

            <div class="col-md-4">
              <label class="form-label">Duration (min)</label>
              <input type="number" v-model.number="form.duration" class="form-control" required />
            </div>

            <div class="col-md-8">
              <label class="form-label">Poster URL</label>
              <input v-model="form.posterUrl" class="form-control" placeholder="Image link" />
            </div>

            <div class="col-md-12">
              <label class="form-label">Trailer URL</label>
              <input v-model="form.trailerUrl" class="form-control" placeholder="YouTube link" />
            </div>

            <div class="col-md-12">
              <label class="form-label">Description</label>
              <textarea v-model="form.description" rows="2" class="form-control"></textarea>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" type="button" data-bs-dismiss="modal">Cancel</button>
          <button class="btn btn-primary" type="submit" :disabled="saving">
            <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
            Save
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Modal } from 'bootstrap'
import api from '../../api'

const movies = ref([])
const loading = ref(true)
const saving = ref(false)
const modalEl = ref(null)
let modal

const form = reactive({
  movieId: null,
  title: '',
  genre: '',
  duration: 0,
  description: '',
  posterUrl: '',
  trailerUrl: ''
})

const fetchMovies = async () => {
  loading.value = true
  try {
    const res = await api.get('/movies')
    movies.value = res.data
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  Object.assign(form, {
    movieId: null,
    title: '',
    genre: '',
    duration: 0,
    description: '',
    posterUrl: '',
    trailerUrl: ''
  })
}

const openEdit = (movie) => {
  Object.assign(form, movie)
}

const save = async () => {
  saving.value = true
  try {
    if (form.movieId) {
      await api.put(`/movies/${form.movieId}`, form)
    } else {
      await api.post('/movies', form)
    }
    modal.hide()
    await fetchMovies()
  } finally {
    saving.value = false
  }
}

const remove = async (id) => {
  if (!confirm('Delete this movie?')) return
  await api.delete(`/movies/${id}`)
  await fetchMovies()
}

onMounted(async () => {
  modal = new Modal(modalEl.value)
  await fetchMovies()
})
</script>

<style scoped>
.table th,
.table td {
  vertical-align: middle;
}
img {
  object-fit: cover;
}
</style>
