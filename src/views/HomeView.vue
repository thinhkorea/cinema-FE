<template>
    <div class="home-page">
        <AppHeader />

        <!-- PHIM - Movie Section -->
        <section class="movies-section">
            <div class="container-fluid">
                <!-- Movie Tabs -->
                <div class="tabs-wrapper">
                    <ul class="movie-tabs">
                        <li v-for="tab in movieTabs" :key="tab.key" class="tab-item">
                            <button
                                class="tab-button"
                                :class="{ active: activeTab === tab.key }"
                                @click="activeTab = tab.key"
                            >
                                {{ tab.name }}
                            </button>
                        </li>
                    </ul>
                </div>

                <!-- Movie Carousel -->
                <div class="carousel-wrapper">
                    <button class="nav-button prev" @click="prevMovie">←</button>

                    <div class="carousel-container">
                        <div class="movie-card movie-card-side" v-if="displayedMovies.length > 0">
                            <div class="movie-card-content">
                                <img
                                    :src="
                                        displayedMovies[
                                            (currentMovieIndex - 1 + displayedMovies.length) % displayedMovies.length
                                        ].posterUrl
                                    "
                                    :alt="
                                        displayedMovies[
                                            (currentMovieIndex - 1 + displayedMovies.length) % displayedMovies.length
                                        ].title
                                    "
                                />
                            </div>
                        </div>

                        <div class="movie-card movie-card-main" v-if="displayedMovies.length > 0">
                            <div
                                class="movie-card-wrapper"
                                @click="goDetail(displayedMovies[currentMovieIndex].movieId)"
                            >
                                <img
                                    :src="displayedMovies[currentMovieIndex].posterUrl"
                                    :alt="displayedMovies[currentMovieIndex].title"
                                />
                                <div class="movie-overlay"></div>
                                <div class="movie-info">
                                    <h2>{{ displayedMovies[currentMovieIndex].title }}</h2>
                                    <p class="movie-details">
                                        {{ displayedMovies[currentMovieIndex].duration }} phút •
                                        {{ displayedMovies[currentMovieIndex].genre }}
                                    </p>
                                    <button
                                        class="btn btn-warning mt-3"
                                        @click.stop="goDetail(displayedMovies[currentMovieIndex].movieId)"
                                    >
                                        Đặt vé ngay
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="movie-card movie-card-side" v-if="displayedMovies.length > 0">
                            <div class="movie-card-content">
                                <img
                                    :src="displayedMovies[(currentMovieIndex + 1) % displayedMovies.length].posterUrl"
                                    :alt="displayedMovies[(currentMovieIndex + 1) % displayedMovies.length].title"
                                />
                            </div>
                        </div>
                    </div>

                    <button class="nav-button next" @click="nextMovie">→</button>
                </div>

                <div v-if="loadingMovies" class="loading">
                    <div class="spinner"></div>
                </div>
            </div>
        </section>

        <!-- NEWS Section -->
        <section class="news-section">
            <div class="container">
                <div class="section-header">
                    <h2 class="section-title">📰 Tin nóng CGV</h2>
                    <a href="#" class="view-all">Xem tất cả →</a>
                </div>
                <div class="row g-4">
                    <div v-for="(news, index) in newsItems" :key="news.id" class="col-md-6 col-lg-4">
                        <div class="news-card" :style="{ animationDelay: `${index * 0.1}s` }">
                            <div class="news-image-wrapper">
                                <img :src="news.image" :alt="news.title" class="news-image" />
                                <div class="news-overlay">
                                    <span class="badge bg-warning text-dark">{{ news.category }}</span>
                                </div>
                            </div>
                            <div class="news-content">
                                <h3 class="news-title">{{ news.title }}</h3>
                                <p class="news-date">📅 {{ news.date }}</p>
                                <a href="#" class="read-more">Đọc thêm →</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- EGIFT Section -->
        <section class="egift-section">
            <div class="container">
                <div class="section-header">
                    <h2 class="section-title">🎁 Thẻ quà tặng CGV</h2>
                    <a href="#" class="view-all">Xem tất cả →</a>
                </div>
                <div class="row g-4">
                    <div v-for="(gift, index) in egifts" :key="gift.id" class="col-md-6 col-lg-4">
                        <div class="gift-card" :style="{ animationDelay: `${index * 0.1}s` }">
                            <div class="gift-icon-wrapper">
                                <span class="gift-icon">{{ gift.icon }}</span>
                            </div>
                            <h3 class="gift-name">{{ gift.name }}</h3>
                            <p class="gift-price">{{ gift.price }}</p>
                            <p class="gift-desc">{{ gift.desc }}</p>
                            <button class="btn btn-sm btn-outline-warning">Chi tiết</button>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- VIDEOS Section -->
        <section class="videos-section">
            <div class="container">
                <div class="section-header">
                    <h2 class="section-title">🎬 Trailer & Videos</h2>
                    <a href="#" class="view-all">Xem tất cả →</a>
                </div>
                <div class="row g-4">
                    <div v-for="(video, index) in videos" :key="video.id" class="col-md-6 col-lg-4">
                        <div class="video-card" :style="{ animationDelay: `${index * 0.1}s` }">
                            <div class="video-thumbnail-wrapper">
                                <img :src="video.thumbnail" :alt="video.title" class="video-thumbnail" />
                                <div class="play-icon-wrapper">
                                    <div class="play-icon">▶</div>
                                </div>
                                <div class="video-duration">{{ video.duration }}</div>
                            </div>
                            <p class="video-title">{{ video.title }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- OFFERS Section -->
        <section class="offers-section">
            <div class="container">
                <h2 class="section-title text-center mb-5">⭐ Ưu đãi đặc biệt</h2>
                <div class="row g-4">
                    <div v-for="(offer, index) in offers" :key="offer.id" class="col-md-6 col-lg-4">
                        <div class="offer-card" :style="{ animationDelay: `${index * 0.1}s` }">
                            <div class="offer-icon">{{ offer.icon }}</div>
                            <h3 class="offer-title">{{ offer.title }}</h3>
                            <p class="offer-desc">{{ offer.desc }}</p>
                            <button class="btn btn-sm btn-warning">Tìm hiểu</button>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- FOOTER -->
        <footer class="footer mt-5">
            <div class="container">
                <div class="row mb-4">
                    <div class="col-md-3 footer-column">
                        <h5>📍 Về CGV</h5>
                        <ul class="list-unstyled">
                            <li><a href="#">Giới thiệu</a></li>
                            <li><a href="#">Tin tức</a></li>
                            <li><a href="#">Liên hệ</a></li>
                        </ul>
                    </div>
                    <div class="col-md-3 footer-column">
                        <h5>❓ Hỗ trợ</h5>
                        <ul class="list-unstyled">
                            <li><a href="#">FAQ</a></li>
                            <li><a href="#">Điều khoản</a></li>
                            <li><a href="#">Chính sách bảo mật</a></li>
                        </ul>
                    </div>
                    <div class="col-md-3 footer-column">
                        <h5>🌐 Kết nối</h5>
                        <div class="social-links">
                            <a href="#" class="social-link">Facebook</a>
                            <a href="#" class="social-link">Instagram</a>
                            <a href="#" class="social-link">YouTube</a>
                        </div>
                    </div>
                    <div class="col-md-3 footer-column">
                        <h5>📞 Liên hệ</h5>
                        <p class="small">Cinema And Joy<br />Khu II, Đường 3/2<br />Cần Thơ</p>
                    </div>
                </div>
                <hr class="bg-secondary" />
                <div class="footer-bottom text-center">
                    <p class="small">© 2025 CAJ Vietnam. All rights reserved.</p>
                </div>
            </div>
        </footer>
    </div>
</template>

<script setup>
import AppHeader from "@/components/AppHeader.vue";
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";
import api from "@/api";

const router = useRouter();
const auth = useAuthStore();

const movieTabs = [
    { key: "now_showing", name: "Đang Chiếu" },
    { key: "coming_soon", name: "Sắp Chiếu" },
    { key: "special_release", name: "Đặc Biệt" },
];
const activeTab = ref("now_showing");
const movies = ref([]);
const loadingMovies = ref(false);
const currentMovieIndex = ref(0);
let autoPlayInterval = null;

const fetchMovies = async (status) => {
    loadingMovies.value = true;
    try {
        const response = await api.get(`/movies/status/${status}`);
        movies.value = response.data;
        currentMovieIndex.value = 0;
    } catch (error) {
        console.error(`Lỗi khi tải phim ${status}:`, error);
        movies.value = [];
    } finally {
        loadingMovies.value = false;
    }
};

const prevMovie = () => {
    if (displayedMovies.value.length > 0) {
        currentMovieIndex.value =
            (currentMovieIndex.value - 1 + displayedMovies.value.length) % displayedMovies.value.length;
    }
};

const nextMovie = () => {
    if (displayedMovies.value.length > 0) {
        currentMovieIndex.value = (currentMovieIndex.value + 1) % displayedMovies.value.length;
    }
};

const startAutoPlay = () => {
    if (autoPlayInterval) clearInterval(autoPlayInterval);
    autoPlayInterval = setInterval(() => {
        nextMovie();
    }, 5000);
};

const stopAutoPlay = () => {
    if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
    }
};

const displayedMovies = computed(() => movies.value);
const goDetail = (id) => router.push(`/movie/${id}`);

watch(
    activeTab,
    (newTab) => {
        fetchMovies(newTab.toUpperCase());
    },
    { immediate: true }
);

onMounted(() => {
    auth.restoreSession();
    startAutoPlay();
});

onUnmounted(() => {
    stopAutoPlay();
});

const newsItems = [
    {
        id: 1,
        title: "CGV ưu đãi Halloween cực khủng",
        image: "https://www.cgv.vn/media/wysiwyg/2025/102025/240x201_2_.jpg",
        date: "28/10/2025",
        category: "Khuyến mãi",
    },
    {
        id: 2,
        title: "Quà sinh nhật miễn phí trong tháng 11",
        image: "https://www.cgv.vn/media/wysiwyg/2025/102025/240x201.jpg",
        date: "3/11/2025",
        category: "Ưu đãi",
    },
    {
        id: 3,
        title: "Phim mới Đông 2025 - Cơn bão giải trí",
        image: "https://via.placeholder.com/400x300?text=Movie+News",
        date: "20/10/2025",
        category: "Phim mới",
    },
];

const egifts = [
    { id: 1, name: "PACONNIE 01", price: "99,000đ", icon: "🎁", desc: "Thẻ quà tặng cơ bản" },
    { id: 2, name: "CINE 04", price: "199,000đ", icon: "🎫", desc: "Gói vé ưu đãi" },
    { id: 3, name: "COMBO", price: "299,000đ", icon: "🍿", desc: "Gói combo đặc biệt" },
];

const videos = [
    {
        id: 1,
        title: "Zootopia 2 - Trailer Chính Thức",
        thumbnail: "https://www.youtube.com/watch?v=sGgjtYuuaFg",
        duration: "2:13",
    },
    {
        id: 2,
        title: "Sonic 4 - Phim Bom Tấn Năm 2025",
        thumbnail: "https://www.youtube.com/watch?v=xBIxYeUNxV8",
        duration: "1:52",
    },
    {
        id: 3,
        title: "Wicked - Vở nhạc kịch huyền thoại",
        thumbnail: "https://www.youtube.com/watch?v=6COmYeLsz4c",
        duration: "3:32",
    },
];

const offers = [
    { id: 1, icon: "💑", title: "Giảm 50% vé cặp đôi", desc: "Dành cho khách hàng đặt online" },
    { id: 2, icon: "🌅", title: "Ưu đãi suất chiếu sáng", desc: "Giá vé ưu đãi từ 9h-12h" },
    { id: 3, icon: "🎟️", title: "Ưu đãi thành viên CGV", desc: "Giảm 20% toàn bộ vé" },
];
</script>

<style scoped>
/* ============ GENERAL STYLES ============ */
.home-page {
    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
    color: #ffffff;
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

/* ============ MOVIES SECTION ============ */
.movies-section {
    background: #0a0a0a;
    padding: 4rem 0;
    position: relative;
    overflow: hidden;
}

.tabs-wrapper {
    display: flex;
    justify-content: center;
    margin-bottom: 3rem;
}

.movie-tabs {
    display: flex;
    gap: 2rem;
    list-style: none;
    padding: 0;
    margin: 0;
}

.tab-button {
    background: none;
    border: none;
    color: #888888;
    font-size: 1rem;
    font-weight: 600;
    padding: 0.75rem 1.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
    border-bottom: 3px solid transparent;
}

.tab-button:hover,
.tab-button.active {
    color: #ffd700;
    border-bottom-color: #ffd700;
}

.carousel-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.carousel-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
}

.movie-card {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.movie-card img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.movie-card-side {
    width: 220px;
    height: 330px;
    opacity: 0.5;
    transform: scale(0.85);
    filter: brightness(0.8);
    cursor: pointer;
}

.movie-card-side:hover {
    opacity: 0.7;
    transform: scale(0.9);
    filter: brightness(0.9);
}

.movie-card-main {
    width: 320px;
    height: 480px;
    z-index: 10;
    transform: scale(1);
    opacity: 1;
}

.movie-card-main:hover {
    box-shadow: 0 16px 40px rgba(255, 215, 0, 0.3);
    transform: scale(1.02);
}

.movie-card-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    cursor: pointer;
}

.movie-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.2));
    z-index: 2;
}

.movie-info {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 2rem 1.5rem;
    color: white;
    z-index: 3;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}

.movie-info h2 {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    line-height: 1.3;
}

.movie-details {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.8);
    margin: 0;
}

.nav-button {
    background: #ffd700;
    border: none;
    color: #000000;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    font-size: 1.25rem;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    flex-shrink: 0;
    align-self: center;
}

.nav-button:hover {
    background: #ffed4e;
    transform: scale(1.1);
}

.loading {
    display: flex;
    justify-content: center;
    padding: 2rem;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255, 204, 0, 0.2);
    border-top-color: #ffd700;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* ============ COMMON SECTION STYLES ============ */
.news-section,
.videos-section {
    background: #1a1a1a;
    padding: 4rem 2rem;
}

.egift-section,
.offers-section {
    background: #0f0f0f;
    padding: 4rem 2rem;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 3rem;
}

.section-title {
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0;
    color: #ffffff;
    letter-spacing: 0.5px;
}

.view-all {
    color: #ffd700;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s ease;
}

.view-all:hover {
    color: #ffed4e;
    transform: translateX(5px);
}

/* ============ NEWS SECTION ============ */
.news-card {
    background: #2a2a2a;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    transition: all 0.3s ease;
    cursor: pointer;
    animation: slideUp 0.6s ease forwards;
    opacity: 0;
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.news-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 28px rgba(255, 215, 0, 0.15);
    border: 1px solid rgba(255, 215, 0, 0.3);
}

.news-image-wrapper {
    position: relative;
    width: 100%;
    height: 220px;
    overflow: hidden;
}

.news-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}

.news-card:hover .news-image {
    transform: scale(1.1);
}

.news-overlay {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 5;
}

.news-content {
    padding: 1.5rem;
}

.news-title {
    font-size: 1rem;
    font-weight: 700;
    margin: 0 0 0.75rem 0;
    color: #ffffff;
    line-height: 1.4;
    transition: color 0.3s ease;
}

.news-card:hover .news-title {
    color: #ffd700;
}

.news-date {
    font-size: 0.875rem;
    color: #888888;
    margin: 0.5rem 0 1rem 0;
}

.read-more {
    color: #ffd700;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.9rem;
    transition: all 0.3s ease;
    display: inline-block;
}

.read-more:hover {
    color: #ffed4e;
    transform: translateX(3px);
}

/* ============ EGIFT SECTION ============ */
.gift-card {
    background: #2a2a2a;
    padding: 2.5rem 1.5rem;
    border-radius: 12px;
    text-align: center;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    animation: slideUp 0.6s ease forwards;
    opacity: 0;
    border: 2px solid transparent;
}

.gift-card:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 12px 28px rgba(255, 215, 0, 0.2);
    border: 2px solid rgba(255, 215, 0, 0.4);
    background: #333333;
}

.gift-icon-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 80px;
    height: 80px;
    background: rgba(255, 215, 0, 0.1);
    border-radius: 50%;
    margin: 0 auto 1.5rem;
    transition: all 0.3s ease;
}

.gift-card:hover .gift-icon-wrapper {
    background: rgba(255, 215, 0, 0.2);
    transform: scale(1.1) rotate(10deg);
}

.gift-icon {
    font-size: 2.5rem;
}

.gift-name {
    font-size: 1.1rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    color: #ffffff;
}

.gift-price {
    font-size: 1.25rem;
    color: #ffd700;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
}

.gift-desc {
    font-size: 0.85rem;
    color: #aaaaaa;
    margin: 0 0 1rem 0;
}

/* ============ VIDEOS SECTION ============ */
.video-card {
    cursor: pointer;
    animation: slideUp 0.6s ease forwards;
    opacity: 0;
}

.video-thumbnail-wrapper {
    position: relative;
    width: 100%;
    height: 220px;
    border-radius: 12px;
    overflow: hidden;
    background: rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;
}

.video-thumbnail {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}

.video-card:hover .video-thumbnail {
    transform: scale(1.08);
}

.play-icon-wrapper {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 3;
    transition: all 0.3s ease;
}

.play-icon {
    width: 60px;
    height: 60px;
    background: rgba(255, 215, 0, 0.8);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: #000;
    font-weight: bold;
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
}

.video-card:hover .play-icon {
    background: #ffd700;
    transform: scale(1.15);
    box-shadow: 0 6px 16px rgba(255, 215, 0, 0.5);
}

.video-duration {
    position: absolute;
    bottom: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.7);
    color: #fff;
    padding: 0.3rem 0.6rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
    z-index: 2;
}

.video-title {
    margin: 1rem 0 0 0;
    font-size: 0.95rem;
    font-weight: 600;
    color: #ffffff;
    line-height: 1.4;
    transition: color 0.3s ease;
}

.video-card:hover .video-title {
    color: #ffd700;
}

/* ============ OFFERS SECTION ============ */
.offer-card {
    background: #2a2a2a;
    padding: 2.5rem;
    border-radius: 12px;
    text-align: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    transition: all 0.3s ease;
    animation: slideUp 0.6s ease forwards;
    opacity: 0;
    position: relative;
    overflow: hidden;
}

.offer-card::before {
    content: "";
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255, 215, 0, 0.1) 0%, transparent 70%);
    transition: all 0.3s ease;
    z-index: 0;
}

.offer-card:hover {
    transform: translateY(-10px);
    box-shadow: 0 12px 32px rgba(255, 215, 0, 0.2);
    border: 1px solid rgba(255, 215, 0, 0.3);
}

.offer-card:hover::before {
    top: -30%;
    left: -30%;
}

.offer-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    display: block;
    transition: transform 0.3s ease;
    position: relative;
    z-index: 1;
}

.offer-card:hover .offer-icon {
    transform: scale(1.2) rotate(-10deg);
}

.offer-title {
    font-size: 1.1rem;
    font-weight: 700;
    margin: 0 0 0.75rem 0;
    color: #ffffff;
    position: relative;
    z-index: 1;
}

.offer-desc {
    font-size: 0.9rem;
    color: #aaaaaa;
    margin: 0 0 1.5rem 0;
    line-height: 1.5;
    position: relative;
    z-index: 1;
}

/* ============ FOOTER ============ */
.footer {
    background: #000000;
    color: #cccccc;
    padding: 3rem 0 1rem;
    border-top: 1px solid rgba(255, 215, 0, 0.1);
}

.footer-column h5 {
    color: #ffd700;
    font-weight: 700;
    margin-bottom: 1.5rem;
    font-size: 1rem;
}

.footer-column ul li {
    margin-bottom: 0.75rem;
}

.footer-column a {
    color: #cccccc;
    text-decoration: none;
    transition: color 0.3s ease;
    font-size: 0.9rem;
}

.footer-column a:hover {
    color: #ffd700;
    padding-left: 5px;
}

.social-links {
    display: flex;
    gap: 1rem;
}

.social-link {
    display: inline-block;
    padding: 0.5rem 0.75rem;
    background: rgba(255, 215, 0, 0.1);
    border-radius: 6px;
    transition: all 0.3s ease;
}

.social-link:hover {
    background: #ffd700;
    color: #000 !important;
    transform: translateY(-2px);
}

.footer-bottom {
    margin-top: 2rem;
    padding-top: 1.5rem;
}

/* ============ RESPONSIVE ============ */
@media (max-width: 768px) {
    .carousel-wrapper {
        flex-direction: column;
        gap: 2rem;
    }

    .carousel-container {
        flex-wrap: wrap;
    }

    .movie-card-side {
        display: none;
    }

    .section-title {
        font-size: 1.5rem;
    }

    .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }

    .nav-button {
        width: 40px;
        height: 40px;
        font-size: 1rem;
    }
}
</style>
