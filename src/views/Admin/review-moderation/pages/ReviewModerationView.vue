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

        <section v-if="showModerationTestPanel" class="moderation-test-panel">
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
                                {{ log.flagged ? violationTitle(log) : "An toàn" }}
                            </span>
                            <small>{{ formatDate(log.checkedAt) }}</small>
                        </div>
                        <p class="test-log-comment">{{ displayText(log.comment) || "(Không có nội dung)" }}</p>
                        <small class="test-log-reason">{{ displayModerationReason(log.reason) }}</small>
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
            <div class="summary-item">
                <span>Tài khoản nghi spam</span>
                <strong>{{ suspiciousUsers.length }}</strong>
            </div>
        </div>

        <div class="moderation-tabs" role="tablist" aria-label="Bộ lọc kiểm duyệt">
            <button :class="{ active: activeTab === 'flagged' }" type="button" @click="activeTab = 'flagged'">
                Review cần kiểm tra
            </button>
            <button :class="{ active: activeTab === 'logs' }" type="button" @click="activeTab = 'logs'">
                Lịch sử vi phạm
            </button>
            <button :class="{ active: activeTab === 'users' }" type="button" @click="activeTab = 'users'">
                Tài khoản nghi spam
            </button>
        </div>

        <section v-if="activeTab === 'flagged'" class="moderation-panel">
            <div class="panel-title">
                <h3>Review cần kiểm tra</h3>
                <span>Báo cáo của khách chỉ đưa review vào hàng chờ; review chỉ bị ẩn khi admin từ chối.</span>
            </div>

            <div v-if="loading" class="empty-state">Đang tải dữ liệu...</div>
            <div v-else-if="flaggedReviews.length === 0" class="empty-state">Không có review cần kiểm tra.</div>
            <div v-else>
                <div class="table-responsive">
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
                            <tr v-for="review in paginatedFlaggedReviews" :key="review.reviewId">
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
                                        {{ violationTitle(review) }}
                                    </span>
                                    <small class="violation-reason-preview">{{ violationMeta(review) }}</small>
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
                                            :title="approveActionLabel(review)"
                                            :aria-label="approveActionLabel(review)"
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
                <AdminPagination
                    v-model="flaggedCurrentPage"
                    v-model:page-size="flaggedPageSize"
                    :total-items="flaggedReviews.length"
                    item-label="review"
                    aria-label="Phân trang review cần kiểm tra"
                />
            </div>
        </section>

        <section v-else-if="activeTab === 'logs'" class="moderation-panel">
            <div class="panel-title">
                <h3>Lịch sử vi phạm</h3>
                <span>Lưu lại hành vi bị gắn cờ để admin theo dõi tài khoản có dấu hiệu spam hoặc tục tĩu.</span>
            </div>

            <div v-if="loading" class="empty-state">Đang tải dữ liệu...</div>
            <div v-else-if="violationLogs.length === 0" class="empty-state">Chưa có log vi phạm.</div>
            <div v-else>
                <div class="table-responsive">
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
                            <tr v-for="log in paginatedViolationLogs" :key="log.violationLogId">
                                <td>{{ formatDate(log.createdAt) }}</td>
                                <td>
                                    <strong>{{ log.fullName || "Khách hàng" }}</strong>
                                    <small>{{ log.username || "Không có email" }}</small>
                                </td>
                                <td>{{ log.movieTitle || "Chưa có phim" }}</td>
                                <td class="review-content">
                                    <p>{{ displayText(log.contentSnapshot) || "Không có nội dung" }}</p>
                                    <small>{{ violationDetailReason(log) }}</small>
                                </td>
                                <td>
                                    <span class="badge-soft" :class="violationClass(log.severity)">
                                        {{ violationTitle(log) }}
                                    </span>
                                    <small class="violation-reason-preview">{{ violationMeta(log) }}</small>
                                </td>
                                <td>{{ providerLabel(log.moderationProvider) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <AdminPagination
                    v-model="logsCurrentPage"
                    v-model:page-size="logsPageSize"
                    :total-items="violationLogs.length"
                    item-label="log"
                    aria-label="Phân trang log vi phạm"
                />
            </div>
        </section>

        <section v-else class="moderation-panel">
            <div class="panel-title">
                <h3>Tài khoản nghi spam</h3>
                <span>Danh sách khách hàng đã đạt ngưỡng chặn bình luận để admin kiểm tra và xử lý tài khoản.</span>
            </div>

            <div v-if="loading" class="empty-state">Đang tải dữ liệu...</div>
            <div v-else-if="suspiciousUsers.length === 0" class="empty-state">
                Chưa có tài khoản nào vượt ngưỡng spam hoặc vi phạm.
            </div>
            <div v-else>
                <div class="table-responsive">
                    <table class="table moderation-table users-table align-middle">
                        <thead>
                            <tr>
                                <th>Khách hàng</th>
                                <th>Vi phạm gần đây</th>
                                <th>Lần cuối</th>
                                <th>Trạng thái</th>
                                <th class="text-end">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="user in paginatedSuspiciousUsers" :key="user.userId">
                                <td>
                                    <strong>{{ user.fullName || "Khách hàng" }}</strong>
                                    <small>{{ user.email || "Không có email" }}</small>
                                </td>
                                <td>
                                    <span class="badge-soft" :class="violationClass(user.riskLevel)">
                                        {{ userRiskLabel(user) }}
                                    </span>
                                    <small>
                                        Spam 24h: {{ user.spamViolations24h || 0 }} /
                                        Vi phạm 7 ngày: {{ user.reviewViolations7d || 0 }}
                                    </small>
                                    <small class="violation-reason-preview">{{ displayModerationReason(user.lastReason) }}</small>
                                </td>
                                <td>
                                    {{ formatDate(user.lastViolationAt) }}
                                    <small>{{ violationTitle({ violationType: user.lastViolationType }) }}</small>
                                </td>
                                <td>
                                    <span class="account-state" :class="user.isActive ? 'active' : 'locked'">
                                        {{ user.isActive ? "Đang hoạt động" : "Đã khóa" }}
                                    </span>
                                    <small class="user-risk-note">{{ user.recommendedAction }}</small>
                                </td>
                                <td class="action-cell">
                                    <div class="action-buttons">
                                        <button
                                            v-if="user.isActive"
                                            class="action-icon-btn reject"
                                            type="button"
                                            title="Khóa tài khoản"
                                            aria-label="Khóa tài khoản"
                                            :disabled="busyUserId === user.userId"
                                            @click="lockSuspiciousUser(user)"
                                        >
                                            <i class="bi bi-lock"></i>
                                        </button>
                                        <button
                                            v-else
                                            class="action-icon-btn approve"
                                            type="button"
                                            title="Mở khóa tài khoản"
                                            aria-label="Mở khóa tài khoản"
                                            :disabled="busyUserId === user.userId"
                                            @click="unlockSuspiciousUser(user)"
                                        >
                                            <i class="bi bi-unlock"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <AdminPagination
                    v-model="usersCurrentPage"
                    v-model:page-size="usersPageSize"
                    :total-items="suspiciousUsers.length"
                    item-label="tài khoản"
                    aria-label="Phân trang tài khoản nghi spam"
                />
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
                        <strong>{{ violationTitle(selectedReviewDetail) }}</strong>
                        <small>{{ severityLabel(selectedReviewDetail.violationSeverity) }}</small>
                    </div>
                </div>

                <section class="detail-block">
                    <h4>Nội dung bình luận</h4>
                    <p>{{ displayText(selectedReviewDetail.comment) || "Không có nội dung" }}</p>
                </section>

                <section class="detail-block">
                    <h4>Lý do gắn cờ</h4>
                    <p>{{ violationDetailReason(selectedReviewDetail) }}</p>
                </section>
            </article>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import api from "@/api";
import AdminPagination from "@/views/Admin/components/AdminPagination.vue";
import { getApiErrorMessage, showCinemaConfirm, showCinemaToast } from "@/utils/cinemaAlert";

const showModerationTestPanel = false;
const activeTab = ref("flagged");
const loading = ref(false);
const busyReviewId = ref(null);
const busyUserId = ref(null);
const flaggedReviews = ref([]);
const violationLogs = ref([]);
const suspiciousUsers = ref([]);
const flaggedCurrentPage = ref(1);
const flaggedPageSize = ref(10);
const logsCurrentPage = ref(1);
const logsPageSize = ref(10);
const usersCurrentPage = ref(1);
const usersPageSize = ref(10);
const selectedReviewDetail = ref(null);
const testComment = ref("");
const testingModeration = ref(false);
const testLogs = ref([]);

const highSeverityCount = computed(() => {
    return violationLogs.value.filter((log) => String(log.severity || "").toUpperCase() === "HIGH").length;
});

const flaggedTotalPages = computed(() => Math.max(1, Math.ceil(flaggedReviews.value.length / flaggedPageSize.value)));
const logsTotalPages = computed(() => Math.max(1, Math.ceil(violationLogs.value.length / logsPageSize.value)));
const usersTotalPages = computed(() => Math.max(1, Math.ceil(suspiciousUsers.value.length / usersPageSize.value)));

const paginatedFlaggedReviews = computed(() => {
    const start = (flaggedCurrentPage.value - 1) * flaggedPageSize.value;
    return flaggedReviews.value.slice(start, start + flaggedPageSize.value);
});

const paginatedViolationLogs = computed(() => {
    const start = (logsCurrentPage.value - 1) * logsPageSize.value;
    return violationLogs.value.slice(start, start + logsPageSize.value);
});

const paginatedSuspiciousUsers = computed(() => {
    const start = (usersCurrentPage.value - 1) * usersPageSize.value;
    return suspiciousUsers.value.slice(start, start + usersPageSize.value);
});

watch([flaggedPageSize, flaggedTotalPages], () => {
    if (flaggedCurrentPage.value > flaggedTotalPages.value) {
        flaggedCurrentPage.value = flaggedTotalPages.value;
    }
});

watch([logsPageSize, logsTotalPages], () => {
    if (logsCurrentPage.value > logsTotalPages.value) {
        logsCurrentPage.value = logsTotalPages.value;
    }
});

watch([usersPageSize, usersTotalPages], () => {
    if (usersCurrentPage.value > usersTotalPages.value) {
        usersCurrentPage.value = usersTotalPages.value;
    }
});

const loadModerationData = async () => {
    loading.value = true;
    try {
        const [reviewsResponse, logsResponse, usersResponse] = await Promise.all([
            api.get("/admin/review-moderation/flagged-reviews"),
            api.get("/admin/review-moderation/violations"),
            api.get("/admin/review-moderation/suspicious-users"),
        ]);
        flaggedReviews.value = Array.isArray(reviewsResponse.data) ? reviewsResponse.data : [];
        violationLogs.value = Array.isArray(logsResponse.data) ? logsResponse.data : [];
        suspiciousUsers.value = Array.isArray(usersResponse.data) ? usersResponse.data : [];
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

const lockSuspiciousUser = async (user) => {
    const confirmed = await showCinemaConfirm({
        icon: "warning",
        title: "Khóa tài khoản?",
        text: `Tài khoản "${user.email || user.fullName || "khách hàng"}" sẽ không thể đăng nhập sau khi bị khóa.`,
        confirmButtonText: "Khóa tài khoản",
    });
    if (!confirmed) return;

    await updateSuspiciousUserStatus(user, "lock", "Đã khóa tài khoản");
};

const unlockSuspiciousUser = async (user) => {
    const confirmed = await showCinemaConfirm({
        icon: "question",
        title: "Mở khóa tài khoản?",
        text: `Tài khoản "${user.email || user.fullName || "khách hàng"}" sẽ được đăng nhập trở lại.`,
        confirmButtonText: "Mở khóa",
    });
    if (!confirmed) return;

    await updateSuspiciousUserStatus(user, "unlock", "Đã mở khóa tài khoản");
};

const updateSuspiciousUserStatus = async (user, action, successTitle) => {
    busyUserId.value = user.userId;
    try {
        await api.put(`/admin/users/${user.userId}/${action}`);
        showCinemaToast({ icon: "success", title: successTitle });
        await loadModerationData();
    } catch (error) {
        showCinemaToast({
            icon: "error",
            title: "Không thể cập nhật tài khoản",
            text: getApiErrorMessage(error),
        });
    } finally {
        busyUserId.value = null;
    }
};

const approveReview = async (review) => {
    const isReport = isUserReport(review);
    const confirmed = await showCinemaConfirm({
        icon: "question",
        title: isReport ? "Bỏ qua báo cáo?" : "Duyệt đánh giá?",
        text: isReport
            ? "Review này vẫn đang hiển thị. Báo cáo sẽ được đóng và review được giữ lại trên trang phim."
            : "Review này sẽ được hiển thị lại cho khách hàng.",
        confirmButtonText: isReport ? "Giữ hiển thị" : "Duyệt",
    });
    if (!confirmed) return;

    await updateReviewStatus(review, "approve", isReport ? "Đã bỏ qua báo cáo" : "Đã duyệt đánh giá");
};

const rejectReview = async (review) => {
    const isReport = isUserReport(review);
    const confirmed = await showCinemaConfirm({
        icon: "warning",
        title: isReport ? "Ẩn review này?" : "Từ chối đánh giá?",
        text: isReport
            ? "Admin xác nhận review không phù hợp và review sẽ bị ẩn khỏi trang phim."
            : "Review này sẽ tiếp tục bị ẩn khỏi trang phim.",
        confirmButtonText: isReport ? "Ẩn review" : "Từ chối",
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

const cp1252Bytes = new Map([
    [0x20ac, 0x80],
    [0x201a, 0x82],
    [0x0192, 0x83],
    [0x201e, 0x84],
    [0x2026, 0x85],
    [0x2020, 0x86],
    [0x2021, 0x87],
    [0x02c6, 0x88],
    [0x2030, 0x89],
    [0x0160, 0x8a],
    [0x2039, 0x8b],
    [0x0152, 0x8c],
    [0x017d, 0x8e],
    [0x2018, 0x91],
    [0x2019, 0x92],
    [0x201c, 0x93],
    [0x201d, 0x94],
    [0x2022, 0x95],
    [0x2013, 0x96],
    [0x2014, 0x97],
    [0x02dc, 0x98],
    [0x2122, 0x99],
    [0x0161, 0x9a],
    [0x203a, 0x9b],
    [0x0153, 0x9c],
    [0x017e, 0x9e],
    [0x0178, 0x9f],
]);

const replacementCharacter = String.fromCharCode(65533);
const brokenVietnameseLetter = `[${replacementCharacter}?]`;

const repairMojibake = (value) => {
    if (typeof value !== "string" || value.length === 0) {
        return value;
    }

    const bytes = [];
    for (const char of value) {
        const codePoint = char.codePointAt(0);
        if (codePoint <= 0xff) {
            bytes.push(codePoint);
        } else if (cp1252Bytes.has(codePoint)) {
            bytes.push(cp1252Bytes.get(codePoint));
        } else {
            return value;
        }
    }

    const decoded = new TextDecoder("utf-8").decode(Uint8Array.from(bytes));
    if (decoded === value || decoded.includes(replacementCharacter)) {
        return value;
    }
    return repairMojibake(decoded);
};

const displayText = (value) => repairMojibake(value || "");

const cleanBrokenVietnamese = (value) => {
    if (!value) return "";

    return value
        .replace(new RegExp(`B${brokenVietnameseLetter}nh lu${brokenVietnameseLetter}n`, "gi"), "Bình luận")
        .replace(new RegExp(`b${brokenVietnameseLetter}nh lu${brokenVietnameseLetter}n`, "gi"), "bình luận")
        .replace(new RegExp(`kh${brokenVietnameseLetter}ng`, "gi"), "không")
        .replace(new RegExp(`r${brokenVietnameseLetter}\\s+r${brokenVietnameseLetter}ng`, "gi"), "rõ ràng")
        .replace(new RegExp(`r${brokenVietnameseLetter}ng`, "gi"), "ràng")
        .replace(new RegExp(`r${brokenVietnameseLetter}`, "gi"), "rõ")
        .replace(new RegExp(`l${brokenVietnameseLetter}\\s+do`, "gi"), "lý do")
        .replace(new RegExp(`c${brokenVietnameseLetter}\\s+th${brokenVietnameseLetter}`, "gi"), "cụ thể")
        .replace(new RegExp(`kh${brokenVietnameseLetter}ch h${brokenVietnameseLetter}ng`, "gi"), "khách hàng")
        .replace(new RegExp(`b${brokenVietnameseLetter}o c${brokenVietnameseLetter}o`, "gi"), "báo cáo");
};

const extractUserReportReason = (value) => {
    const text = cleanBrokenVietnamese(displayText(value).trim());
    if (!text) return "";

    const parenthesizedReporterMatch = text.match(/\)\s*:\s*(.+)$/);
    if (parenthesizedReporterMatch?.[1]) {
        return cleanBrokenVietnamese(parenthesizedReporterMatch[1].trim());
    }

    const customerReportMatch = text.match(/khách hàng\s+.+?\s+báo cáo\s*:\s*(.+)$/i);
    if (customerReportMatch?.[1]) {
        return cleanBrokenVietnamese(customerReportMatch[1].trim());
    }

    return text;
};

const violationTypeLabels = {
    USER_REPORT: "Khách hàng báo cáo",
    PROFANITY: "Ngôn từ không phù hợp",
    HARASSMENT: "Quấy rối",
    HATE: "Ngôn từ thù ghét",
    HATE_SPEECH: "Ngôn từ thù ghét",
    THREAT: "Đe dọa",
    SCAM: "Lừa đảo",
    SEXUAL: "Nội dung nhạy cảm",
    VIOLENCE: "Bạo lực",
    SPAM: "Spam/quảng cáo",
    OTHER: "Khác",
};

const severityLabels = {
    HIGH: "Nghiêm trọng",
    MEDIUM: "Trung bình",
    LOW: "Nhẹ",
};

const severityLabel = (severity) => {
    const normalized = String(severity || "MEDIUM").toUpperCase();
    return severityLabels[normalized] || normalized;
};

const userRiskLabel = (user) => {
    if ((Number(user?.spamViolations24h) || 0) >= 3) {
        return "Spam quá ngưỡng";
    }
    return "Nhiều vi phạm";
};

const formatKeywordLabel = (value) => {
    return String(value || "OTHER")
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
        .join(" ");
};

const violationTitle = (item) => {
    const type = String(item?.violationType || "").toUpperCase();
    return violationTypeLabels[type] || formatKeywordLabel(type);
};

const knownReasonTranslations = {
    "visobert-hsd detected hate, severe attack, or threat signals.":
        "Phát hiện bình luận có dấu hiệu thù ghét, công kích nghiêm trọng hoặc đe dọa.",
    "visobert-hsd detected offensive or inappropriate language signals.":
        "Phát hiện bình luận có dấu hiệu xúc phạm hoặc dùng ngôn từ không phù hợp.",
    "visobert-hsd did not detect clear violation signals.":
        "Không phát hiện dấu hiệu vi phạm rõ ràng.",
    "review contains link, domain, or phone number signals.":
        "Bình luận có dấu hiệu chứa liên kết, tên miền hoặc số điện thoại.",
    "empty review or no content to moderate.":
        "Bình luận rỗng hoặc không có nội dung cần kiểm duyệt.",
};

const hideModerationProviderName = (value) => {
    return value.replace(/^ViSoBERT-HSD\s+/i, "");
};

const displayModerationReason = (value) => {
    const text = cleanBrokenVietnamese(displayText(value).trim());
    if (!text) return "";
    return hideModerationProviderName(knownReasonTranslations[text.toLowerCase()] || text);
};

const isUserReport = (item) => {
    return String(item?.violationType || "").toUpperCase() === "USER_REPORT";
};

const approveActionLabel = (item) => {
    return isUserReport(item) ? "Giữ hiển thị" : "Duyệt";
};

const shortenText = (value, maxLength = 120) => {
    const text = displayText(value).trim();
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength - 3)}...`;
};

const violationDetailReason = (item) => {
    const rawReason = item?.violationReason || item?.reason;
    const reason = isUserReport(item) ? extractUserReportReason(rawReason) : displayModerationReason(rawReason);
    return reason || "Không có lý do chi tiết.";
};

const violationMeta = (item) => {
    const reason = violationDetailReason(item);
    if (reason !== "Không có lý do chi tiết.") {
        return shortenText(reason);
    }
    return severityLabel(item?.violationSeverity || item?.severity);
};

const violationClass = (severity) => {
    const normalized = String(severity || "").toUpperCase();
    if (normalized === "HIGH") return "danger";
    if (normalized === "LOW") return "muted";
    return "warning";
};

const providerLabel = (provider) => {
    const normalized = String(provider || "").toUpperCase();
    if (normalized.includes("USER_REPORT")) return "Khách hàng";
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
    grid-template-columns: repeat(4, minmax(0, 1fr));
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

.users-table th:nth-child(1),
.users-table td:nth-child(1) {
    width: 22%;
}

.users-table th:nth-child(2),
.users-table td:nth-child(2) {
    width: 30%;
}

.users-table th:nth-child(3),
.users-table td:nth-child(3) {
    width: 16%;
}

.users-table th:nth-child(4),
.users-table td:nth-child(4) {
    width: 20%;
}

.users-table th:nth-child(5),
.users-table td:nth-child(5) {
    width: 12%;
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

.moderation-table small.violation-reason-preview {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-height: 1.35;
    overflow: hidden;
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

.account-state {
    border-radius: 999px;
    display: inline-flex;
    font-size: 0.72rem;
    font-weight: 800;
    padding: 5px 9px;
}

.account-state.active {
    background: #e6f6ec;
    color: #176f3a;
}

.account-state.locked {
    background: #ffe7e3;
    color: #b42c16;
}

.user-risk-note {
    line-height: 1.35;
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
