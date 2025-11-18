<template>
  <div class="container py-4">
    <h4 class="mb-4">🎬 Chọn phim</h4>
    
    <!-- Tabs -->
    <ul class="nav nav-tabs mb-4" role="tablist">
      <li class="nav-item" role="presentation">
        <button
          class="nav-link"
          :class="{ active: activeTab === 'now_showing' }"
          @click="activeTab = 'now_showing'"
          role="tab"
        >
          Đang chiếu
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button
          class="nav-link"
          :class="{ active: activeTab === 'coming_soon' }"
          @click="activeTab = 'coming_soon'"
          role="tab"
        >
          Sắp chiếu
        </button>
      </li>
    </ul>

    <!-- Movies Grid -->
    <div class="row g-4">
      <div
        v-for="m in displayedMovies"
        :key="m.movieId"
        class="col-md-3"
      >
        <div class="card movie-card h-100" @click="$emit('select', m)">
          <img :src="m.posterUrl || '/default-poster.jpg'" class="card-img-top" />
          <div class="card-body">
            <h5 class="card-title">{{ m.title }}</h5>
            <p class="text-muted small mb-1">{{ m.genre }} • {{ m.duration }} phút</p>
            <p class="small">{{ m.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="displayedMovies.length === 0" class="alert alert-info mt-4">
      Không có phim nào trong danh mục này
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api'

const activeTab = ref('now_showing')
const nowShowingMovies = ref([])
const comingSoonMovies = ref([])

const displayedMovies = computed(() => {
  return activeTab.value === 'now_showing' ? nowShowingMovies.value : comingSoonMovies.value
})

onMounted(async () => {
  try {
    const [nowRes, comingRes] = await Promise.all([
      api.get('/movies/status/NOW_SHOWING'),
      api.get('/movies/status/COMING_SOON')
    ])
    nowShowingMovies.value = nowRes.data
    comingSoonMovies.value = comingRes.data
  } catch (error) {
    console.error('Lỗi khi tải danh sách phim:', error)
  }
})
</script>

<style scoped>
.nav-tabs .nav-link {
  color: #666;
  border: none;
  border-bottom: 2px solid transparent;
  transition: all 0.3s;
}

.nav-tabs .nav-link:hover {
  border-bottom-color: #ffc107;
  color: #ffc107;
}

.nav-tabs .nav-link.active {
  color: #ffc107;
  border-bottom-color: #ffc107;
  background-color: transparent;
}

.movie-card {
  cursor: pointer;
  transition: all 0.25s;
}

.movie-card:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
}

.card-img-top {
  height: 280px;
  object-fit: cover;
  border-radius: 8px 8px 0 0;
}
</style>
