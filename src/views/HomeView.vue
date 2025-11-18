<template>
    <div class="home-page bg-light">
        <AppHeader />

        <!-- PHIM -->
        <section class="movies py-5 bg-dark text-light">
            <div class="container">
                <!-- Tabs -->
                <ul class="nav nav-pills justify-content-center mb-4" role="tablist">
                    <li class="nav-item" v-for="tab in movieTabs" :key="tab.key">
                        <button
                            class="nav-link"
                            :class="{ active: activeTab === tab.key }"
                            @click="activeTab = tab.key"
                        >
                            {{ tab.name }}
                        </button>
                    </li>
                </ul>

                <!-- Carousel -->
                <div id="movieCarousel" class="carousel slide" data-bs-interval="false">
                    <div class="carousel-inner">
                        <div
                            v-for="(movie, index) in displayedMovies"
                            :key="movie.movieId"
                            :class="['carousel-item', { active: index === 0 }]"
                        >
                            <div
                                class="movie-slide d-flex flex-column flex-md-row align-items-center justify-content-center"
                                :style="{ backgroundImage: 'url(' + movie.posterUrl + ')', cursor: 'pointer' }"
                                @click="goDetail(movie.movieId)"
                            >
                                <div class="movie-overlay"></div>
                                <div class="movie-info text-center text-md-start">
                                    <h2 class="fw-bold mb-3">{{ movie.title }}</h2>
                                    <p class="lead d-none d-md-block">{{ movie.description }}</p>
                                    <p class="small text-light-50 mb-4">
                                        {{ movie.duration }} phút • {{ movie.genre }}
                                    </p>
                                    <router-link :to="`/movie/${movie.movieId}`" class="btn btn-warning btn-lg"
                                        >🎟️ Đặt vé ngay</router-link
                                    >
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        class="carousel-control-prev"
                        type="button"
                        data-bs-target="#movieCarousel"
                        data-bs-slide="prev"
                    >
                        <span class="carousel-control-prev-icon"></span>
                    </button>
                    <button
                        class="carousel-control-next"
                        type="button"
                        data-bs-target="#movieCarousel"
                        data-bs-slide="next"
                    >
                        <span class="carousel-control-next-icon"></span>
                    </button>
                </div>

                <div v-if="loadingMovies" class="text-center mt-4">
                    <div class="spinner-border text-warning" role="status"></div>
                </div>
            </div>
        </section>

        <!-- TIN NÓNG -->
        <section class="news py-5 bg-white">
            <div class="container">
                <h2 class="section-title mb-4">Tin nóng</h2>
                <div class="row g-4">
                    <div v-for="news in newsItems" :key="news.id" class="col-md-4 col-sm-6">
                        <div class="card border-0 shadow-sm">
                            <img :src="news.image" class="card-img-top" style="object-fit: cover" />
                            <div class="card-body">
                                <h6 class="fw-bold">{{ news.title }}</h6>
                                <p class="text-muted small mb-0">{{ news.date }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- CGV eGIFT -->
        <section class="egift py-5 bg-light">
            <div class="container">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2 class="section-title mb-0">CGV eGift</h2>
                    <button class="btn btn-outline-secondary btn-sm">TẤT CẢ</button>
                </div>
                <div class="row g-4">
                    <div v-for="gift in egifts" :key="gift.id" class="col-md-4 col-sm-6">
                        <div class="card border-0 shadow-sm h-100 text-center bg-gradient">
                            <div class="card-body">
                                <div class="display-4 mb-3">{{ gift.icon }}</div>
                                <h6 class="fw-bold">{{ gift.name }}</h6>
                                <p class="text-muted small">{{ gift.price }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- VIDEOS -->
        <section class="videos py-5 bg-white">
            <div class="container">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2 class="section-title mb-0">Videos</h2>
                    <button class="btn btn-outline-secondary btn-sm">TẤT CẢ</button>
                </div>
                <div class="row g-4">
                    <div v-for="video in videos" :key="video.id" class="col-md-4 col-sm-6">
                        <div class="card border-0 shadow-sm h-100 bg-dark text-white">
                            <div class="video-thumb position-relative">
                                <img
                                    :src="video.thumbnail"
                                    class="card-img-top"
                                    style="height: 220px; object-fit: cover"
                                />
                                <div class="play-btn position-absolute top-50 start-50 translate-middle">▶</div>
                            </div>
                            <div class="card-body">
                                <p class="fw-semibold small">{{ video.title }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- ƯU ĐÃI ĐỐI TÁC -->
        <section class="offers py-5 bg-light">
            <div class="container">
                <h2 class="section-title mb-4">Ưu đãi từ đối tác</h2>
                <div class="row g-4">
                    <div v-for="offer in offers" :key="offer.id" class="col-md-4 col-sm-6">
                        <div class="card border-0 shadow-sm h-100 text-center">
                            <div class="card-body">
                                <div class="display-5 mb-3">{{ offer.icon }}</div>
                                <h6 class="fw-bold">{{ offer.title }}</h6>
                                <p class="text-muted small">{{ offer.desc }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- FOOTER -->
        <footer class="bg-dark text-light py-5 border-top border-secondary">
            <div class="container">
                <div class="row">
                    <div class="col-md-3 mb-4">
                        <h5 class="text-white">Về CGV</h5>
                        <ul class="list-unstyled small">
                            <li><a href="#" class="footer-link">Giới thiệu</a></li>
                            <li><a href="#" class="footer-link">Tin tức</a></li>
                            <li><a href="#" class="footer-link">Liên hệ</a></li>
                        </ul>
                    </div>
                    <div class="col-md-3 mb-4">
                        <h5 class="text-white">Hỗ trợ</h5>
                        <ul class="list-unstyled small">
                            <li><a href="#" class="footer-link">FAQ</a></li>
                            <li><a href="#" class="footer-link">Điều khoản</a></li>
                            <li><a href="#" class="footer-link">Chính sách bảo mật</a></li>
                        </ul>
                    </div>
                    <div class="col-md-3 mb-4">
                        <h5 class="text-white">Kết nối</h5>
                        <div class="d-flex gap-3">
                            <a href="#" class="footer-icon">🌐</a>
                            <a href="#" class="footer-icon">📘</a>
                            <a href="#" class="footer-icon">🎥</a>
                        </div>
                    </div>
                    <div class="col-md-3 mb-4">
                        <h5 class="text-white">Địa chỉ</h5>
                        <p class="small">268 Lý Thường Kiệt, Q.10, TP.HCM</p>
                    </div>
                </div>
                <div class="text-center small text-secondary border-top border-secondary pt-3 mt-3">
                    © 2025 CGV Vietnam. All rights reserved.
                </div>
            </div>
        </footer>
    </div>
</template>

<script setup>
import AppHeader from "@/components/AppHeader.vue";
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";
import api from "@/api";

const router = useRouter();
const auth = useAuthStore();

const handleLogout = () => {
    auth.logout();
    router.push("/");
};

// --- Movie Section Logic ---
const movieTabs = [
    { key: "now_showing", name: "Đang Chiếu" },
    { key: "coming_soon", name: "Sắp Chiếu" },
    { key: "special_release", name: "Đặc Biệt" },
];
const activeTab = ref("now_showing");
const movies = ref([]);
const loadingMovies = ref(false);

const fetchMovies = async (status) => {
    loadingMovies.value = true;
    try {
        const response = await api.get(`/movies/status/${status}`);
        movies.value = response.data;
    } catch (error) {
        console.error(`Lỗi khi tải phim ${status}:`, error);
        movies.value = []; // Reset on error
    } finally {
        loadingMovies.value = false;
    }
};

const displayedMovies = computed(() => movies.value);
const goDetail = (id) => router.push(`/movie/${id}`);

// Watch for tab changes to fetch new data
watch(
    activeTab,
    (newTab) => {
        fetchMovies(newTab.toUpperCase());
    },
    { immediate: true }
); // immediate: true to run on initial load

onMounted(() => {
    auth.restoreSession();
    // Initial fetch is handled by the watcher
});

// --- Static Data for other sections ---
const newsItems = [
    {
        id: 1,
        title: "CGV ưu đãi Halloween cực khủng 🎃",
        image: "https://www.cgv.vn/media/wysiwyg/2025/102025/240x201_2_.jpg",
        date: "28/10/2025",
    },
    {
        id: 2,
        title: "Quà sinh nhật miễn phí trong tháng 11",
        image: "https://www.cgv.vn/media/wysiwyg/2025/102025/240x201.jpg",
        date: "3/11/2025",
    },
    {
        id: 3,
        title: "Nhận combo bắp nước miễn phí 🍿",
        image: "https://www.cgv.vn/media/banner/cache/1/b58515f018eb873dafa430b6f9ae0c1e/2/4/240x201_2_.jpg",
        date: "20/10/2025",
    },
];

const egifts = [
    { id: 1, name: "PACONNIE 01", price: "99,000đ", icon: "🎁" },
    { id: 2, name: "CINE 04", price: "199,000đ", icon: "🎫" },
    { id: 3, name: "COMBO", price: "299,000đ", icon: "🍿" },
];

const videos = [
    {
        id: 1,
        title: "YAMAHA PG-1 ABS 2025 - RỰC RỠ PHIÊU LƯU",
        thumbnail: "https://via.placeholder.com/600x400?text=Video+1",
    },
    { id: 2, title: "Zootopia 2 - Trailer Chính Thức", thumbnail: "https://via.placeholder.com/600x400?text=Video+2" },
    { id: 3, title: "SONIC 4 - Phim Bom Tấn Năm 2025", thumbnail: "https://via.placeholder.com/600x400?text=Video+3" },
];

const offers = [
    { id: 1, icon: "🎁", title: "Giảm 50% vé cặp đôi", desc: "Dành cho khách hàng đặt online" },
    { id: 2, icon: "🍿", title: "Tặng bắp + nước miễn phí", desc: "Khi mua vé suất chiếu sáng" },
    { id: 3, icon: "💳", title: "Ưu đãi thành viên CGV", desc: "Giảm 20% toàn bộ vé" },
];
</script>

<style scoped>
.news .card {
    max-width: 360px;
    margin: 0 auto;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.news .card img {
    height: auto;
    width: 100%;
    object-fit: contain;
    border-radius: 6px 6px 0 0;
}

.news .card:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
}
.movie-slide {
    position: relative;
    height: 70vh;
    background-size: cover;
    background-position: center;
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
}
.movie-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
}
.movie-info {
    position: relative;
    z-index: 2;
    color: #fff;
    max-width: 650px;
    padding: 2rem;
}
.nav-pills .nav-link {
    font-weight: 600;
    color: #aaa;
    border: none;
    background-color: transparent;
    transition: all 0.3s;
}
.nav-pills .nav-link.active,
.nav-pills .show > .nav-link {
    color: #111;
    background-color: #ffcc00;
}
.nav-pills .nav-link:hover {
    color: #ffcc00;
}
.footer-link {
    color: #bbb;
    text-decoration: none;
}
.footer-link:hover {
    color: #fff;
}
.footer-icon {
    color: #ccc;
    font-size: 20px;
    text-decoration: none;
}
.footer-icon:hover {
    color: #ffcc00;
}
.section-title {
    font-weight: bold;
    color: #222;
    border-left: 4px solid #ff6600;
    padding-left: 10px;
}
.play-btn {
    font-size: 40px;
    color: #ffcc00;
    opacity: 0.9;
}
.navbar {
    font-size: 16px;
}

.nav-link {
    color: #444 !important;
    font-weight: 500;
    transition: 0.3s;
    padding: 0.5rem 1rem;
}

.nav-link:hover,
.router-link-active {
    color: #ff9900 !important;
}

.navbar-brand {
    font-weight: bold;
}
</style>
