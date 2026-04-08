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
                                            {{ getFirstShowDate() }}
                                        </span>
                                        <span class="me-4">
                                            <i class="bi bi-clock me-2"></i>
                                            {{ movie.duration || "120" }} phút
                                        </span>
                                        <span class="me-4">
                                            <i class="bi bi-globe me-2"></i>
                                            {{ movie.language || "Tiếng Việt" }}
                                        </span>
                                        <span>
                                            <i class="bi bi-film me-2"></i>
                                            {{ getAgeRatingText(movie.ageRating) }}
                                        </span>
                                    </div>
                                    <!-- Description -->
                                    <p class="lead text-light mb-4 description-text">
                                        {{ movie.longDescription || movie.description || "Đang cập nhật nội dung..." }}
                                    </p>

                                    <!-- CTA Button -->
                                    <button @click="goBooking" class="btn btn-warning btn-lg fw-bold px-5">
                                        <i class="bi bi-ticket-perforated me-2"></i>Đặt vé ngay
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Details Section -->
            <div class="details-section py-5">
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
                                                allow="
                                                    accelerometer;
                                                    autoplay;
                                                    clipboard-write;
                                                    encrypted-media;
                                                    gyroscope;
                                                    picture-in-picture;
                                                "
                                                class="trailer-iframe"
                                            ></iframe>
                                        </div>
                                        <div
                                            v-else
                                            class="trailer-placeholder d-flex align-items-center justify-content-center"
                                        >
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
                                    {{ movie.longDescription || movie.description || "Đang cập nhật nội dung..." }}
                                </p>
                            </div>

                            <!-- Additional Info -->
                            <div class="mb-4">
                                <h2 class="h3 fw-bold text-white mb-4">Thông tin chi tiết</h2>
                                <div class="info-table">
                                    <div class="info-row">
                                        <span class="info-label">Thể loại</span>
                                        <span class="info-value">{{ movie.genre || "Đang cập nhật" }}</span>
                                    </div>
                                    <div class="info-row">
                                        <span class="info-label">Diễn viên</span>
                                        <span class="info-value">{{ movie.actors || "Đang cập nhật" }}</span>
                                    </div>
                                    <div class="info-row">
                                        <span class="info-label">Ngôn ngữ</span>
                                        <span class="info-value">{{ movie.language || "Tiếng Việt" }}</span>
                                    </div>
                                    <div class="info-row">
                                        <span class="info-label">Kiểm duyệt</span>
                                        <span class="info-value text-warning fw-bold">{{
                                            getAgeRatingText(movie.ageRating)
                                        }}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="mb-4 review-section">
                                <h2 class="h3 fw-bold text-white mb-4">Đánh giá phim</h2>

                                <div class="review-summary mb-4">
                                    <div class="summary-score">
                                        <span class="score-number">{{ reviewSummary.averageRating.toFixed(1) }}</span>
                                        <span class="score-max">/5</span>
                                    </div>
                                    <div>
                                        <div class="summary-stars">
                                            {{ renderStars(Math.round(reviewSummary.averageRating || 0)) }}
                                        </div>
                                        <div class="summary-count">{{ reviewSummary.reviewCount }} lượt đánh giá</div>
                                    </div>
                                </div>

                                <div class="review-form mb-4" v-if="auth.isAuthenticated && !hasCurrentUserReviewed()">
                                    <h3 class="h5 text-white mb-3">Viết đánh giá của bạn</h3>
                                    <div class="star-picker mb-3">
                                        <button
                                            v-for="star in 5"
                                            :key="star"
                                            type="button"
                                            class="star-btn"
                                            :class="{ active: star <= reviewForm.rating }"
                                            @click="reviewForm.rating = star"
                                        >
                                            ★
                                        </button>
                                        <span class="ms-2 text-light">{{ reviewForm.rating }}/5</span>
                                    </div>
                                    <textarea
                                        v-model="reviewForm.comment"
                                        class="form-control review-input"
                                        rows="4"
                                        maxlength="1000"
                                        placeholder="Chia sẻ cảm nhận của bạn về bộ phim này..."
                                    ></textarea>
                                    <div class="d-flex justify-content-between align-items-center mt-2">
                                        <small class="text-secondary">{{ reviewForm.comment.length }}/1000 ký tự</small>
                                        <button
                                            class="btn btn-warning fw-bold"
                                            :disabled="submittingReview"
                                            @click="submitReview"
                                        >
                                            {{ submittingReview ? "Đang gửi..." : "Gửi đánh giá" }}
                                        </button>
                                    </div>
                                </div>

                                <div
                                    class="review-login-note mb-4"
                                    v-else-if="auth.isAuthenticated && hasCurrentUserReviewed()"
                                >
                                    <p class="mb-0">
                                        Bạn đã gửi đánh giá cho phim này. Mỗi tài khoản chỉ được đánh giá 1 lần.
                                    </p>
                                </div>

                                <div class="review-login-note mb-4" v-else>
                                    <p class="mb-0">
                                        Bạn cần đăng nhập để gửi đánh giá.
                                        <router-link to="/login" class="login-link">Đăng nhập ngay</router-link>
                                    </p>
                                </div>

                                <div v-if="reviews.length === 0" class="empty-reviews">
                                    Chưa có đánh giá nào cho phim này.
                                </div>

                                <div v-else class="review-list">
                                    <div v-for="r in reviews" :key="r.reviewId" class="review-item">
                                        <div class="d-flex justify-content-between align-items-start gap-3 mb-2">
                                            <div>
                                                <p class="review-author mb-1">{{ r.fullName || r.username }}</p>
                                                <div class="review-stars">{{ renderStars(r.rating) }}</div>
                                            </div>
                                            <small class="review-time">{{ formatReviewTime(r.createdAt) }}</small>
                                        </div>
                                        <p class="review-comment mb-0">{{ r.comment || "(Không có bình luận)" }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Sidebar - Movie Poster -->
                        <div class="col-lg-4">
                            <div class="poster-sticky">
                                <!-- Updated card styling to match trailer section aesthetic -->
                                <div class="card bg-white border-0 rounded-2 overflow-hidden mb-4">
                                    <div class="poster-card-wrapper">
                                        <img
                                            :src="movie.posterUrl || '/placeholder.svg?height=600&width=400'"
                                            :alt="movie.title"
                                            class="card-img-top poster-image"
                                        />
                                    </div>
                                </div>
                                <!-- Styled button to match trailer section -->
                                <button @click="goBooking" class="btn btn-warning w-100 fw-bold py-3 rounded-2">
                                    <i class="bi bi-ticket-perforated me-2"></i>Đặt vé
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <AppFooter />
    </div>
</template>

<script setup>
import AppHeader from "@/components/AppHeader.vue";
import AppFooter from "@/components/AppFooter.vue";
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "@/api";
import { useAuthStore } from "@/stores/auth.store";
import Swal from "sweetalert2";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const movie = ref(null);
const showtimes = ref([]);
const reviews = ref([]);
const reviewSummary = ref({ averageRating: 0, reviewCount: 0 });
const submittingReview = ref(false);
const reviewForm = ref({ rating: 5, comment: "" });

const showAlert = ({ icon = "info", title = "Thông báo", text = "", toast = false }) => {
    return Swal.fire({
        icon,
        title,
        text,
        toast,
        position: toast ? "top-end" : "center",
        timer: toast ? 1800 : undefined,
        showConfirmButton: !toast,
        timerProgressBar: toast,
        background: "#ffffff",
        color: "#333333",
        confirmButtonColor: "#ff6b35",
        customClass: {
            popup: "movie-alert-popup",
            confirmButton: "movie-alert-btn",
            title: "movie-alert-title",
            htmlContainer: "movie-alert-text",
        },
    });
};

// Ensure all hooks are called at the top level
onMounted(async () => {
    try {
        const movieId = route.params.id;

        // Load movie details and showtimes in parallel
        const [movieRes, showtimesRes] = await Promise.all([
            api.get(`/movies/${movieId}`),
            api.get(`/showtimes/movie/${movieId}`),
        ]);

        movie.value = movieRes.data;
        showtimes.value = showtimesRes.data;
        await fetchReviews(movieId);
    } catch (err) {
        console.error("Lỗi khi tải phim:", err);
        router.push("/");
    }
});

const fetchReviews = async (movieId) => {
    try {
        const { data } = await api.get(`/movies/${movieId}/reviews`);
        reviews.value = data.reviews || [];
        reviewSummary.value = data.summary || { averageRating: 0, reviewCount: 0 };
    } catch (err) {
        console.error("Lỗi tải review:", err);
        reviews.value = [];
        reviewSummary.value = { averageRating: 0, reviewCount: 0 };
    }
};

const submitReview = async () => {
    const movieId = route.params.id;

    if (hasCurrentUserReviewed()) {
        await showAlert({
            icon: "info",
            title: "Đã đánh giá",
            text: "Mỗi tài khoản chỉ được đánh giá phim 1 lần.",
        });
        return;
    }

    if (!auth.isAuthenticated) {
        await showAlert({
            icon: "warning",
            title: "Cần đăng nhập",
            text: "Bạn cần đăng nhập để gửi đánh giá.",
        });
        router.push("/login");
        return;
    }

    try {
        submittingReview.value = true;
        await api.post(`/movies/${movieId}/reviews`, {
            rating: reviewForm.value.rating,
            comment: reviewForm.value.comment,
        });
        reviewForm.value.comment = "";
        await fetchReviews(movieId);
        await showAlert({
            icon: "success",
            title: "Đã gửi đánh giá",
            text: "Cảm ơn bạn đã chia sẻ cảm nhận về bộ phim!",
            toast: true,
        });
    } catch (err) {
        console.error("Lỗi gửi review:", err);
        const errorMessage = err.response?.data?.error || "Không thể gửi đánh giá.";

        // Kiểm tra loại lỗi để hiển thị icon phù hợp
        const isValidationError =
            errorMessage.includes("sau khi suất chiếu") || errorMessage.includes("mua và thanh toán vé");

        await showAlert({
            icon: isValidationError ? "info" : "error",
            title: isValidationError ? "Chưa đủ điều kiện" : "Gửi đánh giá thất bại",
            text: errorMessage,
        });
    } finally {
        submittingReview.value = false;
    }
};

const hasCurrentUserReviewed = () => {
    if (!auth.isAuthenticated || !auth.username) return false;
    return reviews.value.some((r) => r.username === auth.username);
};

const goBooking = () => {
    const id = movie.value?.movieId || movie.value?.id;
    if (id) {
        router.push(`/booking/${id}`);
    } else {
        showAlert({
            icon: "error",
            title: "Không thể đặt vé",
            text: "Không tìm thấy thông tin phim để đặt vé.",
        });
    }
};

const getTrailerUrl = (trailerUrl) => {
    // If URL is already an embed URL, return it as-is
    if (trailerUrl.includes("embed") || trailerUrl.includes("youtube.com/embed")) {
        return trailerUrl;
    }
    // If it's a YouTube watch URL, convert to embed URL
    if (trailerUrl.includes("youtube.com/watch")) {
        const videoId = trailerUrl.split("v=")[1];
        return `https://www.youtube.com/embed/${videoId}`;
    }
    // If it's a youtu.be short URL, convert to embed URL
    if (trailerUrl.includes("youtu.be")) {
        const videoId = trailerUrl.split("youtu.be/")[1];
        return `https://www.youtube.com/embed/${videoId}`;
    }
    // Return as-is if format is not recognized
    return trailerUrl;
};

const getStatusText = (status) => {
    const statusMap = {
        NOW_SHOWING: "Đang chiếu",
        COMING_SOON: "Sắp chiếu",
        SPECIAL_RELEASE: "Suất đặc biệt",
        ENDED: "Đã ngừng chiếu",
    };
    return statusMap[status] || "Đang cập nhật";
};

const getAgeRatingText = (ageRating) => {
    const ratingMap = {
        P: "Phổ thông",
        C13: "T13+",
        C16: "T16+",
        C18: "T18+",
    };
    return ratingMap[ageRating] || "T16+";
};

const getFirstShowDate = () => {
    if (!showtimes.value || showtimes.value.length === 0) {
        return "Đang cập nhật";
    }

    // Find the earliest showtime
    const sortedShowtimes = showtimes.value
        .filter((showtime) => new Date(showtime.startTime) > new Date()) // Only future showtimes
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    if (sortedShowtimes.length === 0) {
        return "Đã kết thúc";
    }

    const firstShowtime = sortedShowtimes[0];
    const date = new Date(firstShowtime.startTime);

    // Format date to Vietnamese format
    return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

const renderStars = (rating) => {
    const safe = Math.max(0, Math.min(5, Number(rating) || 0));
    return "★".repeat(safe) + "☆".repeat(5 - safe);
};

const formatReviewTime = (value) => {
    if (!value) return "";
    return new Date(value).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};
</script>

<style scoped>
/* --- Loading --- */
.loading-container {
    min-height: 100vh;
    background: #f5f5f5;
}

.spinner-border {
    width: 50px;
    height: 50px;
}

/* --- Hero Banner --- */
.hero-banner-wrapper {
    max-width: 1200px;
    margin: 1rem auto 0;
    width: 100%;
}

.hero-banner {
    position: relative;
    height: 60vh;
    width: 100%;
    overflow: hidden;
    background-color: #1a1a1a;
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
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
    color: #ff8a5f;
}

.description-text {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.6;
}

/* --- Unified Section Background --- */
.details-section {
    background: #f5f5f5;
    border-top: 1px solid #e8e8e8;
    color: #333;
    margin-top: 1.5rem;
}

.details-section :deep(.text-white),
.details-section :deep(.text-light) {
    color: #333 !important;
}

.details-section :deep(.text-secondary) {
    color: #666 !important;
}

/* --- Trailer + Poster unified look --- */
.trailer-container,
.poster-card-wrapper {
    border-radius: 10px;
    overflow: hidden;
    background: #fff;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    border: 1px solid #e5e5e5;
    transition:
        transform 0.3s ease,
        box-shadow 0.3s ease;
}

.trailer-container:hover,
.poster-card-wrapper:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 22px rgba(255, 107, 53, 0.2);
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
    background: #fff;
    border: 1px solid #e4e4e4;
    border-radius: 8px;
}

.info-row {
    display: flex;
    justify-content: space-between;
    padding: 15px 20px;
    border-bottom: 1px solid #ececec;
}

.info-row:last-child {
    border-bottom: none;
}

.info-label {
    color: #666;
    font-weight: 500;
}

.info-value {
    color: #333;
    font-weight: 600;
}

/* --- Button --- */
.btn-warning {
    background-color: #ff6b35;
    border-color: #ff6b35;
    color: #fff;
    border-radius: 10px;
    transition: all 0.3s ease;
}

.btn-warning:hover {
    background-color: #ff5722;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.25);
}

.review-section {
    margin-top: 48px;
}

.review-summary {
    display: flex;
    align-items: center;
    gap: 20px;
    background: #fff;
    border: 1px solid #e6e6e6;
    border-radius: 10px;
    padding: 16px 20px;
}

.summary-score {
    color: #ff6b35;
    font-weight: 800;
    min-width: 92px;
}

.score-number {
    font-size: 34px;
    line-height: 1;
}

.score-max {
    font-size: 16px;
    color: #888;
}

.summary-stars {
    color: #ff6b35;
    letter-spacing: 1px;
}

.summary-count {
    color: #666;
    font-size: 14px;
}

.review-form {
    background: #fff;
    border: 1px solid #e5e5e5;
    border-radius: 10px;
    padding: 16px;
}

.star-picker {
    display: flex;
    align-items: center;
}

.star-btn {
    border: none;
    background: transparent;
    color: #b7b7b7;
    font-size: 26px;
    line-height: 1;
    padding: 0 4px;
}

.star-btn.active {
    color: #ff6b35;
}

.review-input {
    background: #fff;
    border: 1px solid #d7d7d7;
    color: #333;
}

.review-input:focus {
    background: #fff;
    border-color: #ff6b35;
    color: #333;
    box-shadow: 0 0 0 0.2rem rgba(255, 107, 53, 0.15);
}

.review-input::placeholder {
    color: #9ba3af;
    opacity: 1;
}

.review-login-note,
.empty-reviews {
    background: #fff;
    border: 1px dashed #d8d8d8;
    border-radius: 10px;
    color: #666;
    padding: 14px 16px;
}

.login-link {
    color: #ff6b35;
    text-decoration: none;
    font-weight: 600;
}

.review-list {
    display: grid;
    gap: 12px;
}

.review-item {
    background: #fff;
    border: 1px solid #e5e5e5;
    border-radius: 10px;
    padding: 14px 16px;
}

.review-author {
    color: #333;
    font-weight: 700;
}

.review-stars {
    color: #ff6b35;
    letter-spacing: 1px;
}

.review-time {
    color: #888;
}

.review-comment {
    color: #4f4f4f;
    line-height: 1.6;
    white-space: pre-wrap;
}

:deep(.movie-alert-popup) {
    border: 1px solid #e6e6e6;
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.16);
}

:deep(.movie-alert-title) {
    color: #333333;
    font-weight: 700;
}

:deep(.movie-alert-text) {
    color: #555555;
}

:deep(.movie-alert-btn) {
    color: #ffffff !important;
    font-weight: 700 !important;
    border: none !important;
    box-shadow: none !important;
}

:deep(.swal2-timer-progress-bar) {
    background: #ff6b35 !important;
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
    background-color: #f5f5f5;
    color: #333;
    min-height: 100vh;
    width: 100vw;
    margin: 0;
    overflow-x: hidden;
}
</style>
