<template>
  <AppHeader />

  <div class="booking-container">
    <!-- Loading -->
    <div v-if="loading" class="loading-section">
      <div class="spinner-border text-warning" role="status"></div>
      <p class="text-secondary mt-3">Đang tải thông tin phim...</p>
    </div>

    <!-- Nội dung chính -->
    <div v-else-if="movie" class="booking-content">
      <div class="container">
        <!-- Header Title -->
        <div class="booking-header mb-5">
          <h1 class="booking-title">Đặt vé xem phim</h1>
          <p class="booking-subtitle">{{ movie.title }}</p>
        </div>

        <div class="row g-4">
          <!-- Poster Section -->
          <div class="col-lg-4">
            <div class="poster-card">
              <img
                :src="movie.posterUrl || '/placeholder.svg?height=500&width=350'"
                alt="poster"
                class="poster-image"
              />
              <div class="movie-details mt-4">
                <div class="detail-item">
                  <span class="detail-label">Thể loại</span>
                  <span class="detail-value">{{ movie.genre || 'Đang cập nhật' }}</span>
                </div>
                <div class="detail-item mt-3">
                  <span class="detail-label">Thời lượng</span>
                  <span class="detail-value">{{ movie.duration || '120' }} phút</span>
                </div>
                <div class="detail-item mt-3">
                  <span class="detail-label">Ngôn ngữ</span>
                  <span class="detail-value">{{ movie.language || 'Tiếng Việt' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Selection Section -->
          <div class="col-lg-8">
            <!-- Ngày chiếu -->
            <div class="selection-card mb-5">
              <h3 class="selection-title">Chọn ngày chiếu</h3>

              <div v-if="availableDates.length" class="dates-grid">
                <button
                  v-for="(d, index) in availableDates"
                  :key="index"
                  @click="selectedDate = d"
                  class="date-button"
                  :class="{ active: selectedDate === d }"
                >
                  <span class="date-day">{{ formatDay(d) }}</span>
                  <span class="date-text">{{ formatDateText(d) }}</span>
                </button>
              </div>

              <p v-else class="text-secondary mt-3">Chưa có lịch chiếu cho phim này.</p>
            </div>

            <!-- Suất chiếu -->
            <div class="selection-card">
              <h3 class="selection-title">Chọn suất chiếu</h3>

              <div v-if="selectedDate && filteredShowtimes.length">
                <div class="showtimes-grid">
                  <button
                    v-for="s in filteredShowtimes"
                    :key="s.showtimeId"
                    class="showtime-button"
                    @click="goToSeatMap(s.showtimeId)"
                  >
                    <span class="showtime-time">{{ formatTime(s.startTime) }}</span>
                    <span class="showtime-room">{{ s.room?.roomName || 'Phòng ?' }}</span>
                  </button>
                </div>
              </div>

              <div v-else-if="selectedDate" class="text-center text-secondary py-4">
                <p>Không có suất chiếu nào cho ngày này.</p>
              </div>

              <div v-else class="text-center text-secondary py-4">
                <p>Vui lòng chọn ngày chiếu.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="error-section">
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

// All reactive refs
const movie = ref(null);
const showtimes = ref([]);
const availableDates = ref([]);
const selectedDate = ref(null);
const loading = ref(true);

// Get movieId safely after router is initialized
const movieId = computed(() => route.params.movieId);

// Computed properties
const filteredShowtimes = computed(() =>
  showtimes.value.filter((s) => s.startTime?.startsWith(selectedDate.value))
);

onMounted(async () => {
  try {
    const [resMovie, resShowtime] = await Promise.all([
      api.get(`/movies/${movieId.value}`),
      api.get(`/showtimes/movie/${movieId.value}`),
    ]);

    movie.value = resMovie.data;
    showtimes.value = resShowtime.data || [];

    const dates = showtimes.value
      .map((s) => s.startTime?.split("T")[0])
      .filter(Boolean);
    availableDates.value = [...new Set(dates)];

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

// Helper methods
const formatDay = (d) => {
  const date = new Date(d);
  return date.getDate();
};

const formatDateText = (d) => {
  const date = new Date(d);
  return date.toLocaleDateString("vi-VN", {
    weekday: "short",
    month: "short",
  });
};

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
  router.push(`/booking/${movieId.value}/seats/${showtimeId}`);
};
</script>

<style scoped>
.booking-container {
  background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
  min-height: 100vh;
  padding: 3rem 1rem;
}

.loading-section,
.error-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  color: #fff;
}

.booking-content {
  padding: 2rem 0;
}

/* Header */
.booking-header {
  text-align: center;
  padding: 2rem 0;
  border-bottom: 2px solid rgba(255, 193, 7, 0.2);
}

.booking-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #ffc107;
  letter-spacing: 1px;
  margin-bottom: 0.5rem;
}

.booking-subtitle {
  font-size: 1.3rem;
  color: #e0e0e0;
  font-weight: 300;
}

/* Poster Card */
.poster-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 193, 7, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
}

.poster-image {
  width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  transition: transform 0.3s ease;
}

.poster-image:hover {
  transform: scale(1.02);
}

.movie-details {
  background: rgba(255, 193, 7, 0.08);
  border-radius: 8px;
  padding: 1.5rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(255, 193, 7, 0.1);
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  color: #bdbdbd;
  font-size: 0.9rem;
  font-weight: 500;
}

.detail-value {
  color: #ffc107;
  font-weight: 600;
}

/* Selection Cards */
.selection-card {
  background: rgba(255, 193, 7, 0.05);
  border: 1px solid rgba(255, 193, 7, 0.1);
  border-radius: 12px;
  padding: 2rem;
  backdrop-filter: blur(10px);
}

.selection-title {
  font-size: 1.4rem;
  color: #ffffff;
  font-weight: 600;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
}

.selection-title::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 24px;
  background: #ffc107;
  border-radius: 2px;
  margin-right: 12px;
}

/* Dates Grid */
.dates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 12px;
}

.date-button {
  background: rgba(255, 193, 7, 0.05);
  border: 2px solid rgba(255, 193, 7, 0.2);
  border-radius: 8px;
  padding: 1rem 0.75rem;
  color: #e0e0e0;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.date-day {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffc107;
}

.date-text {
  font-size: 0.75rem;
  color: #bdbdbd;
  text-transform: uppercase;
}

.date-button:hover {
  border-color: #ffc107;
  background: rgba(255, 193, 7, 0.1);
  transform: translateY(-2px);
}

.date-button.active {
  background: #ffc107;
  border-color: #ffc107;
  color: #000;
}

.date-button.active .date-day,
.date-button.active .date-text {
  color: #000;
}

/* Showtimes Grid */
.showtimes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.showtime-button {
  background: rgba(255, 193, 7, 0.05);
  border: 2px solid rgba(255, 193, 7, 0.2);
  border-radius: 8px;
  padding: 1.25rem 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.showtime-time {
  font-size: 1.3rem;
  font-weight: 700;
  color: #ffc107;
}

.showtime-room {
  font-size: 0.85rem;
  color: #bdbdbd;
}

.showtime-button:hover {
  background: #ffc107;
  border-color: #ffc107;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(255, 193, 7, 0.2);
}

.showtime-button:hover .showtime-time,
.showtime-button:hover .showtime-room {
  color: #000;
}

.spinner-border {
  width: 4rem;
  height: 4rem;
  border-width: 0.4em;
}

@media (max-width: 768px) {
  .booking-container {
    padding: 1.5rem 1rem;
  }

  .booking-title {
    font-size: 2rem;
  }

  .booking-subtitle {
    font-size: 1.1rem;
  }

  .selection-card {
    padding: 1.5rem;
  }

  .dates-grid,
  .showtimes-grid {
    grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
    gap: 10px;
  }
}
</style>
