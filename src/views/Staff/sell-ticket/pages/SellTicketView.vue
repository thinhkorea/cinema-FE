<template>
  <div>
    <MovieSelect v-if="step === 1" @select="onMovieSelect" />
    <ShowtimesSelect v-if="step === 2" :movieId="selectedMovie.movieId" @select="onShowtimeSelect" @back="step = 1" />
    <SeatMap v-if="step === 3" :showtime="selectedShowtime" @back="step = 2" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import MovieSelect from '../components/MovieSelect.vue'
import ShowtimesSelect from '../components/ShowtimesSelect.vue'
import SeatMap from '../components/SeatMap.vue'

const step = ref(1)
const selectedMovie = ref(null)
const selectedShowtime = ref(null)

function onMovieSelect(movie) {
  selectedMovie.value = movie
  step.value = 2
}
function onShowtimeSelect(showtime) {
  selectedShowtime.value = showtime
  step.value = 3
}
</script>
