<template>
  <AppHeader />
  <div class="movie-detail">
    <!-- Loading State -->
    <div v-if="!movie" class="loading-container d-flex align-items-center justify-content-center">
      <div class="text-center">
        <div class="spinner-border text-warning mb-3" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="text-secondary">Đang tải thông tin phim...</p>
      </div>
    </div>

    <!-- Main Content -->
    <div v-if="movie">
      <!-- Wrapped hero banner in container-fluid to constrain width -->
      <div class="hero-banner-wrapper">
        <!-- Hero Banner Section -->
        <div class="hero-banner position-relative">
          <!-- Background Image -->
          <div class="hero-image-wrapper">
            <img 
              :src="movie.posterUrl || '/placeholder.svg?height=1080&width=1920'" 
              :alt="movie.title"
              class="hero-image"
            />
            <!-- Gradient overlay -->
            <div class="hero-overlay"></div>
          </div>

          <!-- Content Overlay -->
          <div class="hero-content position-absolute bottom-0 start-0 end-0 p-5">
            <div class="container">
              <div class="row">
                <div class="col-lg-8">
                  <!-- Movie Title -->
                  <h1 class="display-3 fw-bold text-white mb-3">
                    {{ movie.title }}
                  </h1>

                  <!-- Quick Info -->
                  <div class="quick-info mb-4 text-light">
                    <span class="me-4">
                      <i class="bi bi-calendar-event me-2"></i>
                      {{ movie.releaseDate || 'Đang cập nhật' }}
                    </span>
                    <span class="me-4">
                      <i class="bi bi-clock me-2"></i>
                      {{ movie.duration || '120' }} phút
                    </span>
                    <span class="me-4">
                      <i class="bi bi-globe me-2"></i>
                      {{ movie.language || 'Tiếng Việt' }}
                    </span>
                    <span>
                      <i class="bi bi-film me-2"></i>
                      {{ movie.rating || 'T16+' }}
                    </span>
                  </div>

                  <!-- Description -->
                  <p class="lead text-light mb-4 description-text">
                    {{ movie.longDescription || movie.description || 'Đang cập nhật nội dung...' }}
                  </p>

                  <!-- CTA Button -->
                  <button 
                    @click="goBooking"
                    class="btn btn-warning btn-lg fw-bold px-5"
                  >
                    <i class="bi bi-ticket-perforated me-2"></i>Đặt vé ngay
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Details Section -->
      <div class="details-section bg-dark py-5">
        <div class="container">
          <div class="row">
            <!-- Main Content -->
            <div class="col-lg-8">
              <!-- Trailer Section -->
              <div class="mb-5">
                <h2 class="h3 fw-bold text-white mb-4">Trailer</h2>
                <!-- Updated trailer section to properly display from database -->
                <div class="trailer-container mb-4">
                  <div class="ratio ratio-16x9">
                    <div v-if="movie.trailerUrl" class="trailer-wrapper">
                      <iframe 
                        :src="getTrailerUrl(movie.trailerUrl)" 
                        title="Trailer phim"
                        allowfullscreen=""
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        class="trailer-iframe"
                      ></iframe>
                    </div>
                    <div v-else class="trailer-placeholder d-flex align-items-center justify-content-center">
                      <div class="text-center">
                        <i class="bi bi-play-circle display-1 text-warning mb-3"></i>
                        <p class="text-light">Trailer sắp cập nhật</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Full Description -->
              <div class="mb-5">
                <h2 class="h3 fw-bold text-white mb-4">Nội dung phim</h2>
                <p class="text-light description-full">
                  {{ movie.longDescription || movie.description || 'Đang cập nhật nội dung...' }}
                </p>
              </div>

              <!-- Additional Info -->
              <div class="mb-4">
                <h2 class="h3 fw-bold text-white mb-4">Thông tin chi tiết</h2>
                <div class="info-table">
                  <div class="info-row">
                    <span class="info-label">Thể loại</span>
                    <span class="info-value">{{ movie.genre || 'Đang cập nhật' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Đạo diễn</span>
                    <span class="info-value">{{ movie.director || 'Đang cập nhật' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Diễn viên</span>
                    <span class="info-value">{{ movie.actors || 'Đang cập nhật' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Ngôn ngữ</span>
                    <span class="info-value">{{ movie.language || 'Tiếng Việt' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Kiểm duyệt</span>
                    <span class="info-value text-warning fw-bold">{{ movie.rating || 'T16+' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sidebar - Movie Poster -->
            <div class="col-lg-4">
              <div class="poster-sticky">
                <!-- Updated card styling to match trailer section aesthetic -->
                <div class="card bg-dark border-0 rounded-2 overflow-hidden mb-4">
                  <div class="poster-card-wrapper">
                    <img 
                      :src="movie.posterUrl || '/placeholder.svg?height=600&width=400'" 
                      :alt="movie.title"
                      class="card-img-top poster-image"
                    />
                  </div>
                </div>
                <!-- Styled button to match trailer section -->
                <button 
                  @click="goBooking"
                  class="btn btn-warning w-100 fw-bold py-3 rounded-2"
                >
                  <i class="bi bi-ticket-perforated me-2"></i>Đặt vé
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import AppHeader from "@/components/AppHeader.vue";
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "@/api";

const route = useRoute();
const router = useRouter();
const movie = ref(null);

// Ensure all hooks are called at the top level
onMounted(async () => {
  try {
    const movieId = route.params.id;
    const res = await api.get(`/movies/${movieId}`);
    movie.value = res.data;
  } catch (err) {
    console.error("Lỗi khi tải phim:", err);
    router.push("/");
  }
});

const goBooking = () => {
  const id = movie.value?.movieId || movie.value?.id;
  if (id) {
    router.push(`/booking/${id}`);
  } else {
    alert("Không tìm thấy phim để đặt vé.");
  }
};


const getTrailerUrl = (trailerUrl) => {
  // If URL is already an embed URL, return it as-is
  if (trailerUrl.includes('embed') || trailerUrl.includes('youtube.com/embed')) {
    return trailerUrl;
  }
  // If it's a YouTube watch URL, convert to embed URL
  if (trailerUrl.includes('youtube.com/watch')) {
    const videoId = trailerUrl.split('v=')[1];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  // If it's a youtu.be short URL, convert to embed URL
  if (trailerUrl.includes('youtu.be')) {
    const videoId = trailerUrl.split('youtu.be/')[1];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  // Return as-is if format is not recognized
  return trailerUrl;
};
</script>

<style scoped>
/* --- Loading --- */
.loading-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
}

.spinner-border {
  width: 50px;
  height: 50px;
}

/* --- Hero Banner --- */
.hero-banner-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.hero-banner {
  position: relative;
  height: 60vh;
  width: 100%;
  overflow: hidden;
  background-color: #1a1a1a;
}

.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(50%);
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.5), transparent);
}

.hero-content {
  position: relative;
  z-index: 10;
  bottom: 0;
  padding: 40px 20px 25px;
}

.quick-info {
  font-size: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.quick-info i {
  color: #ffc107;
}

.description-text {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.6;
}

/* --- Unified Section Background --- */
.details-section {
  background: linear-gradient(180deg, #111 0%, #1a1a1a 100%);
  border-top: none;
  color: #f8f9fa;
}

/* --- Trailer + Poster unified look --- */
.trailer-container,
.poster-card-wrapper {
  border-radius: 10px;
  overflow: hidden;
  background: #000;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.trailer-container:hover,
.poster-card-wrapper:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 24px rgba(255, 193, 7, 0.2);
}

.trailer-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

/* --- Poster Image --- */
.poster-image {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
  border-radius: 10px;
}

/* --- Info Table --- */
.info-table {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 15px 20px;
  border-bottom: 1px solid #444;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  color: #999;
  font-weight: 500;
}

.info-value {
  color: #e9ecef;
  font-weight: 600;
}

/* --- Button --- */
.btn-warning {
  background-color: #ffc107;
  border-color: #ffc107;
  color: #000;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.btn-warning:hover {
  background-color: #ffb300;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.25);
}

.btn-warning:active {
  transform: translateY(0);
}

/* --- Responsive --- */
@media (max-width: 768px) {
  .hero-banner {
    height: 50vh;
  }

  .hero-content {
    padding: 20px 15px 15px;
  }

  .poster-sticky {
    position: static;
    margin-top: 30px;
  }
}

/* --- Animations --- */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.movie-detail {
  animation: fadeIn 0.6s ease-out;
  background-color: #0d0d0d;
  color: #fff;
  min-height: 100vh;
  width: 100vw;
  margin: 0;
  overflow-x: hidden;
}
</style>
