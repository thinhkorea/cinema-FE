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

              <div v-if="upcomingDatesWithCount.length" class="date-picker-wrapper">
                <!-- Calendar Navigation -->
                <div class="calendar-nav mb-4">
                  <button @click="previousMonth" class="btn btn-sm btn-outline-warning">
                    ← Tháng trước
                  </button>
                  <h5 class="text-warning calendar-month-year">
                    {{ formatMonthYear(currentMonth) }}
                  </h5>
                  <button @click="nextMonth" class="btn btn-sm btn-outline-warning">
                    Tháng sau →
                  </button>
                </div>

                <!-- Calendar Grid -->
                <div class="calendar-container">
                  <!-- Day headers -->
                  <div class="calendar-day-header">Thứ 2</div>
                  <div class="calendar-day-header">Thứ 3</div>
                  <div class="calendar-day-header">Thứ 4</div>
                  <div class="calendar-day-header">Thứ 5</div>
                  <div class="calendar-day-header">Thứ 6</div>
                  <div class="calendar-day-header">Thứ 7</div>
                  <div class="calendar-day-header">CN</div>

                  <!-- Calendar days -->
                  <div
                    v-for="day in calendarDays"
                    :key="day.dateStr"
                    class="calendar-day"
                    :class="{
                      'other-month': !day.isCurrentMonth,
                      'has-screening': day.hasScreening,
                      'active': selectedDate === day.dateStr,
                    }"
                    @click="day.isCurrentMonth && day.hasScreening && (selectedDate = day.dateStr)"
                  >
                    <div class="day-number">{{ day.day }}</div>   
                  </div>
                </div>

                <!-- Selected Date Display -->
                <!-- Removed .selected-date-display styles and calendar container padding adjustments -->
              </div>

              <p v-else class="text-secondary mt-3">Chưa có lịch chiếu cho phim này.</p>
            </div>

            <!-- Suất chiếu -->
            <div class="selection-card">
              <h3 class="selection-title">Chọn suất chiếu</h3>

              <div v-if="selectedDate && filteredShowtimes.length">
                <!-- Added date display header above showtimes -->
                <div class="selected-date-header mb-3">
                  <strong>{{ formatFullDate(selectedDate) }}</strong>
                </div>
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

// helper: ISO datetime -> local YYYY-MM-DD
const toLocalDateStr = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// All reactive refs
const movie = ref(null);
const showtimes = ref([]);
const selectedDate = ref(null);
const loading = ref(true);
const currentMonth = ref(new Date());

// Get movieId safely after router is initialized
const movieId = computed(() => route.params.movieId);

const upcomingDatesWithCount = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const datesMap = new Map();
  
  // Group showtimes by date
  showtimes.value.forEach((s) => {
    if (s.startTime) {
      const dateStr = s.startTime.split("T")[0];
      const dateObj = new Date(dateStr);
      
      // Only include if date is today or in the future
      if (dateObj >= today) {
        if (!datesMap.has(dateStr)) {
          datesMap.set(dateStr, { date: dateStr, count: 0 });
        }
        datesMap.get(dateStr).count++;
      }
    }
  });
  
  // Convert to array and sort by date, limit to 7 days
  const result = Array.from(datesMap.values())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 7);
  
  return result;
});

const calendarDays = computed(() => {
  const year = currentMonth.value.getFullYear();
  const month = currentMonth.value.getMonth();
  
  // Get first day of month (0 = Sunday, need to adjust to Monday = 0)
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Get the weekday (0 = Sunday), convert to Monday = 0
  let startDate = new Date(firstDay);
  let dayOfWeek = startDate.getDay();
  dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday from 0 to 6
  
  startDate.setDate(startDate.getDate() - dayOfWeek);
  
  const days = [];
  const screeningDates = new Map();
  
  // Build map of available screening dates and counts
  upcomingDatesWithCount.value.forEach((d) => {
    screeningDates.set(d.date, d.count);
  });
  
  // Generate 42 days (6 weeks) for calendar grid
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;
    const isCurrentMonth = date.getMonth() === month;
    const hasScreening = screeningDates.has(dateStr);
    
    days.push({
      day: date.getDate(),
      dateStr: dateStr,
      isCurrentMonth: isCurrentMonth,
      hasScreening: hasScreening,
      screeningCount: screeningDates.get(dateStr) || 0,
    });
  }
  
  return days;
});

const filteredShowtimes = computed(() =>
  showtimes.value.filter((s) => toLocalDateStr(s.startTime) === selectedDate.value)
);

onMounted(async () => {
  try {
    const [resMovie, resShowtime] = await Promise.all([
      api.get(`/movies/${movieId.value}`),
      api.get(`/showtimes/movie/${movieId.value}`),
    ]);

    movie.value = resMovie.data;
    showtimes.value = resShowtime.data || [];

    // Set default selected date to first available date
    if (upcomingDatesWithCount.value.length > 0) {
      selectedDate.value = upcomingDatesWithCount.value[0].date;
    }
  } catch (err) {
    console.error("Lỗi khi tải dữ liệu đặt vé:", err);
    movie.value = null;
  } finally {
    loading.value = false;
  }
});

const previousMonth = () => {
  currentMonth.value = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth() - 1
  );
};

const nextMonth = () => {
  currentMonth.value = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth() + 1
  );
};

const formatMonthYear = (date) => {
  return date.toLocaleDateString("vi-VN", {
    month: "long",
    year: "numeric",
  });
};

const formatFullDate = (d) => {
  if (!d) return "";
  const date = new Date(d);
  return date.toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
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

/* Date Picker Wrapper */
.date-picker-wrapper {
  width: 100%;
}

.calendar-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  /* ngăn wrap trên màn nhỏ */
  flex-wrap: nowrap;
}

.calendar-nav .btn {
  flex: 0 0 auto;
}

.calendar-month-year {
  margin: 0;
  flex: 1 1 auto;        /* chiếm không gian chính giữa */
  text-align: center;
  font-weight: 600;
  white-space: nowrap;   /* không xuống dòng */
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Nếu muốn tiêu đề nhỏ hơn trên màn nhỏ */
@media (max-width: 480px) {
  .calendar-nav {
    gap: 6px;
  }
  .calendar-month-year {
    font-size: 0.9rem;
  }
}


/* ==== TÙY CHỈNH: thu nhỏ calendar ==== */
.calendar-container {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px; /* giảm gap */
  padding: 0.5rem; /* giảm padding */
  background: rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  max-width: 420px; /* giới hạn chiều rộng */
  margin: 0 auto; /* căn giữa */
  grid-auto-rows: 42px; /* chiều cao cố định cho hàng */
}

/* Header của các ngày */
.calendar-day-header {
  text-align: center;
  font-weight: 600;
  color: #ffc107;
  padding: 0.4rem 0;
  font-size: 0.75rem; /* giảm font */
  text-transform: uppercase;
  border-bottom: 2px solid rgba(255, 193, 7, 0.15);
}

/* Các ô ngày */
.calendar-day {
  /* bỏ aspect-ratio để dùng grid-auto-rows */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 42px; /* cố định chiều cao */
  border: 1px solid rgba(255, 193, 7, 0.12);
  border-radius: 6px;
  background: rgba(255, 193, 7, 0.02);
  color: #e0e0e0;
  cursor: not-allowed;
  position: relative;
  transition: all 0.18s ease;
  font-size: 0.72rem; /* giảm font */
  padding: 4px;
}

.calendar-day.other-month {
  opacity: 0.45;
  background: rgba(0, 0, 0, 0.12);
}

.calendar-day.has-screening {
  cursor: pointer;
  border-color: rgba(255, 193, 7, 0.28);
  background: rgba(255, 193, 7, 0.06);
}

.calendar-day.has-screening:hover {
  background: rgba(255, 193, 7, 0.12);
  border-color: #ffc107;
  transform: translateY(-2px);
}

.calendar-day.active {
  background: #ffc107;
  border-color: #ffc107;
  color: #000;
}

.day-number {
  font-weight: 700;
  font-size: 0.9rem; /* giảm */
}

/* Responsive: nhỏ hơn trên mobile */
@media (max-width: 480px) {
  .calendar-container {
    max-width: 320px;
    grid-auto-rows: 36px;
  }
  .calendar-day {
    height: 36px;
    font-size: 0.65rem;
  }
  .day-number {
    font-size: 0.8rem;
  }
  .calendar-day-header {
    font-size: 0.65rem;
  }
}

/* Selected date display */
/* Removed .selected-date-display styles */

/* Showtimes Grid */
.showtimes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
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
  color: #e0e0e0;
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

  .calendar-container {
    gap: 4px;
    padding: 0.75rem;
  }

  .calendar-day {
    aspect-ratio: 1;
    font-size: 0.8rem;
  }

  .day-number {
    font-size: 0.95rem;
  }

  .screening-badge {
    font-size: 0.6rem;
    bottom: 2px;
  }

  .showtimes-grid {
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    gap: 10px;
  }

  .calendar-nav {
    flex-wrap: wrap;
  }
}

/* Added new header style for selected date in showtimes section */
.selected-date-header {
  color: #ffc107;
  font-size: 1.1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(255, 193, 7, 0.2);
}
</style>
