<template>
    <div class="movies-page">
        <AppHeader />

        <!-- Page Title -->
        <section class="page-title-section">
            <div class="container">
                <h1 class="page-main-title">DANH SÁCH PHIM</h1>

                <!-- Tab Navigation -->
                <div class="movie-tabs">
                    <button
                        v-for="tab in movieTabs"
                        :key="tab.key"
                        :class="['tab-btn', { active: activeTab === tab.key }]"
                        @click="activeTab = tab.key"
                    >
                        <i :class="tab.icon"></i>
                        {{ tab.name }}
                    </button>
                </div>
            </div>
        </section>

        <!-- Movies List -->
        <section class="movies-list-section">
            <div class="container">
                <!-- Loading State -->
                <div v-if="loading" class="loading-section">
                    <div class="loading-spinner"></div>
                    <p class="loading-text">Đang tải danh sách phim...</p>
                </div>

                <!-- Movies Vertical List -->
                <div v-else class="movies-vertical-list">
                    <div v-for="movie in filteredMovies" :key="movie.movieId" class="movie-item">
                        <div class="movie-poster-section">
                            <img :src="movie.posterUrl" :alt="movie.title" class="movie-poster" />
                        </div>

                        <div class="movie-details-section">
                            <div class="movie-info-content">
                                <div class="movie-header">
                                    <h2 class="movie-title">{{ movie.title.toUpperCase() }}</h2>
                                    <button
                                        class="detail-btn"
                                        @click="goToDetail(movie.movieId)"
                                        title="Xem chi tiết phim"
                                    >
                                        <i class="bi bi-info-circle"></i>
                                    </button>
                                </div>

                                <div class="movie-info-grid">
                                    <div class="info-row">
                                        <div class="info-item">
                                            <i class="bi bi-camera-reels info-icon"></i>
                                            <span class="info-label">{{ movie.genre || "Phim" }}</span>
                                        </div>
                                    </div>

                                    <div class="info-row">
                                        <div class="info-item">
                                            <i class="bi bi-shield-check info-icon"></i>
                                            <span class="info-label">{{ formatAgeRating(movie.ageRating) }}</span>
                                        </div>
                                    </div>

                                    <div class="info-row">
                                        <div class="info-item">
                                            <i class="bi bi-clock info-icon"></i>
                                            <span class="info-label">{{ movie.duration || 120 }} phút</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="showtimes-section">
                                <template v-if="getMovieShowtimes(movie.movieId).length > 0">
                                    <div
                                        v-for="(showtimesGroup, date) in getFirstDateShowtimes(movie.movieId)"
                                        :key="date"
                                        class="showtime-date-group"
                                    >
                                        <div class="showtime-date">
                                            <h4>{{ formatDate(date) }}</h4>
                                            <div class="showtime-type">STANDARD</div>
                                        </div>
                                        <div class="showtime-buttons">
                                            <button
                                                v-for="showtime in showtimesGroup.slice(0, 4)"
                                                :key="showtime.showtimeId"
                                                class="showtime-btn"
                                                @click="goToDetail(movie.movieId)"
                                            >
                                                {{ formatTime(showtime.startTime) }}
                                            </button>
                                            <button
                                                v-if="showtimesGroup.length > 4"
                                                class="showtime-btn more-btn"
                                                @click="goToDetail(movie.movieId)"
                                            >
                                                +{{ showtimesGroup.length - 4 }}
                                            </button>
                                        </div>
                                    </div>
                                    <!-- Nút xem chi tiết chỉ hiển thị khi có suất chiếu -->
                                    <button class="more-showtimes-btn" @click="goToDetail(movie.movieId)">
                                        Xem chi tiết phim
                                    </button>
                                </template>
                                <template v-else>
                                    <div class="no-showtimes">
                                        <p>Chưa có suất chiếu</p>
                                    </div>
                                </template>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Empty State -->
                <div v-if="!loading && filteredMovies.length === 0" class="empty-section">
                    <div class="empty-icon"></div>
                    <h3 class="empty-title">Không có phim nào</h3>
                    <p class="empty-text">Hiện tại không có phim nào trong danh mục này</p>
                </div>
            </div>
        </section>

        <!-- FOOTER -->
        <AppFooter />
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import AppHeader from "@/components/AppHeader.vue";
import AppFooter from "@/components/AppFooter.vue";
import api from "@/api";

const router = useRouter();
const movies = ref([]);
const showtimes = ref({});
const loading = ref(true);
const activeTab = ref("now-showing");

const movieTabs = [
    { key: "now-showing", name: "Phim đang chiếu", icon: "bi bi-play-circle" },
    { key: "coming-soon", name: "Phim sắp chiếu", icon: "bi bi-clock" },
    { key: "special", name: "Đặc biệt", icon: "bi bi-star" },
];

const filteredMovies = computed(() => {
    let filtered = movies.value;

    // Lọc theo status
    if (activeTab.value === "now-showing") {
        filtered = movies.value.filter((movie) => movie.status === "NOW_SHOWING");
    } else if (activeTab.value === "coming-soon") {
        filtered = movies.value.filter((movie) => movie.status === "COMING_SOON");
    } else if (activeTab.value === "special") {
        filtered = movies.value.filter((movie) => movie.status === "SPECIAL_RELEASE");
    }

    return filtered;
});

const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
};

const formatAgeRating = (ageRating) => {
    if (!ageRating) return "P - Phổ thông";

    // Mapping theo enum backend
    const ratingMap = {
        P: "Phổ thông",
        C13: "Cấm dưới 13 tuổi",
        C16: "Cấm dưới 16 tuổi",
        C18: "Cấm dưới 18 tuổi",
    };

    // Nếu có trong map thì return, không thì return as is
    return ratingMap[ageRating] || ageRating;
};

const goToDetail = (movieId) => {
    router.push(`/booking/${movieId}`);
};

const fetchMoviesAndShowtimes = async () => {
    try {
        // Lấy danh sách phim
        const moviesResponse = await api.get("/movies");
        movies.value = moviesResponse.data || [];

        // Lấy suất chiếu cho tất cả phim
        const showtimesData = {};
        const moviesToProcess = movies.value; // Lấy tất cả phim

        for (const movie of moviesToProcess) {
            try {
                const showtimesResponse = await api.get(`/showtimes/movie/${movie.movieId}`);
                const showtimesArray = showtimesResponse.data || [];

                // Debug: Log cấu trúc dữ liệu showtime đầu tiên (chỉ cho phim đầu tiên)
                if (showtimesArray.length > 0 && movie.movieId <= 482) {
                    console.log(`Sample showtime for movie ${movie.movieId}:`, showtimesArray[0]);
                }

                showtimesData[movie.movieId] = showtimesArray;
            } catch (error) {
                // Xử lý lỗi một cách im lặng, chỉ ghi log khi cần thiết
                if (error.response?.status === 500) {
                    console.error(`Server error for movie ${movie.movieId}:`, error.response.status);
                }
                showtimesData[movie.movieId] = [];
            }
        }
        showtimes.value = showtimesData;
    } catch (error) {
        console.error("Error loading movies:", error);
        if (error.response) {
            console.error("Response data:", error.response.data);
            console.error("Response status:", error.response.status);
        }
    } finally {
        loading.value = false;
    }
};

const formatTime = (timeString) => {
    if (!timeString) return "";

    // Nếu là object Date hoặc timestamp
    if (timeString instanceof Date) {
        return timeString.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    }

    // Nếu là string
    if (typeof timeString === "string") {
        // Nếu có định dạng HH:MM:SS hoặc HH:MM
        const timeMatch = timeString.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
        if (timeMatch) {
            return `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`;
        }

        // Thử parse như datetime string
        const date = new Date(timeString);
        if (!isNaN(date.getTime())) {
            return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
        }
    }

    return "";
};

const formatDate = (dateString) => {
    if (!dateString) return "";

    try {
        let date;

        // Nếu đã là Date object
        if (dateString instanceof Date) {
            date = dateString;
        } else {
            // Thử parse string date
            date = new Date(dateString);
        }

        // Kiểm tra date có hợp lệ không
        if (isNaN(date.getTime())) {
            console.warn("Invalid date:", dateString);
            return "Ngày không hợp lệ";
        }

        const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
        const day = days[date.getDay()];
        const dateStr = date.toLocaleDateString("vi-VN");
        return `${day}, ${dateStr}`;
    } catch (error) {
        console.error("Error formatting date:", dateString, error);
        return "Ngày không hợp lệ";
    }
};

const getMovieShowtimes = (movieId) => {
    return showtimes.value[movieId] || [];
};

const getFirstDateShowtimes = (movieId) => {
    const movieShowtimes = getMovieShowtimes(movieId);
    if (movieShowtimes.length === 0) return {};

    const grouped = groupShowtimesByDate(movieShowtimes);
    const dates = Object.keys(grouped).sort(); // Sắp xếp theo ngày

    if (dates.length === 0) return {};

    const firstDate = dates[0];
    return { [firstDate]: grouped[firstDate] };
};

const groupShowtimesByDate = (movieShowtimes) => {
    const grouped = {};

    if (!Array.isArray(movieShowtimes)) {
        return grouped;
    }

    movieShowtimes.forEach((showtime) => {
        // Sử dụng startTime từ backend
        const startTime = showtime.startTime;

        if (!startTime) {
            console.warn("Showtime missing startTime field:", showtime);
            return;
        }

        // Tạo key date string để group
        let dateKey;
        try {
            const dateObj = new Date(startTime);
            if (isNaN(dateObj.getTime())) {
                console.warn("Invalid startTime in showtime:", startTime);
                return;
            }
            dateKey = dateObj.toISOString().split("T")[0]; // YYYY-MM-DD format
        } catch (error) {
            console.error("Error processing showtime startTime:", startTime, error);
            return;
        }

        if (!grouped[dateKey]) {
            grouped[dateKey] = [];
        }
        grouped[dateKey].push(showtime);
    });

    return grouped;
};

onMounted(() => {
    fetchMoviesAndShowtimes();
});
</script>

<style scoped>
/* Global Styles */
.movies-page {
    background: #f5f5f5;
    min-height: 100vh;
    color: #333;
}

.container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 2rem;
}

/* Page Title Section */
.page-title-section {
    padding: 3rem 0 2rem 0;
    text-align: center;
    background: #fff;
    border-bottom: 1px solid #e9e9e9;
}

.page-main-title {
    font-size: 3.5rem;
    font-weight: 900;
    color: #2f2f2f;
    margin: 0 0 2rem 0;
    text-shadow: none;
    letter-spacing: 3px;
}

/* Movie Tabs */
.movie-tabs {
    display: flex;
    justify-content: center;
    gap: 1rem;
    flex-wrap: wrap;
}

.tab-btn {
    background: #fff;
    border: 1px solid #dedede;
    color: #666;
    padding: 0.75rem 1.5rem;
    border-radius: 25px;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.tab-btn:hover {
    background: #fff5f2;
    border-color: #ffbfa8;
    color: #ff6b35;
    transform: translateY(-2px);
}

.tab-btn.active {
    background: #ff6b35;
    border-color: #ff6b35;
    color: #fff;
    font-weight: 700;
}

.tab-btn i {
    font-size: 1rem;
}

/* Movies List Section */
.movies-list-section {
    padding: 2rem 0 4rem 0;
}

.movies-vertical-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
}

.movie-item {
    display: flex;
    flex-direction: row;
    background: #fff;
    border-radius: 15px;
    overflow: hidden;
    border: 1px solid #e2e2e2;
    transition: all 0.3s ease;
    min-height: 320px;
    height: auto;
}

.movie-item:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 24px rgba(255, 107, 53, 0.2);
    border-color: #ffc8b4;
}

.movie-poster-section {
    position: relative;
    width: 200px;
    flex-shrink: 0;
}

.movie-poster {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    border-radius: 15px 0 0 15px;
}

.movie-details-section {
    flex: 1;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    height: 100%;
}

.movie-info-content {
    flex: 0 0 auto;
    margin-bottom: 1rem;
}

.movie-header {
    margin-bottom: 0.75rem;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    min-height: 2.6rem;
}

.movie-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: #2f2f2f;
    margin: 0;
    line-height: 1.2;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-word;
    flex: 1;
    max-height: 2.6rem;
}

.detail-btn {
    background: #fff5f2;
    border: 1px solid #ffcab8;
    color: #ff6b35;
    padding: 0.4rem;
    border-radius: 50%;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 32px;
    height: 32px;
}

.detail-btn:hover {
    background: #ff6b35;
    border-color: #ff6b35;
    color: #fff;
    transform: translateY(-1px);
}

.movie-info-grid {
    margin-bottom: 1rem;
}

.info-row {
    display: flex;
    margin-bottom: 0.5rem;
}

.info-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    color: #666;
    font-size: 0.8rem;
    width: 100%;
}

.info-icon {
    color: #ff6b35;
    font-size: 1rem;
}

.info-label {
    font-weight: 500;
}

.showtimes-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.showtimes-content {
    flex: 1;
    max-height: 120px;
    overflow-y: auto;
    margin-bottom: 0.75rem;
}

.showtimes-content::-webkit-scrollbar {
    width: 4px;
}

.showtimes-content::-webkit-scrollbar-track {
    background: #f0f0f0;
    border-radius: 2px;
}

.showtimes-content::-webkit-scrollbar-thumb {
    background: rgba(255, 107, 53, 0.5);
    border-radius: 2px;
}

.showtime-date {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
    padding-bottom: 0.4rem;
    border-bottom: 1px solid #ececec;
}

.showtime-date h4 {
    font-size: 0.95rem;
    font-weight: 600;
    color: #333;
    margin: 0;
}

.showtime-type {
    background: #fff1eb;
    color: #ff6b35;
    padding: 0.25rem 0.75rem;
    border-radius: 15px;
    font-size: 0.8rem;
    font-weight: 600;
    border: 1px solid #ffc6b3;
}

.showtime-buttons {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
}

.showtime-btn {
    background: #fff;
    color: #444;
    border: 1px solid #dedede;
    padding: 0.4rem 0.8rem;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.3s ease;
}

.showtime-btn:hover {
    background: #ff6b35;
    color: #fff;
    border-color: #ff6b35;
    transform: translateY(-2px);
}

.showtime-btn.more-btn {
    background: #fff4ef;
    border-color: #ffc6b3;
    color: #ff6b35;
    font-weight: 700;
}

.showtime-btn.more-btn:hover {
    background: #ff6b35;
    border-color: #ff6b35;
    color: #fff;
}

.more-showtimes-btn {
    background: none;
    border: none;
    color: #ff6b35;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    text-decoration: underline;
    transition: color 0.3s ease;
    margin-top: 0.5rem;
    padding: 0.25rem 0;
    width: 100%;
    text-align: center;
}

.more-showtimes-btn:hover {
    color: #ff5722;
}

/* Loading State */
.loading-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 0;
}

.loading-spinner {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(255, 107, 53, 0.15);
    border-top-color: #ff6b35;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
}

.loading-text {
    color: #666;
    font-size: 1.1rem;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* Empty State */
.empty-section {
    text-align: center;
    padding: 4rem 0;
}

.empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
}

.showtime-date-group {
    margin-bottom: 1rem;
}

.showtime-date-group:last-of-type {
    margin-bottom: 0.5rem;
}

.no-showtimes {
    text-align: center;
    padding: 1rem;
    color: #888;
    font-style: italic;
    font-size: 0.9rem;
}

.empty-title {
    font-size: 1.5rem;
    color: #333;
    margin-bottom: 0.5rem;
}

.empty-text {
    color: #666;
    font-size: 1rem;
}

/* Responsive Design */
@media (max-width: 900px) {
    .movies-vertical-list {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .page-main-title {
        font-size: 2.5rem;
        letter-spacing: 2px;
    }

    .movies-vertical-list {
        grid-template-columns: 1fr;
        gap: 1rem;
    }

    .movie-item {
        height: auto;
        flex-direction: column;
    }

    .movie-poster-section {
        width: 100%;
    }

    .movie-poster {
        height: 250px;
        border-radius: 15px 15px 0 0;
    }

    .movie-details-section {
        padding: 1rem;
    }

    .movie-title {
        font-size: 1.1rem;
    }

    .info-item {
        font-size: 0.75rem;
    }

    .showtime-date {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }

    .showtime-date h4 {
        font-size: 0.9rem;
    }

    .showtime-btn {
        font-size: 0.75rem;
        padding: 0.35rem 0.7rem;
    }
}

@media (max-width: 480px) {
    .container {
        padding: 0 1rem;
    }

    .page-main-title {
        font-size: 2rem;
        letter-spacing: 1px;
    }

    .movie-details-section {
        padding: 1rem;
    }

    .movie-title {
        font-size: 1.3rem;
    }

    .info-row {
        flex-direction: column;
        gap: 0.5rem;
    }
}
</style>
