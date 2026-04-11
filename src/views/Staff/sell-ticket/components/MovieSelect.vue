<template>
    <div class="container py-4 movie-select-page">
        <div class="hero-head mb-4">
            <p class="hero-kicker mb-1">Bán vé tại quầy</p>
            <h4 class="mb-0">Chọn phim để bắt đầu giao dịch</h4>
        </div>

        <!-- Tabs -->
        <ul class="nav nav-tabs mb-4" role="tablist">
            <li class="nav-item" role="presentation">
                <button
                    class="nav-link"
                    :class="{ active: activeTab === 'now_showing' }"
                    @click="activeTab = 'now_showing'"
                    role="tab"
                >
                    Đang chiếu
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button
                    class="nav-link"
                    :class="{ active: activeTab === 'coming_soon' }"
                    @click="activeTab = 'coming_soon'"
                    role="tab"
                >
                    Sắp chiếu
                </button>
            </li>
        </ul>

        <div v-if="loading" class="empty-state mt-4">
            <div class="empty-icon"><i class="bi bi-hourglass-split"></i></div>
            <h5 class="empty-title">Đang tải danh sách phim</h5>
            <p class="empty-text">Hệ thống đang đồng bộ dữ liệu suất chiếu mới nhất.</p>
        </div>

        <div v-else-if="error" class="empty-state mt-4 is-error">
            <div class="empty-icon"><i class="bi bi-exclamation-triangle"></i></div>
            <h5 class="empty-title">Không thể tải danh sách phim</h5>
            <p class="empty-text">Vui lòng kiểm tra kết nối mạng hoặc thử lại sau vài giây.</p>
            <button class="btn btn-primary mt-2" @click="fetchMovies">Tải lại</button>
        </div>

        <!-- Movies Grid -->
        <div v-else class="row g-4">
            <div v-for="m in displayedMovies" :key="m.movieId" class="col-md-3">
                <div class="card movie-card h-100" @click="$emit('select', m)">
                    <img :src="m.posterUrl || '/default-poster.jpg'" class="card-img-top" />
                    <div class="card-body">
                        <h5 class="card-title">{{ m.title }}</h5>
                        <p class="text-muted small mb-1">{{ m.genre }} • {{ m.duration }} phút</p>
                        <p class="small">{{ m.description }}</p>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="!loading && !error && displayedMovies.length === 0" class="empty-state mt-4">
            <div class="empty-icon"><i class="bi bi-camera-reels"></i></div>
            <h5 class="empty-title">Chưa có phim khả dụng</h5>
            <p class="empty-text">Hiện chưa có phim trong danh mục này để nhân viên bán vé.</p>
            <p class="empty-subtext mb-0">Bạn có thể chuyển tab hoặc nhờ quản trị viên mở lịch chiếu mới.</p>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import api from "@/api";

const activeTab = ref("now_showing");
const nowShowingMovies = ref([]);
const comingSoonMovies = ref([]);
const loading = ref(false);
const error = ref(false);

const displayedMovies = computed(() => {
    return activeTab.value === "now_showing" ? nowShowingMovies.value : comingSoonMovies.value;
});

const fetchMovies = async () => {
    loading.value = true;
    error.value = false;
    try {
        const [nowRes, comingRes] = await Promise.all([
            api.get("/movies/status/NOW_SHOWING"),
            api.get("/movies/status/COMING_SOON"),
        ]);
        nowShowingMovies.value = nowRes.data;
        comingSoonMovies.value = comingRes.data;
    } catch (error) {
        error.value = true;
        console.error("Lỗi khi tải danh sách phim:", error);
    } finally {
        loading.value = false;
    }
};

onMounted(fetchMovies);
</script>

<style scoped>
.hero-head {
    background: linear-gradient(120deg, #fff7f2 0%, #fff 65%);
    border: 1px solid #f3dfd6;
    border-radius: 14px;
    padding: 14px 16px;
}

.hero-kicker {
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #a26f5e;
}

.nav-tabs .nav-link {
    color: #666;
    border: none;
    border-bottom: 2px solid transparent;
    transition: all 0.3s;
}

.nav-tabs .nav-link:hover {
    border-bottom-color: #ffc107;
    color: #ffc107;
}

.nav-tabs .nav-link.active {
    color: #ffc107;
    border-bottom-color: #ffc107;
    background-color: transparent;
}

.movie-card {
    cursor: pointer;
    transition: all 0.25s;
    border: 1px solid #efdfd8;
    border-radius: 12px;
}

.movie-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 18px rgba(255, 107, 53, 0.16);
}

.card-img-top {
    height: 280px;
    object-fit: cover;
    border-radius: 8px 8px 0 0;
}

.empty-state {
    border: 1px dashed #f1c8b6;
    border-radius: 14px;
    background: linear-gradient(140deg, #fff9f5 0%, #fff 70%);
    padding: 24px;
    text-align: center;
}

.empty-state.is-error {
    border-color: #f5b5b5;
    background: linear-gradient(140deg, #fff7f7 0%, #fff 70%);
}

.empty-icon {
    width: 52px;
    height: 52px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
    color: #ff6b35;
    background: rgba(255, 107, 53, 0.14);
    margin-bottom: 10px;
}

.empty-title {
    color: #3f3937;
    margin-bottom: 6px;
}

.empty-text,
.empty-subtext {
    color: #746c68;
}
</style>
