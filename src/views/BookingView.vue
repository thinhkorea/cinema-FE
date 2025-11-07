<template>
  <AppHeader />

  <div class="booking container py-5">
    <!-- Loading -->
    <div v-if="loading" class="text-center mt-5 py-5">
      <div class="spinner-border text-warning" role="status"></div>
      <p class="text-secondary mt-3">Đang tải thông tin phim...</p>
    </div>

    <!-- Nội dung chính -->
    <div v-else-if="movie">
      <h2 class="fw-bold mb-4 text-center">🎬 Đặt vé - {{ movie.title }}</h2>

      <!-- Poster + Thông tin phim -->
      <div class="row mb-4 align-items-center">
        <div class="col-md-3 text-center">
          <img
            :src="movie.posterUrl || '/placeholder.svg?height=400&width=300'"
            alt="poster"
            class="img-fluid rounded shadow-sm"
          />
        </div>
        <div class="col-md-9">
          <p class="text-muted mb-1">
            <strong>Thể loại:</strong> {{ movie.genre || 'Đang cập nhật' }}
          </p>
          <p class="text-muted mb-1">
            <strong>Thời lượng:</strong> {{ movie.duration || '120' }} phút
          </p>
          <p class="text-muted">
            <strong>Ngôn ngữ:</strong> {{ movie.language || 'Tiếng Việt' }}
          </p>
        </div>
      </div>

      <!-- Ngày chiếu -->
      <div class="mb-4">
        <h5 class="fw-bold">📅 Chọn ngày chiếu</h5>

        <div v-if="availableDates.length" class="d-flex flex-wrap gap-3 mt-3">
          <button
            v-for="(d, index) in availableDates"
            :key="index"
            @click="selectedDate = d"
            class="btn"
            :class="selectedDate === d ? 'btn-warning text-dark fw-bold' : 'btn-outline-warning'"
          >
            {{ formatDate(d) }}
          </button>
        </div>

        <p v-else class="text-secondary mt-3">Chưa có lịch chiếu cho phim này.</p>
      </div>

      <!-- Suất chiếu -->
      <div v-if="selectedDate && filteredShowtimes.length" class="mb-5">
        <h5 class="fw-bold">🕓 Chọn suất chiếu</h5>
        <div class="row mt-3">
          <div
            v-for="s in filteredShowtimes"
            :key="s.showtimeId"
            class="col-md-3 col-6 mb-3"
          >
            <button
              class="btn btn-outline-primary w-100"
              @click="goToSeatMap(s.showtimeId)"
            >
              {{ formatTime(s.startTime) }} - {{ s.room?.roomName || 'Phòng ?' }}
            </button>
          </div>
        </div>
      </div>

      <div v-else-if="selectedDate" class="text-center text-secondary py-4">
        <p>Không có suất chiếu nào cho ngày này.</p>
      </div>
    </div>

    <!-- Nếu load lỗi hoặc không có dữ liệu -->
    <div v-else class="text-center text-danger py-5">
      <p>Không thể tải dữ liệu phim. Vui lòng thử lại sau.</p>
    </div>
  </div>
</template>

<script setup>
import AppHeader from "@/components/AppHeader.vue";
import { ref, onMounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import api from "@/api";

const router = useRouter();
const route = useRoute();
const movieId = route.params.movieId;

const movie = ref(null);
const showtimes = ref([]);
const availableDates = ref([]);
const selectedDate = ref(null);
const loading = ref(true);

onMounted(async () => {
  try {
    // Gọi song song 2 API
    const [resMovie, resShowtime] = await Promise.all([
      api.get(`/movies/${movieId}`),
      api.get(`/showtimes/movie/${movieId}`),
    ]);

    movie.value = resMovie.data;
    showtimes.value = resShowtime.data || [];

    // Lấy danh sách ngày duy nhất (YYYY-MM-DD)
    const dates = showtimes.value
      .map((s) => s.startTime?.split("T")[0])
      .filter(Boolean);
    availableDates.value = [...new Set(dates)];

    // Tự động chọn ngày đầu tiên nếu có
    if (availableDates.value.length > 0) {
      selectedDate.value = availableDates.value[0];
    }
  } catch (err) {
    console.error("Lỗi khi tải dữ liệu đặt vé:", err);
    movie.value = null;
  } finally {
    loading.value = false;
  }
});

const filteredShowtimes = computed(() =>
  showtimes.value.filter((s) => s.startTime?.startsWith(selectedDate.value))
);

const formatDate = (d) => {
  const date = new Date(d);
  return date.toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
};

const formatTime = (time) => {
  if (!time) return "";
  const timePart = time.split("T")[1];
  return timePart ? timePart.substring(0, 5) : "";
};

const goToSeatMap = (showtimeId) => {
  router.push(`/booking/${movieId}/seats/${showtimeId}`);
};
</script>

<style scoped>
button.btn {
  min-width: 120px;
  transition: all 0.25s ease;
}

button.btn:hover {
  transform: translateY(-2px);
}

.spinner-border {
  width: 3rem;
  height: 3rem;
}
</style>
