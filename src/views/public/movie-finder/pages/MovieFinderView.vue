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

                            <div class="result-reason">
                                <i class="bi bi-stars"></i>
                                <p>{{ bestMovie.matchReason || "Có nhiều chi tiết gần với mô tả của bạn." }}</p>
                                <strong>{{ getMatchLabel(bestMovie.score) }}</strong>
                            </div>

                            <div class="result-diagnostics">
                                <div class="diagnostics-title">
                                    <i class="bi bi-sliders2"></i>
                                    <span>Thông tin kiểm tra</span>
                                </div>

                                <div class="diagnostics-grid">
                                    <div>
                                        <span>Nguồn xử lý</span>
                                        <strong :class="['source-pill', getSourceClass(bestMovie.matchSource)]">
                                            {{ getSourceLabel(bestMovie.matchSource) }}
                                        </strong>
                                    </div>
                                    <div>
                                        <span>Điểm tổng</span>
                                        <strong>{{ formatTotalScore(bestMovie.score) }}</strong>
                                    </div>
                                    <div>
                                        <span>Embedding</span>
                                        <strong>{{ formatModelScore(bestMovie.semanticScore) }}</strong>
                                    </div>
                                    <div>
                                        <span>Rerank</span>
                                        <strong>{{ formatModelScore(bestMovie.rerankScore) }}</strong>
                                    </div>
                                    <div>
                                        <span>Thời gian</span>
                                        <strong>{{ formatDuration(bestMovie.processingTimeMs) }}</strong>
                                    </div>
                                </div>

                                <p class="source-hint">{{ getSourceHint(bestMovie.matchSource) }}</p>
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

                    <div v-if="rankedMovies.length > 1" class="ranking-panel">
                        <div class="ranking-header">
                            <i class="bi bi-list-ol"></i>
                            <h3>Bảng kiểm tra xếp hạng</h3>
                        </div>

                        <div class="ranking-list">
                            <div
                                v-for="(movie, index) in rankedMovies"
                                :key="movie.movieId || `${movie.title}-${index}`"
                                class="ranking-row"
                            >
                                <span class="rank-number">#{{ index + 1 }}</span>
                                <strong class="rank-title">{{ movie.title }}</strong>
                                <span :class="['source-pill', getSourceClass(movie.matchSource)]">
                                    {{ getSourceLabel(movie.matchSource) }}
                                </span>
                                <span>{{ formatTotalScore(movie.score) }}</span>
                                <span>Embedding: {{ formatModelScore(movie.semanticScore) }}</span>
                                <span>Rerank: {{ formatModelScore(movie.rerankScore) }}</span>
                            </div>
                        </div>
                    </div>
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

const examples = [
    "người cháu về chăm sóc bà bị bệnh",
    "sinh vật ngoài hành tinh săn bằng âm thanh",
    "cú búng tay làm mất nửa vũ trụ",
    "gia đình nghèo giả danh vào nhà giàu",
];

const bestMovie = computed(() => resultMovies.value[0] || null);
const rankedMovies = computed(() => resultMovies.value.slice(0, 5));

const searchMovie = async () => {
    const query = storyQuery.value.trim();
    if (!query) return;

    loading.value = true;
    hasSearched.value = true;
    errorMessage.value = "";
    try {
        const { data } = await api.get("/movies/discover", {
            params: {
                query,
                limit: 5,
            },
        });
        resultMovies.value = Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Error discovering movie:", error);
        resultMovies.value = [];
        errorMessage.value = "Không tìm được phim theo mô tả lúc này. Vui lòng thử lại.";
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
};

const getMatchLabel = (score) => {
    const value = Number(score) || 0;
    if (value >= 75) return "Rất phù hợp";
    if (value >= 55) return "Có thể đúng";
    return "Gợi ý";
};

const formatTotalScore = (score) => {
    const value = Number(score);
    return Number.isFinite(value) ? `${value.toFixed(1)}/100` : "Chưa có";
};

const formatModelScore = (score) => {
    const value = Number(score);
    return Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : "Chưa có";
};

const formatDuration = (durationMs) => {
    const value = Number(durationMs);
    return Number.isFinite(value) ? `${Math.round(value)} ms` : "Chưa có";
};

const splitDescription = (description) => {
    const text = String(description || "").trim();
    if (!text) return [];
    return text
        .split(/\r?\n\s*\r?\n|\r?\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);
};

const getSourceLabel = (source) => {
    const sourceMap = {
        "EMBEDDING_MODEL+RERANK": "Embedding + Rerank",
        EMBEDDING_MODEL: "Embedding",
        RERANK: "Rerank",
        LOCAL_SCORING: "Chấm điểm nội bộ",
    };
    return sourceMap[source] || "Chưa rõ";
};

const getSourceClass = (source) => {
    if (source === "EMBEDDING_MODEL+RERANK") return "is-full-model";
    if (source === "EMBEDDING_MODEL" || source === "RERANK") return "is-model";
    return "is-local";
};

const getSourceHint = (source) => {
    if (source === "EMBEDDING_MODEL+RERANK") {
        return "Đã dùng embedding để lấy ứng viên và rerank để xếp hạng lại.";
    }
    if (source === "EMBEDDING_MODEL") {
        return "Đã dùng embedding, nhưng rerank chưa trả điểm cho kết quả này.";
    }
    if (source === "RERANK") {
        return "Đã dùng rerank trên danh sách ứng viên, nhưng không có điểm embedding.";
    }
    return "Kết quả đang dựa vào chấm điểm nội bộ. Nếu muốn dùng model, hãy kiểm tra AI service và rebuild embedding.";
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

onMounted(() => {
    const query = typeof route.query.story === "string" ? route.query.story.trim() : "";
    if (query) {
        storyQuery.value = query;
        searchMovie();
    }
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

.result-meta i,
.result-reason i {
    color: #ff6b35;
}

.result-reason {
    align-items: flex-start;
    background: #fffaf7;
    border: 1px solid #ffd8c9;
    border-radius: 8px;
    display: flex;
    gap: 0.6rem;
    margin-bottom: 1rem;
    padding: 0.8rem;
}

.result-reason p {
    color: #5b463e;
    flex: 1;
    line-height: 1.45;
    margin: 0;
}

.result-reason strong {
    background: #fff1eb;
    border-radius: 999px;
    color: #ff6b35;
    flex: 0 0 auto;
    font-size: 0.78rem;
    padding: 0.35rem 0.55rem;
}

.result-diagnostics {
    background: #fbfbfb;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    margin-bottom: 1rem;
    padding: 0.85rem;
}

.diagnostics-title,
.ranking-header {
    align-items: center;
    color: #444;
    display: flex;
    gap: 0.45rem;
}

.diagnostics-title {
    font-size: 0.9rem;
    font-weight: 850;
    margin-bottom: 0.7rem;
}

.diagnostics-title i,
.ranking-header i {
    color: #ff6b35;
}

.diagnostics-grid {
    display: grid;
    gap: 0.6rem;
    grid-template-columns: repeat(5, minmax(0, 1fr));
}

.diagnostics-grid div {
    min-width: 0;
}

.diagnostics-grid span {
    color: #767676;
    display: block;
    font-size: 0.74rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
}

.diagnostics-grid strong,
.ranking-row > span {
    color: #333;
    font-size: 0.84rem;
    font-weight: 800;
}

.source-pill {
    align-items: center;
    border-radius: 999px;
    display: inline-flex;
    line-height: 1.2;
    max-width: 100%;
    padding: 0.28rem 0.5rem;
    white-space: normal;
}

.source-pill.is-full-model {
    background: #ecfdf3;
    color: #18794e;
}

.source-pill.is-model {
    background: #eef4ff;
    color: #315fba;
}

.source-pill.is-local {
    background: #fff6e5;
    color: #9a5b00;
}

.source-hint {
    color: #686868;
    font-size: 0.82rem;
    line-height: 1.45;
    margin: 0.7rem 0 0;
}

.ranking-panel {
    background: #fff;
    border: 1px solid #e3e3e3;
    border-radius: 8px;
    box-shadow: 0 12px 30px rgba(42, 28, 20, 0.06);
    margin-top: 1rem;
    padding: 1rem;
}

.ranking-header {
    margin-bottom: 0.75rem;
}

.ranking-header h3 {
    font-size: 1rem;
    font-weight: 850;
    margin: 0;
}

.ranking-list {
    display: grid;
    gap: 0.5rem;
}

.ranking-row {
    align-items: center;
    background: #fafafa;
    border: 1px solid #ececec;
    border-radius: 8px;
    display: grid;
    gap: 0.6rem;
    grid-template-columns: 44px minmax(150px, 1fr) minmax(130px, auto) repeat(3, minmax(90px, auto));
    padding: 0.65rem 0.75rem;
}

.rank-number {
    color: #ff6b35;
}

.rank-title {
    color: #252525;
    font-size: 0.92rem;
    min-width: 0;
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

    .diagnostics-grid,
    .ranking-row {
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
