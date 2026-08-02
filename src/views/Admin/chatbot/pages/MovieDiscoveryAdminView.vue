<template>
    <div class="bot-admin-page">
        <div class="page-header">
            <div>
                <p class="eyebrow">Movie discovery</p>
                <h2>Tìm phim bằng mô tả</h2>
                <p class="subtitle">Theo dõi embedding cache và đồng bộ lại sau khi chỉnh nội dung phim.</p>
            </div>
            <button class="btn btn-outline-secondary" type="button" :disabled="loadingStatus" @click="loadStatus">
                <i class="bi bi-arrow-clockwise me-2"></i>
                Làm mới
            </button>
        </div>

        <div v-if="message" :class="['alert', messageType === 'error' ? 'alert-danger' : 'alert-success']">
            {{ message }}
        </div>

        <section class="status-grid">
            <div class="status-card">
                <span>Tổng phim</span>
                <strong>{{ status?.totalMovies ?? "--" }}</strong>
            </div>
            <div class="status-card">
                <span>Phim đã có embedding</span>
                <strong>{{ status?.embeddedMovies ?? "--" }}</strong>
            </div>
            <div class="status-card">
                <span>Phim thiếu embedding</span>
                <strong>{{ status?.missingMovieEmbeddings ?? "--" }}</strong>
            </div>
            <div class="status-card">
                <span>Embedding provider</span>
                <strong>{{ status?.embeddingProviderAvailable ? "Sẵn sàng" : "Chưa sẵn sàng" }}</strong>
            </div>
        </section>

        <section class="action-panel">
            <div>
                <h3>Rebuild embedding</h3>
                <p>
                    Chạy thao tác này sau khi thêm phim mới hoặc sửa mô tả phim trong admin. Backend sẽ tạo lại embedding
                    để phần tìm kiếm ngữ nghĩa có dữ liệu mới.
                </p>
            </div>
            <button class="btn btn-primary" type="button" :disabled="rebuilding" @click="rebuildEmbeddings">
                <span v-if="rebuilding" class="spinner-border spinner-border-sm me-2"></span>
                <i v-else class="bi bi-cpu me-2"></i>
                {{ rebuilding ? "Đang rebuild" : "Rebuild embedding" }}
            </button>
        </section>

        <section v-if="lastRebuild" class="result-panel">
            <h3>Kết quả rebuild gần nhất</h3>
            <div class="result-grid">
                <div>
                    <span>Phim cập nhật</span>
                    <strong>{{ lastRebuild.updatedMovies }}</strong>
                </div>
                <div>
                    <span>Phim lỗi</span>
                    <strong>{{ lastRebuild.failedMovies }}</strong>
                </div>
                <div>
                    <span>Snack cập nhật</span>
                    <strong>{{ lastRebuild.updatedSnacks }}</strong>
                </div>
                <div>
                    <span>Tài liệu cập nhật</span>
                    <strong>{{ lastRebuild.updatedPolicyDocuments }}</strong>
                </div>
            </div>
            <p class="result-message">{{ lastRebuild.message }}</p>
        </section>
    </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import api from "@/api";

const status = ref(null);
const lastRebuild = ref(null);
const loadingStatus = ref(false);
const rebuilding = ref(false);
const message = ref("");
const messageType = ref("success");

const showMessage = (text, type = "success") => {
    message.value = text;
    messageType.value = type;
};

const loadStatus = async () => {
    loadingStatus.value = true;
    message.value = "";
    try {
        const { data } = await api.get("/admin/bot/embeddings/status");
        status.value = data;
    } catch (error) {
        console.error("Could not load embedding status:", error);
        showMessage("Không tải được trạng thái embedding. Kiểm tra backend hoặc quyền admin.", "error");
    } finally {
        loadingStatus.value = false;
    }
};

const rebuildEmbeddings = async () => {
    rebuilding.value = true;
    message.value = "";
    try {
        const { data } = await api.post("/admin/bot/embeddings/rebuild", null, {
            params: { force: true },
            timeout: 300000,
        });
        lastRebuild.value = data;
        showMessage("Đã rebuild embedding xong.");
        await loadStatus();
    } catch (error) {
        console.error("Could not rebuild embeddings:", error);
        showMessage("Rebuild embedding thất bại. Kiểm tra AI service ở cổng 8002.", "error");
    } finally {
        rebuilding.value = false;
    }
};

onMounted(loadStatus);
</script>

<style scoped>
.bot-admin-page {
    display: flex;
    flex-direction: column;
    gap: 18px;
}

.page-header,
.action-panel,
.result-panel {
    border: 1px solid #eee2dc;
    border-radius: 12px;
    background: #fff;
    padding: 18px;
}

.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
}

.eyebrow {
    color: #ff6b35;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    margin: 0 0 4px;
    text-transform: uppercase;
}

h2,
h3,
.subtitle,
.action-panel p,
.result-message {
    margin: 0;
}

h2 {
    color: #221f1f;
    font-size: 1.45rem;
    font-weight: 800;
}

h3 {
    color: #221f1f;
    font-size: 1.05rem;
    font-weight: 800;
}

.subtitle,
.action-panel p,
.result-message {
    color: #6b625f;
}

.status-grid,
.result-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
}

.status-card,
.result-grid > div {
    border: 1px solid #f0dfd7;
    border-radius: 10px;
    background: #fffaf7;
    padding: 14px;
}

.status-card span,
.result-grid span {
    color: #7a6d68;
    display: block;
    font-size: 0.86rem;
    margin-bottom: 6px;
}

.status-card strong,
.result-grid strong {
    color: #221f1f;
    font-size: 1.25rem;
    font-weight: 800;
}

.action-panel {
    align-items: center;
    display: flex;
    justify-content: space-between;
    gap: 18px;
}

.action-panel p {
    margin-top: 8px;
    max-width: 720px;
}

.result-panel {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

@media (max-width: 900px) {
    .page-header,
    .action-panel {
        align-items: stretch;
        flex-direction: column;
    }

    .status-grid,
    .result-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 560px) {
    .status-grid,
    .result-grid {
        grid-template-columns: 1fr;
    }
}
</style>
