<template>
    <div class="moderation-page">
        <div class="moderation-heading">
            <div>
                <p class="section-kicker">AI Moderation</p>
                <h2>Kiểm duyệt đánh giá</h2>
                <span>Theo dõi review bị gắn cờ và lịch sử vi phạm của khách hàng.</span>
            </div>

            <button class="btn btn-outline-primary refresh-btn" :disabled="loading" @click="loadModerationData">
                <i class="bi bi-arrow-clockwise me-1"></i>
                Tải lại
            </button>
        </div>

        <section class="moderation-test-panel">
            <div class="test-input-block">
                <div class="panel-title-inline">
                    <div>
                        <p class="section-kicker">Test nhanh</p>
                        <h3>Kiểm tra nội dung bình luận</h3>
                    </div>
                    <button
                        class="btn btn-sm btn-outline-secondary"
                        type="button"
                        :disabled="testingModeration || testLogs.length === 0"
                        @click="clearTestLogs"
                    >
                        Xóa log test
                    </button>
                </div>
                <textarea
                    v-model="testComment"
                    class="form-control test-textarea"
                    rows="3"
                    maxlength="1000"
                    placeholder="Nhập bình luận cần test bộ lọc..."
                ></textarea>
                <div class="test-actions">
                    <small>{{ testComment.length }}/1000 ký tự</small>
                    <button
                        class="btn btn-warning fw-bold"
                        type="button"
                        :disabled="testingModeration || !testComment.trim()"
                        @click="runModerationTest"
                    >
                        <i class="bi bi-shield-check me-1"></i>
                        {{ testingModeration ? "Đang kiểm tra..." : "Kiểm tra" }}
                    </button>
                </div>
            </div>

            <div class="test-log-block">
                <div v-if="testLogs.length === 0" class="test-empty">
                    Kết quả test sẽ hiển thị tại đây.
                </div>
                <div v-else class="test-log-list">
                    <article v-for="log in testLogs" :key="log.id" class="test-log-item">
                        <div class="test-log-head">
                            <span class="badge-soft" :class="violationClass(log.severity)">
                                {{ log.flagged ? log.violationType : "SAFE" }}
                            </span>
                            <small>{{ formatDate(log.checkedAt) }}</small>
                        </div>
                        <p class="test-log-comment">{{ log.comment || "(Không có nội dung)" }}</p>
                        <small class="test-log-reason">{{ log.reason }}</small>
                    </article>
                </div>
            </div>
        </section>

        <div class="moderation-summary">
            <div class="summary-item">
                <span>Review chờ xử lý</span>
                <strong>{{ flaggedReviews.length }}</strong>
            </div>
            <div class="summary-item">
                <span>Log vi phạm</span>
                <strong>{{ violationLogs.length }}</strong>
            </div>
            <div class="summary-item">
                <span>Mức nghiêm trọng</span>
                <strong>{{ highSeverityCount }}</strong>
            </div>
        </div>

        <div class="moderation-tabs" role="tablist" aria-label="Bộ lọc kiểm duyệt">
            <button :class="{ active: activeTab === 'flagged' }" type="button" @click="activeTab = 'flagged'">
                Review bị gắn cờ
            </button>
            <button :class="{ active: activeTab === 'logs' }" type="button" @click="activeTab = 'logs'">
                Lịch sử vi phạm
            </button>
        </div>

        <section v-if="activeTab === 'flagged'" class="moderation-panel">
            <div class="panel-title">
                <h3>Review cần kiểm tra</h3>
                <span>Duyệt để hiển thị lại, hoặc từ chối để giữ review ở trạng thái bị ẩn.</span>
            </div>

            <div v-if="loading" class="empty-state">Đang tải dữ liệu...</div>
            <div v-else-if="flaggedReviews.length === 0" class="empty-state">Không có review bị gắn cờ.</div>
            <div v-else class="table-responsive">
                <table class="table moderation-table flagged-table align-middle">
                    <thead>
                        <tr>
                            <th>Phim</th>
                            <th>Khách hàng</th>
                            <th>Nội dung</th>
                            <th>Vi phạm</th>
                            <th class="text-end">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="review in flaggedReviews" :key="review.reviewId">
                            <td>
                                <strong>{{ review.movieTitle || "Chưa có phim" }}</strong>
                                <small>{{ formatDate(review.createdAt) }}</small>
                            </td>
                            <td>
                                <strong>{{ review.fullName || "Khách hàng" }}</strong>
                                <small>{{ review.username || "Không có email" }}</small>
                            </td>
                            <td class="review-content">
                                <span class="stars">{{ renderStars(review.rating) }}</span>
                                <p>{{ review.comment || "Không có nội dung" }}</p>
                            </td>
                            <td>
                                <span class="badge-soft" :class="violationClass(review.violationSeverity)">
                                    {{ review.violationType || "OTHER" }}
                                </span>
                                <small>{{ review.violationSeverity || "MEDIUM" }}</small>
                            </td>
                            <td class="action-cell">
                                <div class="action-buttons">
                                    <button
                                        class="action-icon-btn detail"
                                        type="button"
                                        title="Xem chi tiết"
                                        aria-label="Xem chi tiết"
                                        @click="openReviewDetail(review)"
                                    >
                                        <i class="bi bi-eye"></i>
                                    </button>
                                    <button
                                        class="action-icon-btn approve"
                                        type="button"
                                        title="Duyệt"
                                        aria-label="Duyệt"
                                        :disabled="busyReviewId === review.reviewId"
                                        @click="approveReview(review)"
                                    >
                                        <i class="bi bi-check-lg"></i>
                                    </button>
                                    <button
                                        class="action-icon-btn reject"
                                        type="button"
                                        title="Từ chối"
                                        aria-label="Từ chối"
                                        :disabled="busyReviewId === review.reviewId"
                                        @click="rejectReview(review)"
                                    >
                                        <i class="bi bi-x-lg"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <section v-else class="moderation-panel">
            <div class="panel-title">
                <h3>Lịch sử vi phạm</h3>
                <span>Lưu lại hành vi bị gắn cờ để admin theo dõi tài khoản có dấu hiệu spam hoặc tục tĩu.</span>
            </div>

            <div v-if="loading" class="empty-state">Đang tải dữ liệu...</div>
            <div v-else-if="violationLogs.length === 0" class="empty-state">Chưa có log vi phạm.</div>
            <div v-else class="table-responsive">
                <table class="table moderation-table logs-table align-middle">
                    <thead>
                        <tr>
                            <th>Thời gian</th>
                            <th>Khách hàng</th>
                            <th>Phim</th>
                            <th>Nội dung</th>
                            <th>Vi phạm</th>
                            <th>Nguồn</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="log in violationLogs" :key="log.violationLogId">
                            <td>{{ formatDate(log.createdAt) }}</td>
                            <td>
                                <strong>{{ log.fullName || "Khách hàng" }}</strong>
                                <small>{{ log.username || "Không có email" }}</small>
                            </td>
                            <td>{{ log.movieTitle || "Chưa có phim" }}</td>
                            <td class="review-content">
                                <p>{{ log.contentSnapshot || "Không có nội dung" }}</p>
                                <small>{{ log.reason || "Không có lý do chi tiết." }}</small>
                            </td>
                            <td>
                                <span class="badge-soft" :class="violationClass(log.severity)">
                                    {{ log.violationType || "OTHER" }}
                                </span>
                                <small>{{ log.severity || "MEDIUM" }}</small>
                            </td>
                            <td>{{ providerLabel(log.moderationProvider) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <div v-if="selectedReviewDetail" class="detail-modal-backdrop" @click.self="closeReviewDetail">
            <article class="detail-modal" role="dialog" aria-modal="true" aria-labelledby="review-detail-title">
                <header class="detail-modal-header">
                    <div>
                        <p class="section-kicker">Chi tiết review</p>
                        <h3 id="review-detail-title">{{ selectedReviewDetail.movieTitle || "Chưa có phim" }}</h3>
                    </div>
                    <button class="detail-close-btn" type="button" aria-label="Đóng" @click="closeReviewDetail">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </header>

                <div class="detail-grid">
                    <div>
                        <span>Khách hàng</span>
                        <strong>{{ selectedReviewDetail.fullName || "Khách hàng" }}</strong>
                        <small>{{ selectedReviewDetail.username || "Không có email" }}</small>
                    </div>
                    <div>
                        <span>Thời gian</span>
                        <strong>{{ formatDate(selectedReviewDetail.createdAt) }}</strong>
                    </div>
                    <div>
                        <span>Đánh giá</span>
                        <strong class="stars">{{ renderStars(selectedReviewDetail.rating) }}</strong>
                    </div>
                    <div>
                        <span>Vi phạm</span>
                        <strong>{{ selectedReviewDetail.violationType || "OTHER" }}</strong>
                        <small>{{ selectedReviewDetail.violationSeverity || "MEDIUM" }}</small>
                    </div>
                </div>

                <section class="detail-block">
                    <h4>Nội dung bình luận</h4>
                    <p>{{ selectedReviewDetail.comment || "Không có nội dung" }}</p>
                </section>

                <section class="detail-block">
                    <h4>Lý do gắn cờ</h4>
                    <p>{{ selectedReviewDetail.violationReason || "Không có lý do chi tiết." }}</p>
                </section>
            </article>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import api from "@/api";
import { getApiErrorMessage, showCinemaConfirm, showCinemaToast } from "@/utils/cinemaAlert";

const activeTab = ref("flagged");
const loading = ref(false);
const busyReviewId = ref(null);
const flaggedReviews = ref([]);
const violationLogs = ref([]);
const selectedReviewDetail = ref(null);
const testComment = ref("");
const testingModeration = ref(false);
const testLogs = ref([]);

const highSeverityCount = computed(() => {
    return violationLogs.value.filter((log) => String(log.severity || "").toUpperCase() === "HIGH").length;
});

const loadModerationData = async () => {
    loading.value = true;
    try {
        const [reviewsResponse, logsResponse] = await Promise.all([
            api.get("/admin/review-moderation/flagged-reviews"),
            api.get("/admin/review-moderation/violations"),
        ]);
        flaggedReviews.value = Array.isArray(reviewsResponse.data) ? reviewsResponse.data : [];
        violationLogs.value = Array.isArray(logsResponse.data) ? logsResponse.data : [];
    } catch (error) {
        showCinemaToast({
            icon: "error",
            title: "Không tải được dữ liệu",
            text: getApiErrorMessage(error),
        });
    } finally {
        loading.value = false;
    }
};

const approveReview = async (review) => {
    const confirmed = await showCinemaConfirm({
        icon: "question",
        title: "Duyệt đánh giá?",
        text: "Review này sẽ được hiển thị lại cho khách hàng.",
        confirmButtonText: "Duyệt",
    });
    if (!confirmed) return;

    await updateReviewStatus(review, "approve", "Đã duyệt đánh giá");
};

const rejectReview = async (review) => {
    const confirmed = await showCinemaConfirm({
        icon: "warning",
        title: "Từ chối đánh giá?",
        text: "Review này sẽ tiếp tục bị ẩn khỏi trang phim.",
        confirmButtonText: "Từ chối",
    });
    if (!confirmed) return;

    await updateReviewStatus(review, "reject", "Đã từ chối đánh giá");
};

const updateReviewStatus = async (review, action, successTitle) => {
    busyReviewId.value = review.reviewId;
    try {
        await api.post(`/admin/review-moderation/reviews/${review.reviewId}/${action}`);
        showCinemaToast({ icon: "success", title: successTitle });
        await loadModerationData();
    } catch (error) {
        showCinemaToast({
            icon: "error",
            title: "Không thể cập nhật",
            text: getApiErrorMessage(error),
        });
    } finally {
        busyReviewId.value = null;
    }
};

const runModerationTest = async () => {
    const comment = testComment.value.trim();
    if (!comment) return;

    testingModeration.value = true;
    try {
        const { data } = await api.post("/admin/review-moderation/test", { comment });
        testLogs.value = [
            {
                id: `${Date.now()}-${testLogs.value.length}`,
                ...data,
            },
            ...testLogs.value,
        ].slice(0, 6);
    } catch (error) {
        showCinemaToast({
            icon: "error",
            title: "Không thể test bộ lọc",
            text: getApiErrorMessage(error),
        });
    } finally {
        testingModeration.value = false;
    }
};

const clearTestLogs = () => {
    testLogs.value = [];
};

const openReviewDetail = (review) => {
    selectedReviewDetail.value = review;
};

const closeReviewDetail = () => {
    selectedReviewDetail.value = null;
};

const renderStars = (rating) => {
    const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));
    return "★".repeat(safeRating) + "☆".repeat(5 - safeRating);
};

const formatDate = (value) => {
    if (!value) return "Chưa có thời gian";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);
};

const violationClass = (severity) => {
    const normalized = String(severity || "").toUpperCase();
    if (normalized === "HIGH") return "danger";
    if (normalized === "LOW") return "muted";
    return "warning";
};

const providerLabel = (provider) => {
    const normalized = String(provider || "").toUpperCase();
    if (normalized.includes("HTTP_AI")) return "HTTP AI";
    if (normalized.includes("OLLAMA")) return "Ollama";
    if (normalized.includes("LOCAL") || normalized.includes("RULE")) return "Rule";
    if (normalized.includes("ADMIN")) return "Admin";
    return provider || "Không rõ";
};

onMounted(loadModerationData);
</script>

<style scoped>
.moderation-page {
    box-sizing: border-box;
    color: #232323;
    display: flex;
    flex-direction: column;
    gap: 18px;
    min-height: 100%;
    padding: 22px;
}

.moderation-heading {
    align-items: flex-start;
    display: flex;
    gap: 16px;
    justify-content: space-between;
}

.section-kicker {
    color: #ff6b35;
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    margin: 0 0 4px;
    text-transform: uppercase;
}

.moderation-heading h2 {
    font-size: 1.45rem;
    font-weight: 800;
    margin: 0;
}

.moderation-heading span,
.panel-title span {
    color: #6f6f6f;
    display: block;
    margin-top: 4px;
}

.refresh-btn {
    white-space: nowrap;
}

.moderation-test-panel {
    background: #fff;
    border: 1px solid #eaded8;
    border-radius: 12px;
    display: grid;
    gap: 14px;
    grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.9fr);
    padding: 16px;
}

.panel-title-inline {
    align-items: flex-start;
    display: flex;
    gap: 12px;
    justify-content: space-between;
    margin-bottom: 10px;
}

.panel-title-inline h3 {
    font-size: 1.05rem;
    font-weight: 800;
    margin: 0;
}

.test-textarea {
    border-color: #eaded8;
    resize: vertical;
}

.test-textarea:focus {
    border-color: #ff6b35;
    box-shadow: 0 0 0 0.18rem rgba(255, 107, 53, 0.12);
}

.test-actions {
    align-items: center;
    display: flex;
    justify-content: space-between;
    margin-top: 10px;
}

.test-actions small,
.test-log-reason {
    color: #777;
}

.test-log-block {
    background: #fffaf7;
    border: 1px dashed #f1d3c5;
    border-radius: 10px;
    min-height: 146px;
    padding: 10px;
}

.test-empty {
    align-items: center;
    color: #777;
    display: flex;
    height: 100%;
    justify-content: center;
    min-height: 122px;
    text-align: center;
}

.test-log-list {
    display: grid;
    gap: 8px;
    max-height: 220px;
    overflow-y: auto;
    padding-right: 4px;
}

.test-log-item {
    background: #fff;
    border: 1px solid #f0e4de;
    border-radius: 9px;
    padding: 10px 12px;
}

.test-log-head {
    align-items: center;
    display: flex;
    gap: 8px;
    justify-content: space-between;
}

.test-log-comment {
    color: #333;
    line-height: 1.45;
    margin: 8px 0 4px;
    white-space: pre-wrap;
}

.moderation-summary {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(3, minmax(0, 1fr));
}

.summary-item {
    background: #fff7f2;
    border: 1px solid #ffe0d2;
    border-radius: 10px;
    padding: 14px 16px;
}

.summary-item span {
    color: #6f6f6f;
    display: block;
    font-size: 0.88rem;
}

.summary-item strong {
    display: block;
    font-size: 1.45rem;
    line-height: 1.2;
    margin-top: 4px;
}

.moderation-tabs {
    background: #f7f7f7;
    border: 1px solid #e9e9e9;
    border-radius: 10px;
    display: inline-flex;
    gap: 4px;
    padding: 4px;
    width: fit-content;
}

.moderation-tabs button {
    background: transparent;
    border: 0;
    border-radius: 8px;
    color: #5d5d5d;
    font-weight: 700;
    padding: 9px 14px;
}

.moderation-tabs button.active {
    background: #ff6b35;
    color: #fff;
}

.moderation-panel {
    background: #fff;
    border: 1px solid #eaded8;
    border-radius: 12px;
    overflow: hidden;
}

.table-responsive {
    overflow-x: hidden;
}

.panel-title {
    align-items: flex-start;
    background: #fff7f2;
    border-bottom: 1px solid #ffe0d2;
    display: flex;
    gap: 12px;
    justify-content: space-between;
    padding: 16px 18px;
}

.panel-title h3 {
    font-size: 1.05rem;
    font-weight: 800;
    margin: 0;
}

.empty-state {
    color: #666;
    padding: 28px 18px;
    text-align: center;
}

.moderation-table {
    table-layout: fixed;
    margin: 0;
    width: 100%;
}

.moderation-table th {
    background: #fff;
    color: #555;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.02em;
    padding: 11px 14px;
    text-transform: uppercase;
}

.flagged-table th:nth-child(1),
.flagged-table td:nth-child(1) {
    width: 28%;
}

.flagged-table th:nth-child(2),
.flagged-table td:nth-child(2) {
    width: 19%;
}

.flagged-table th:nth-child(3),
.flagged-table td:nth-child(3) {
    width: 23%;
}

.flagged-table th:nth-child(4),
.flagged-table td:nth-child(4) {
    width: 12%;
}

.flagged-table th:nth-child(5),
.flagged-table td:nth-child(5) {
    width: 18%;
}

.logs-table th:nth-child(1),
.logs-table td:nth-child(1) {
    width: 13%;
}

.logs-table th:nth-child(2),
.logs-table td:nth-child(2) {
    width: 18%;
}

.logs-table th:nth-child(3),
.logs-table td:nth-child(3) {
    width: 18%;
}

.logs-table th:nth-child(4),
.logs-table td:nth-child(4) {
    width: 28%;
}

.logs-table th:nth-child(5),
.logs-table td:nth-child(5) {
    width: 12%;
}

.logs-table th:nth-child(6),
.logs-table td:nth-child(6) {
    width: 11%;
}

.moderation-table td {
    border-color: #f0e6e0;
    max-width: none;
    padding: 13px 14px;
    vertical-align: top;
    word-break: break-word;
}

.moderation-table td > strong {
    display: block;
    font-size: 0.95rem;
    line-height: 1.35;
}

.moderation-table small {
    color: #777;
    display: block;
    font-size: 0.82rem;
    margin-top: 4px;
}

.review-content p,
.reason-cell {
    color: #444;
    line-height: 1.45;
    margin: 4px 0 0;
    white-space: pre-wrap;
}

.review-content p {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
}

.stars {
    color: #ff8a00;
    display: inline-block;
    font-size: 0.9rem;
    letter-spacing: 0.04em;
}

.badge-soft {
    border-radius: 999px;
    display: inline-flex;
    font-size: 0.68rem;
    font-weight: 800;
    max-width: 100%;
    overflow: hidden;
    padding: 5px 9px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.badge-soft.danger {
    background: #ffe7e3;
    color: #b42c16;
}

.badge-soft.warning {
    background: #fff0d7;
    color: #8b4c00;
}

.badge-soft.muted {
    background: #efefef;
    color: #555;
}

.action-cell {
    min-width: 0;
    text-align: right;
    white-space: nowrap;
}

.action-buttons {
    display: inline-flex;
    gap: 7px;
    justify-content: flex-end;
    min-width: 0;
}

.action-icon-btn {
    align-items: center;
    border: 1px solid transparent;
    border-radius: 9px;
    display: inline-flex;
    flex: 0 0 32px;
    height: 32px;
    justify-content: center;
    padding: 0;
    transition: 0.2s ease;
    width: 32px;
}

.action-icon-btn:disabled {
    cursor: not-allowed;
    opacity: 0.6;
}

.action-icon-btn.detail {
    background: #f5f5f5;
    border-color: #e0e0e0;
    color: #444;
}

.action-icon-btn.approve {
    background: #ff6b35;
    color: #fff;
}

.action-icon-btn.reject {
    background: #fff;
    border-color: #ff6b35;
    color: #ff6b35;
}

.action-icon-btn:hover:not(:disabled) {
    transform: translateY(-1px);
}

.detail-modal-backdrop {
    align-items: center;
    background: rgba(18, 18, 18, 0.38);
    display: flex;
    inset: 0;
    justify-content: center;
    padding: 20px;
    position: fixed;
    z-index: 1200;
}

.detail-modal {
    background: #fff;
    border: 1px solid #f0d7ca;
    border-radius: 14px;
    box-shadow: 0 18px 50px rgba(0, 0, 0, 0.2);
    max-width: 680px;
    overflow: hidden;
    width: min(680px, 100%);
}

.detail-modal-header {
    align-items: flex-start;
    background: #fff7f2;
    border-bottom: 1px solid #ffe0d2;
    display: flex;
    justify-content: space-between;
    padding: 18px 20px;
}

.detail-modal-header h3 {
    font-size: 1.2rem;
    font-weight: 800;
    margin: 0;
}

.detail-close-btn {
    align-items: center;
    background: #fff;
    border: 1px solid #f0d7ca;
    border-radius: 9px;
    color: #444;
    display: inline-flex;
    height: 34px;
    justify-content: center;
    width: 34px;
}

.detail-grid {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding: 18px 20px 6px;
}

.detail-grid span,
.detail-block h4 {
    color: #777;
    display: block;
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.02em;
    margin: 0 0 4px;
    text-transform: uppercase;
}

.detail-grid strong {
    display: block;
}

.detail-grid small {
    color: #777;
}

.detail-block {
    padding: 12px 20px 18px;
}

.detail-block p {
    background: #fffaf7;
    border: 1px solid #f4dfd5;
    border-radius: 10px;
    color: #333;
    line-height: 1.55;
    margin: 0;
    padding: 12px 14px;
    white-space: pre-wrap;
}

@media (max-width: 768px) {
    .moderation-page {
        padding: 14px;
    }

    .moderation-heading,
    .panel-title {
        display: block;
    }

    .refresh-btn {
        margin-top: 12px;
        width: 100%;
    }

    .moderation-summary {
        grid-template-columns: 1fr;
    }

    .moderation-test-panel {
        grid-template-columns: 1fr;
    }

    .moderation-tabs,
    .moderation-tabs button {
        width: 100%;
    }

    .moderation-tabs {
        display: grid;
        grid-template-columns: 1fr;
    }
}
</style>
