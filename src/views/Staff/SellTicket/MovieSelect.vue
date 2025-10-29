<template>
  <div class="container py-4">
    <h4 class="mb-3">🎬 Chọn phim</h4>
    <div class="row g-4">
      <div
        v-for="m in movies"
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api'

const movies = ref([])

onMounted(async () => {
  const res = await api.get('/staff/showtimes/movies')
  movies.value = res.data
})
</script>

<style scoped>
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
