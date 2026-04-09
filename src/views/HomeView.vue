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
                        <div class="movie-card movie-card-side" v-if="prevMovieItem" :key="`prev-${prevMovieItem.movieId}-${currentMovieIndex}`">
                            <div class="movie-card-content">
                                <img
                                    :src="prevMovieItem.posterUrl"
                                    :alt="prevMovieItem.title"
                                />
                            </div>
                        </div>

                        <div class="movie-card movie-card-main" v-if="currentMovie" :key="`main-${currentMovie.movieId}-${currentMovieIndex}`">
                            <div
                                class="movie-card-wrapper"
                                @click="goDetail(currentMovie.movieId)"
                            >
                                <img
                                    :src="currentMovie.posterUrl"
                                    :alt="currentMovie.title"
                                />
                                <div class="movie-overlay"></div>
                                <div class="movie-info">
                                    <h2>{{ currentMovie.title }}</h2>
                                    <p class="movie-details">
                                        {{ currentMovie.duration }} phút •
                                        {{ currentMovie.genre }}
                                    </p>
                                    <button
                                        class="btn book-now-btn mt-3"
                                        @click.stop="goDetail(currentMovie.movieId)"
                                    >
                                        Đặt vé ngay
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="movie-card movie-card-side" v-if="nextMovieItem" :key="`next-${nextMovieItem.movieId}-${currentMovieIndex}`">
                            <div class="movie-card-content">
                                <img
                                    :src="nextMovieItem.posterUrl"
                                    :alt="nextMovieItem.title"
                                />
                            </div>
                        </div>
                    </div>

                    <button class="nav-button next" @click="nextMovie()">→</button>
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
                    <h2 class="section-title">Tin nóng CGV</h2>
                    <a href="#" class="view-all">Xem tất cả →</a>
                </div>
                <div class="row g-4">
                    <div v-for="(news, index) in newsItems" :key="news.id" class="col-md-6 col-lg-4">
                        <div
                            class="news-card"
                            :style="{ animationDelay: `${index * 0.1}s` }"
                            @click="openNewsDetail(news)"
                        >
                            <div class="news-image-wrapper">
                                <img :src="news.image" :alt="news.title" class="news-image" />
                                <div class="news-overlay">
                                    <span class="badge bg-warning text-dark">{{ news.category }}</span>
                                </div>
                            </div>
                            <div class="news-content">
                                <h3 class="news-title">{{ news.title }}</h3>
                                <p class="news-date">{{ news.date }}</p>
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
                    <h2 class="section-title">Thẻ quà tặng CGV</h2>
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
                    <h2 class="section-title">Trailer & Videos</h2>
                    <a href="#" class="view-all">Xem tất cả →</a>
                </div>
                <div class="row g-4">
                    <div v-for="(video, index) in videos" :key="video.id" class="col-md-6 col-lg-4">
                        <div
                            class="video-card"
                            :style="{ animationDelay: `${index * 0.1}s` }"
                            @click="openVideo(video.url)"
                        >
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
                <h2 class="section-title text-center mb-5">Ưu đãi đặc biệt</h2>
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
        <AppFooter />

        <!-- Video Modal -->
        <div v-if="showVideoModal" class="video-modal" @click="closeVideoModal">
            <div class="video-modal-content" @click.stop>
                <button class="video-modal-close" @click="closeVideoModal">×</button>
                <div class="video-wrapper">
                    <iframe
                        :src="currentVideoEmbed"
                        frameborder="0"
                        allowfullscreen
                        allow="autoplay; encrypted-media"
                    ></iframe>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import AppHeader from "@/components/AppHeader.vue";
import AppFooter from "@/components/AppFooter.vue";
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
const AUTO_PLAY_DELAY = 5000;
const MANUAL_NAVIGATION_COOLDOWN = 1200;
let autoPlayTimeout = null;
let lastManualNavigationAt = 0;

const fetchMovies = async (status) => {
    loadingMovies.value = true;
    try {
        const response = await api.get(`/movies/status/${status}`);
        // Loại bản ghi trùng movieId để tránh lệch nội dung khi carousel auto-play.
        movies.value = Array.from(new Map((response.data || []).map((movie) => [movie.movieId, movie])).values());
        currentMovieIndex.value = 0;
        startAutoPlay();
    } catch (error) {
        console.error(`Lỗi khi tải phim ${status}:`, error);
        movies.value = [];
        stopAutoPlay();
    } finally {
        loadingMovies.value = false;
    }
};

const prevMovie = () => {
    if (displayedMovies.value.length > 0) {
        currentMovieIndex.value =
            (currentMovieIndex.value - 1 + displayedMovies.value.length) % displayedMovies.value.length;
        lastManualNavigationAt = Date.now();
        resetAutoPlay();
    }
};

const nextMovie = (trigger = "manual") => {
    if (displayedMovies.value.length > 0) {
        if (trigger === "auto" && Date.now() - lastManualNavigationAt < MANUAL_NAVIGATION_COOLDOWN) {
            scheduleNextAutoPlay();
            return;
        }
        currentMovieIndex.value = (currentMovieIndex.value + 1) % displayedMovies.value.length;

        if (trigger === "manual") {
            lastManualNavigationAt = Date.now();
            resetAutoPlay();
        } else {
            scheduleNextAutoPlay();
        }
    }
};

const startAutoPlay = () => {
    stopAutoPlay();
    scheduleNextAutoPlay();
};

const scheduleNextAutoPlay = () => {
    autoPlayTimeout = setTimeout(() => {
        nextMovie("auto");
    }, AUTO_PLAY_DELAY);
};

const resetAutoPlay = () => {
    if (!displayedMovies.value.length) return;
    startAutoPlay();
};

const stopAutoPlay = () => {
    if (autoPlayTimeout) {
        clearTimeout(autoPlayTimeout);
        autoPlayTimeout = null;
    }
};

const displayedMovies = computed(() => movies.value);
const currentMovie = computed(() => displayedMovies.value[currentMovieIndex.value] || null);
const prevMovieItem = computed(() => {
    if (!displayedMovies.value.length) return null;
    return displayedMovies.value[(currentMovieIndex.value - 1 + displayedMovies.value.length) % displayedMovies.value.length];
});
const nextMovieItem = computed(() => {
    if (!displayedMovies.value.length) return null;
    return displayedMovies.value[(currentMovieIndex.value + 1) % displayedMovies.value.length];
});
const goDetail = (id) => router.push(`/movie/${id}`);

watch(
    activeTab,
    (newTab) => {
        fetchMovies(newTab.toUpperCase());
    },
    { immediate: true },
);

onMounted(() => {
    auth.restoreSession();
});

onUnmounted(() => {
    stopAutoPlay();
});

const newsItems = [
    {
        id: 1,
        title: "CAJ ưu đãi Halloween cực khủng",
        image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
        date: "28/10/2025",
        category: "Khuyến mãi",
    },
    {
        id: 2,
        title: "Quà sinh nhật miễn phí trong tháng 11",
        image: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        date: "3/11/2025",
        category: "Ưu đãi",
    },
    {
        id: 3,
        title: "Phim mới Đông 2025 - Cơn bão giải trí",
        image: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
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
        thumbnail: "https://img.youtube.com/vi/sGgjtYuuaFg/maxresdefault.jpg",
        url: "https://www.youtube.com/watch?v=sGgjtYuuaFg",
        duration: "2:13",
    },
    {
        id: 2,
        title: "Sonic 4 - Phim Bom Tấn Năm 2025",
        thumbnail: "https://img.youtube.com/vi/xBIxYeUNxV8/maxresdefault.jpg",
        url: "https://www.youtube.com/watch?v=xBIxYeUNxV8",
        duration: "1:52",
    },
    {
        id: 3,
        title: "Wicked - Vở nhạc kịch huyền thoại",
        thumbnail: "https://img.youtube.com/vi/6COmYeLsz4c/maxresdefault.jpg",
        url: "https://www.youtube.com/watch?v=6COmYeLsz4c",
        duration: "3:32",
    },
];

const showVideoModal = ref(false);
const currentVideoEmbed = ref("");

const openVideo = (url) => {
    // Convert YouTube URL to embed URL
    const videoId = url.split("v=")[1];
    currentVideoEmbed.value = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    showVideoModal.value = true;
};

const closeVideoModal = () => {
    showVideoModal.value = false;
    currentVideoEmbed.value = "";
};

const openNewsDetail = (news) => {
    // Tạm thời hiển thị thông báo, có thể chuyển đến trang chi tiết sau
    alert(`Đang xem: ${news.title}\n\nNội dung: ${news.category} - ${news.date}`);
    // router.push(`/news/${news.id}`); // Chức năng trang chi tiết sau này
};

const offers = [
    { id: 1, icon: "💑", title: "Giảm 50% vé cặp đôi", desc: "Dành cho khách hàng đặt online" },
    { id: 2, icon: "🌅", title: "Ưu đãi suất chiếu sáng", desc: "Giá vé ưu đãi từ 9h-12h" },
    { id: 3, icon: "🎟️", title: "Ưu đãi thành viên CGV", desc: "Giảm 20% toàn bộ vé" },
];
</script>

<style scoped>
/* ============ GENERAL STYLES ============ */
.home-page {
    background: #f5f5f5;
    color: #333333;
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

/* ============ MOVIES SECTION ============ */
.movies-section {
    background: linear-gradient(180deg, #ffffff 0%, #fff8f4 100%);
    padding: 1.5rem 0 2rem;
    position: relative;
    overflow: hidden;
    border-bottom: 1px solid #ebebeb;
}

.movies-section .container-fluid {
    max-width: 1400px;
    margin: 0 auto;
    padding: 1rem 1.25rem 1.25rem;
    border-radius: 20px;
    background: transparent;
    border: none;
    box-shadow: 0 8px 22px rgba(255, 107, 53, 0.14);
}

.tabs-wrapper {
    display: flex;
    justify-content: center;
    margin-bottom: 1.25rem;
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
    color: #777777;
    font-size: 1rem;
    font-weight: 600;
    padding: 0.75rem 1.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
    border-bottom: 3px solid transparent;
}

.tab-button:hover,
.tab-button.active {
    color: #ff6b35;
    border-bottom-color: #ff6b35;
}

.carousel-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 0;
    padding: 1rem;
    border-radius: 16px;
    background: #fff6f1;
    border: 1px solid #f3ddd4;
}

.carousel-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.8rem;
}

.movie-card {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    background: #ffffff;
    flex: 0 0 auto;
}

.movie-card img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.movie-card-content {
    width: 100%;
    height: 100%;
}

.movie-card-side {
    width: 224px;
    aspect-ratio: 2 / 3;
    opacity: 0.65;
    transform: scale(0.85);
    filter: brightness(0.95);
    cursor: pointer;
    border: 1px solid #ddd;
}

.movie-card-side:hover {
    opacity: 0.8;
    transform: scale(0.9);
    filter: brightness(1);
}

.movie-card-main {
    width: 332px;
    aspect-ratio: 2 / 3;
    z-index: 10;
    transform: scale(1);
    opacity: 1;
    border: 1px solid rgba(255, 255, 255, 0.6);
}

.movie-card-main:hover {
    box-shadow: 0 16px 40px rgba(255, 107, 53, 0.28);
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
    background: linear-gradient(to top, rgba(0, 0, 0, 0.72) 8%, rgba(0, 0, 0, 0.14) 58%, rgba(0, 0, 0, 0.04) 100%);
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
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.7);
}

.movie-info h2 {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    line-height: 1.3;
    color: #ffffff;
}

.movie-details {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.92);
    margin: 0;
}

.book-now-btn {
    background: var(--brand);
    border: 1px solid var(--brand);
    color: #ffffff;
    font-weight: 600;
}

.book-now-btn:hover {
    background: var(--brand-strong);
    border-color: var(--brand-strong);
    color: #ffffff;
}

.nav-button {
    background: #ff6b35;
    border: none;
    color: #ffffff;
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
    background: #ff5722;
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
    border: 4px solid rgba(255, 107, 53, 0.18);
    border-top-color: #ff6b35;
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
    background: #fff8f4;
    padding: 4rem 2rem;
    border-top: 1px solid #ececec;
}

.videos-section .container {
    background: #ffffff;
    border: 1px solid #eee4df;
    border-radius: 18px;
    padding: 2rem;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.07);
}

.egift-section,
.offers-section {
    background: #fff8f4;
    padding: 4rem 2rem;
    border-top: 1px solid #f3e3dc;
}

.egift-section .section-title {
    color: #2f2f2f;
}

.egift-section .view-all {
    color: #ff6b35;
}

.egift-section .view-all:hover {
    color: #ff5722;
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
    color: #2f2f2f;
    letter-spacing: 0.5px;
}

.view-all {
    color: #ff6b35;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s ease;
}

.view-all:hover {
    color: #ff5722;
    transform: translateX(5px);
}

/* ============ NEWS SECTION ============ */
.news-card {
    background: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    cursor: pointer;
    animation: slideUp 0.6s ease forwards;
    opacity: 0;
    border: 1px solid #e6e6e6;
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
    box-shadow: 0 12px 28px rgba(255, 107, 53, 0.15);
    border: 1px solid #ffcab8;
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
    color: #333333;
    line-height: 1.4;
    transition: color 0.3s ease;
}

.news-card:hover .news-title {
    color: #ff6b35;
}

.news-date {
    font-size: 0.875rem;
    color: #777777;
    margin: 0.5rem 0 1rem 0;
}

.read-more {
    color: #ff6b35;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.9rem;
    transition: all 0.3s ease;
    display: inline-block;
}

.read-more:hover {
    color: #ff5722;
    transform: translateX(3px);
}

/* ============ EGIFT SECTION ============ */
.gift-card {
    background: #ffffff;
    padding: 2.5rem 1.5rem;
    border-radius: 12px;
    text-align: center;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    animation: slideUp 0.6s ease forwards;
    opacity: 0;
    border: 1px solid #ecd8cf;
}

.gift-card:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 12px 28px rgba(255, 107, 53, 0.2);
    border: 1px solid #ffbea9;
    background: #fff;
}

.gift-icon-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 80px;
    height: 80px;
    background: rgba(255, 107, 53, 0.12);
    border-radius: 50%;
    margin: 0 auto 1.5rem;
    transition: all 0.3s ease;
}

.gift-card:hover .gift-icon-wrapper {
    background: rgba(255, 107, 53, 0.18);
    transform: scale(1.1) rotate(10deg);
}

.gift-icon {
    font-size: 2.5rem;
}

.gift-name {
    font-size: 1.1rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    color: #333333;
}

.gift-price {
    font-size: 1.25rem;
    color: #ff6b35;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
}

.gift-desc {
    font-size: 0.85rem;
    color: #666666;
    margin: 0 0 1rem 0;
}

.gift-card .btn-outline-warning {
    border-color: #ff6b35;
    color: #ff6b35;
}

.gift-card .btn-outline-warning:hover {
    background: #ff6b35;
    border-color: #ff6b35;
    color: #fff;
}

/* ============ VIDEOS SECTION ============ */
.video-card {
    cursor: pointer;
    animation: slideUp 0.6s ease forwards;
    opacity: 0;
    background: #ffffff;
    border: 1px solid #e9e1dc;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.07);
    transition:
        transform 0.25s ease,
        box-shadow 0.25s ease;
}

.video-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 26px rgba(255, 107, 53, 0.16);
}

.video-thumbnail-wrapper {
    position: relative;
    width: 100%;
    height: 220px;
    border-radius: 12px;
    overflow: hidden;
    background: #f3f3f3;
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
    background: rgba(255, 107, 53, 0.9);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: #fff;
    font-weight: bold;
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
}

.video-card:hover .play-icon {
    background: #ff5722;
    transform: scale(1.15);
    box-shadow: 0 6px 16px rgba(255, 107, 53, 0.4);
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
    margin: 0;
    padding: 0.85rem 1rem 1rem;
    font-size: 0.95rem;
    font-weight: 600;
    color: #2f2f2f;
    line-height: 1.4;
    transition: color 0.3s ease;
}

.video-card:hover .video-title {
    color: #ff6b35;
}

/* ============ OFFERS SECTION ============ */
.offer-card {
    background: #ffffff;
    padding: 2.5rem;
    border-radius: 12px;
    text-align: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    animation: slideUp 0.6s ease forwards;
    opacity: 0;
    position: relative;
    overflow: hidden;
    border: 1px solid #eadad3;
}

.offer-card::before {
    content: "";
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255, 107, 53, 0.12) 0%, transparent 70%);
    transition: all 0.3s ease;
    z-index: 0;
}

.offer-card:hover {
    transform: translateY(-10px);
    box-shadow: 0 12px 32px rgba(255, 107, 53, 0.2);
    border: 1px solid #ffcab8;
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
    color: #333333;
    position: relative;
    z-index: 1;
}

.offer-desc {
    font-size: 0.9rem;
    color: #666666;
    margin: 0 0 1.5rem 0;
    line-height: 1.5;
    position: relative;
    z-index: 1;
}

/* ============ VIDEO MODAL ============ */
.video-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

.video-modal-content {
    position: relative;
    width: 90%;
    max-width: 800px;
    background: #1a1a1a;
    border-radius: 12px;
    overflow: hidden;
    animation: slideIn 0.3s ease;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(-50px) scale(0.9);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.video-modal-close {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 35px;
    height: 35px;
    background: rgba(0, 0, 0, 0.8);
    border: 2px solid #ffd700;
    border-radius: 50%;
    font-size: 18px;
    font-weight: bold;
    color: #ffd700;
    cursor: pointer;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
}

.video-modal-close:hover {
    background: #ffd700;
    color: #000;
    transform: scale(1.1);
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.video-wrapper {
    position: relative;
    width: 100%;
    height: 0;
    padding-bottom: 56.25%; /* 16:9 aspect ratio */
}

.video-wrapper iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
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

    .movies-section .container-fluid {
        padding: 1rem;
        border-radius: 14px;
    }

    .carousel-wrapper {
        padding: 1rem;
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

    .videos-section .container {
        padding: 1.1rem;
        border-radius: 14px;
    }
}
</style>
