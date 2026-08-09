<template>
    <div class="finder-page">
        <AppHeader />

        <main class="finder-main">
            <section class="finder-intro">
                <div class="container">
                    <div class="finder-tool">
                        <div class="finder-copy">
                            <span class="finder-kicker">Tìm phim bằng mô tả</span>
                            <h1>Bạn không nhớ tên phim?</h1>
                            <p>Hãy kể lại một cảnh, nhân vật, bối cảnh hoặc tình huống bạn còn nhớ.</p>
                        </div>

                        <form class="finder-form" @submit.prevent="searchMovie">
                            <div class="finder-input-shell">
                                <i class="bi bi-chat-left-text"></i>
                                <textarea
                                    v-model="storyQuery"
                                    rows="4"
                                    placeholder="Ví dụ: người cháu về chăm sóc bà bị bệnh"
                                ></textarea>
                            </div>

                            <div class="finder-actions">
                                <button class="finder-submit" type="submit" :disabled="loading || !storyQuery.trim()">
                                    <span v-if="loading" class="mini-spinner"></span>
                                    <i v-else class="bi bi-search"></i>
                                    {{ loading ? "Đang tìm" : "Tìm phim phù hợp nhất" }}
                                </button>
                                <button v-if="hasSearched" class="finder-reset" type="button" @click="resetSearch">
                                    Xóa tìm kiếm
                                </button>
                            </div>
                        </form>

                        <div v-if="!hasSearched" class="finder-examples">
                            <button
                                v-for="example in examples"
                                :key="example"
                                type="button"
                                @click="useExample(example)"
                            >
                                {{ example }}
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <section class="finder-result-section">
                <div class="container">
                    <div v-if="errorMessage" class="finder-message is-error">
                        {{ errorMessage }}
                    </div>

                    <div v-else-if="loading" class="finder-message">
                        Đang phân tích mô tả của bạn...
                    </div>

                    <div v-else-if="hasSearched && !bestMovie" class="finder-empty">
                        <h2>Chưa tìm thấy phim phù hợp</h2>
                        <p>Thử mô tả thêm bối cảnh, nhân vật, thể loại hoặc một cảnh nổi bật trong phim.</p>
                    </div>

                    <article v-else-if="bestMovie" class="finder-result">
                        <div class="result-poster">
                            <img :src="resolveMediaUrl(bestMovie.posterUrl)" :alt="bestMovie.title" />
                        </div>

                        <div class="result-content">
                            <span class="result-label">Gợi ý phù hợp nhất</span>
                            <h2>{{ bestMovie.title }}</h2>

                            <div class="result-meta">
                                <span><i class="bi bi-camera-reels"></i>{{ bestMovie.genre || "Phim" }}</span>
                                <span><i class="bi bi-clock"></i>{{ bestMovie.duration || 120 }} phút</span>
                                <span><i class="bi bi-shield-check"></i>{{ formatAgeRating(bestMovie.ageRating) }}</span>
                            </div>

                            <div v-if="bestMovie.description" class="result-description">
                                <p
                                    v-for="(paragraph, index) in splitDescription(bestMovie.description)"
                                    :key="`${bestMovie.movieId}-description-${index}`"
                                >
                                    {{ paragraph }}
                                </p>
                            </div>

                            <div class="result-actions">
                                <button type="button" class="primary-action" @click="goBooking(bestMovie.movieId)">
                                    Đặt vé
                                </button>
                                <button type="button" class="secondary-action" @click="goMovieDetail(bestMovie.movieId)">
                                    Xem chi tiết
                                </button>
                            </div>
                        </div>
                    </article>

                    <section v-if="!loading && suggestedMovies.length" class="suggestion-panel">
                        <div class="suggestion-header">
                            <span class="result-label">Gợi ý thêm</span>
                            <h3>Phim có thể liên quan</h3>
                        </div>

                        <div class="suggestion-list">
                            <article
                                v-for="(movie, index) in suggestedMovies"
                                :key="movie.movieId || `${movie.title}-${index}`"
                                class="suggestion-card"
                            >
                                <img :src="resolveMediaUrl(movie.posterUrl)" :alt="movie.title" />
                                <div class="suggestion-content">
                                    <strong>{{ movie.title }}</strong>
                                    <div class="suggestion-meta">
                                        <span>{{ movie.genre || "Phim" }}</span>
                                        <span>{{ movie.duration || 120 }} phút</span>
                                    </div>
                                </div>
                                <button type="button" class="detail-icon-button" :aria-label="`Xem ${movie.title}`" @click="goMovieDetail(movie.movieId)">
                                    <i class="bi bi-chevron-right"></i>
                                </button>
                            </article>
                        </div>
                    </section>

                </div>
            </section>
        </main>

        <AppFooter />
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import AppHeader from "@/components/AppHeader.vue";
import AppFooter from "@/components/AppFooter.vue";
import api from "@/api";
import { resolveMediaUrl } from "@/utils/mediaUrl";

const route = useRoute();
const router = useRouter();

const storyQuery = ref("");
const resultMovies = ref([]);
const loading = ref(false);
const hasSearched = ref(false);
const errorMessage = ref("");
const SEARCH_CACHE_KEY = "movie-finder:last-search";
const SEARCH_CACHE_TTL_MS = 30 * 60 * 1000;

const examples = [
    "người cháu về chăm sóc bà bị bệnh",
    "sinh vật ngoài hành tinh săn bằng âm thanh",
    "cú búng tay làm mất nửa vũ trụ",
    "gia đình nghèo giả danh vào nhà giàu",
];

const bestMovie = computed(() => resultMovies.value[0] || null);
const suggestedMovies = computed(() => resultMovies.value.slice(1, 4));

const searchMovie = async () => {
    const query = storyQuery.value.trim();
    if (!query) return;

    loading.value = true;
    hasSearched.value = true;
    errorMessage.value = "";
    resultMovies.value = [];
    try {
        const { data } = await api.get("/movies/discover", {
            params: {
                query,
                limit: 5,
            },
            timeout: 120000,
        });
        resultMovies.value = Array.isArray(data) ? data : [];
        saveSearchState(query, resultMovies.value);
    } catch (error) {
        const isTimeout = error?.code === "ECONNABORTED" || String(error?.message || "").toLowerCase().includes("timeout");
        console.error("Error discovering movie:", {
            message: error?.message,
            status: error?.response?.status,
            data: error?.response?.data,
            url: error?.config?.url,
            method: error?.config?.method,
        });
        resultMovies.value = [];
        errorMessage.value = isTimeout
            ? "Hệ thống phân tích mô tả quá lâu. Vui lòng thử lại sau ít phút hoặc rút gọn mô tả."
            : "Không tìm được phim theo mô tả lúc này. Vui lòng thử lại.";
    } finally {
        loading.value = false;
    }
};

const useExample = (example) => {
    storyQuery.value = example;
    searchMovie();
};

const resetSearch = () => {
    storyQuery.value = "";
    resultMovies.value = [];
    hasSearched.value = false;
    errorMessage.value = "";
    clearSearchState();
};

const splitDescription = (description) => {
    const text = String(description || "").trim();
    if (!text) return [];
    return text
        .split(/\r?\n\s*\r?\n|\r?\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);
};

const formatAgeRating = (ageRating) => {
    const ratingMap = {
        P: "Phổ thông",
        C13: "Cấm dưới 13 tuổi",
        C16: "Cấm dưới 16 tuổi",
        C18: "Cấm dưới 18 tuổi",
    };
    return ratingMap[ageRating] || ageRating || "Phổ thông";
};

const goMovieDetail = (movieId) => {
    router.push(`/movie/${movieId}`);
};

const goBooking = (movieId) => {
    router.push(`/booking/${movieId}`);
};

const saveSearchState = (query, movies) => {
    const payload = {
        query,
        movies,
        savedAt: Date.now(),
    };
    sessionStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify(payload));
};

const clearSearchState = () => {
    sessionStorage.removeItem(SEARCH_CACHE_KEY);
};

const restoreSearchState = () => {
    try {
        const cached = JSON.parse(sessionStorage.getItem(SEARCH_CACHE_KEY) || "null");
        if (!cached || Date.now() - Number(cached.savedAt) > SEARCH_CACHE_TTL_MS) {
            clearSearchState();
            return false;
        }

        storyQuery.value = String(cached.query || "");
        resultMovies.value = Array.isArray(cached.movies) ? cached.movies : [];
        hasSearched.value = Boolean(storyQuery.value || resultMovies.value.length);
        return hasSearched.value;
    } catch (error) {
        console.error("Could not restore movie finder state:", error);
        clearSearchState();
        return false;
    }
};

onMounted(() => {
    const query = typeof route.query.story === "string" ? route.query.story.trim() : "";
    if (query) {
        storyQuery.value = query;
        searchMovie();
        return;
    }

    restoreSearchState();
});
</script>

<style scoped>
.finder-page {
    background: #f6f6f6;
    color: #252525;
    min-height: 100vh;
}

.container {
    margin: 0 auto;
    max-width: 1180px;
    padding: 0 1.5rem;
}

.finder-main {
    min-height: 70vh;
}

.finder-intro {
    background: #fff;
    border-bottom: 1px solid #e9e9e9;
    padding: 2.5rem 0 1.5rem;
}

.finder-tool {
    background: linear-gradient(180deg, #fff 0%, #fffaf7 100%);
    border: 1px solid #f0ddd5;
    border-radius: 8px;
    box-shadow: 0 14px 34px rgba(42, 28, 20, 0.08);
    padding: 1.25rem;
}

.finder-copy {
    margin-bottom: 1rem;
}

.finder-kicker {
    color: #ff6b35;
    display: block;
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    margin-bottom: 0.35rem;
    text-transform: uppercase;
}

.finder-copy h1 {
    font-size: 2rem;
    font-weight: 850;
    letter-spacing: 0;
    margin: 0 0 0.45rem;
}

.finder-copy p {
    color: #606060;
    font-size: 1rem;
    line-height: 1.5;
    margin: 0;
}

.finder-form {
    display: grid;
    gap: 0.9rem;
}

.finder-input-shell {
    align-items: flex-start;
    background: #fff;
    border: 1px solid #dedede;
    border-radius: 8px;
    display: flex;
    gap: 0.75rem;
    padding: 0.85rem 0.95rem;
}

.finder-input-shell:focus-within {
    border-color: #ff9d7a;
    box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.12);
}

.finder-input-shell i {
    color: #ff6b35;
    margin-top: 0.15rem;
}

.finder-input-shell textarea {
    background: transparent;
    border: 0;
    color: #333;
    font-size: 1rem;
    line-height: 1.45;
    min-height: 92px;
    outline: none;
    resize: vertical;
    width: 100%;
}

.finder-actions,
.result-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
}

.finder-submit,
.finder-reset,
.primary-action,
.secondary-action {
    border-radius: 7px;
    font-weight: 800;
    min-height: 42px;
    padding: 0.55rem 1rem;
}

.finder-submit,
.primary-action {
    align-items: center;
    background: #ff6b35;
    border: 1px solid #ff6b35;
    color: #fff;
    display: inline-flex;
    gap: 0.45rem;
}

.finder-submit:disabled {
    cursor: not-allowed;
    opacity: 0.65;
}

.finder-reset,
.secondary-action {
    background: #fff;
    border: 1px solid #e3d6d0;
    color: #555;
}

.finder-examples {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    margin-top: 1rem;
}

.finder-examples button {
    background: #fff;
    border: 1px solid #eadbd4;
    border-radius: 999px;
    color: #5a4a43;
    font-size: 0.84rem;
    font-weight: 700;
    padding: 0.4rem 0.75rem;
}

.finder-result-section {
    padding: 2rem 0 4rem;
}

.finder-message,
.finder-empty {
    background: #fff;
    border: 1px solid #e7e7e7;
    border-radius: 8px;
    color: #555;
    padding: 1.1rem;
    text-align: center;
}

.finder-message.is-error {
    background: #fff0f0;
    border-color: #ffd0d0;
    color: #a4271b;
}

.finder-empty h2 {
    font-size: 1.25rem;
    font-weight: 850;
    margin: 0 0 0.4rem;
}

.finder-empty p {
    margin: 0;
}

.finder-result {
    background: #fff;
    border: 1px solid #e3e3e3;
    border-radius: 8px;
    display: flow-root;
    overflow: hidden;
    box-shadow: 0 12px 30px rgba(42, 28, 20, 0.08);
}

.result-poster {
    background: #eee;
    float: left;
    height: 420px;
    min-height: 0;
    margin: 0 1.35rem 1rem 0;
    overflow: hidden;
    width: clamp(220px, 24vw, 280px);
}

.result-poster img {
    display: block;
    height: 100%;
    object-fit: cover;
    width: 100%;
}

.result-content {
    padding: 1.35rem;
}

.result-label {
    color: #ff6b35;
    display: block;
    font-size: 0.78rem;
    font-weight: 850;
    letter-spacing: 0.04em;
    margin-bottom: 0.45rem;
    text-transform: uppercase;
}

.result-content h2 {
    font-size: 1.75rem;
    font-weight: 850;
    letter-spacing: 0;
    margin: 0 0 0.8rem;
}

.result-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    margin-bottom: 1rem;
}

.result-meta span {
    align-items: center;
    background: #f8f8f8;
    border: 1px solid #e9e9e9;
    border-radius: 999px;
    color: #555;
    display: inline-flex;
    font-size: 0.88rem;
    font-weight: 700;
    gap: 0.35rem;
    padding: 0.35rem 0.65rem;
}

.result-meta i {
    color: #ff6b35;
}

.result-description {
    color: #555;
    line-height: 1.55;
    margin: 0 0 1.1rem;
    white-space: pre-line;
}

.result-description p {
    margin: 0 0 0.85rem;
}

.result-description p:last-child {
    margin-bottom: 0;
}

.suggestion-panel {
    background: #fff;
    border: 1px solid #e3e3e3;
    border-radius: 8px;
    box-shadow: 0 12px 30px rgba(42, 28, 20, 0.06);
    margin-top: 1rem;
    padding: 1rem;
}

.suggestion-header {
    margin-bottom: 0.75rem;
}

.suggestion-header h3 {
    color: #252525;
    font-size: 1.12rem;
    font-weight: 850;
    letter-spacing: 0;
    margin: 0;
}

.suggestion-list {
    display: grid;
    gap: 0.75rem;
    grid-template-columns: repeat(3, minmax(0, 1fr));
}

.suggestion-card {
    align-items: center;
    background: #fffaf7;
    border: 1px solid #f0ddd5;
    border-radius: 8px;
    display: grid;
    gap: 0.75rem;
    grid-template-columns: 72px minmax(0, 1fr) 34px;
    min-height: 120px;
    padding: 0.75rem;
}

.suggestion-card img {
    aspect-ratio: 2 / 3;
    border-radius: 7px;
    height: 96px;
    object-fit: cover;
    width: 64px;
}

.suggestion-content {
    min-width: 0;
}

.suggestion-content strong {
    color: #252525;
    display: block;
    font-size: 0.95rem;
    font-weight: 850;
    line-height: 1.35;
    margin-bottom: 0.45rem;
}

.suggestion-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
}

.suggestion-meta span {
    background: #fff;
    border: 1px solid #eadbd4;
    border-radius: 999px;
    color: #6a5850;
    font-size: 0.78rem;
    font-weight: 750;
    padding: 0.22rem 0.5rem;
}

.detail-icon-button {
    align-items: center;
    background: #fff;
    border: 1px solid #eadbd4;
    border-radius: 8px;
    color: #ff6b35;
    display: inline-flex;
    height: 34px;
    justify-content: center;
    transition: 0.2s ease;
    width: 34px;
}

.detail-icon-button:hover {
    background: #ff6b35;
    border-color: #ff6b35;
    color: #fff;
}

.mini-spinner {
    animation: spin 0.8s linear infinite;
    border: 2px solid rgba(255, 255, 255, 0.45);
    border-radius: 50%;
    border-top-color: #fff;
    height: 15px;
    width: 15px;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

@media (max-width: 768px) {
    .finder-copy h1 {
        font-size: 1.5rem;
    }

    .finder-result {
        display: block;
    }

    .result-poster {
        float: none;
        height: 360px;
        margin: 0;
        width: 100%;
    }

    .result-content {
        padding: 1.1rem;
    }

    .suggestion-list {
        grid-template-columns: 1fr;
    }

    .finder-submit,
    .finder-reset,
    .primary-action,
    .secondary-action {
        justify-content: center;
        width: 100%;
    }
}
</style>
