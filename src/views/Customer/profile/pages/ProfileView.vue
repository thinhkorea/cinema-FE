<template>
    <div class="profile-page">
        <!-- Back Button -->
        <div class="container pt-4">
            <div class="back-button-container mb-4">
                <button @click="goHome" class="btn-back">
                    <i class="bi bi-arrow-left"></i>
                    <span>Quay lại trang chủ</span>
                </button>
            </div>
        </div>

        <div class="container pb-5">
            <!-- Page Header -->
            <div class="page-header text-center mb-5">
                <h1 class="page-title">
                    <i class="bi bi-person-circle me-3"></i>
                    Hồ sơ cá nhân
                </h1>
                <p class="page-subtitle">Quản lý thông tin tài khoản và điểm tích lũy của bạn</p>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="loading-state">
                <div class="loading-spinner"></div>
                <p class="loading-text">Đang tải thông tin hồ sơ...</p>
            </div>

            <!-- Profile Content -->
            <div v-else class="profile-content">
                <div class="profile-summary-grid">
                <!-- Loyalty Points Card -->
                <div>
                    <div class="loyalty-card h-100">
                        <div class="loyalty-header">
                            <div class="loyalty-icon">
                                <i class="bi bi-gem"></i>
                            </div>
                        </div>

                        <div class="loyalty-body">
                            <h6 class="loyalty-title">ĐIỂM TÍCH LŨY</h6>
                            <div class="points-display">
                                <div class="points-number">{{ profile.loyaltyPoints || 0 }}</div>
                                <div class="points-label">điểm</div>
                            </div>

                            <div class="points-info">
                                <div class="info-row">
                                    <span class="info-label">Giá trị giảm:</span>
                                    <span class="info-value"
                                        >{{ ((profile.loyaltyPoints || 0) * 1000).toLocaleString() }}đ</span
                                    >
                                </div>
                                <div class="info-row">
                                    <span class="info-label">Hết hạn điểm:</span>
                                    <span class="info-value">
                                        {{ nextExpiryDate || "Không có điểm sắp hết hạn" }}
                                    </span>
                                </div>
                                <div class="exchange-info">
                                    <i class="bi bi-info-circle me-2"></i>
                                    <span>Tích: 20.000đ = 1 điểm</span>
                                    <br />
                                    <i class="bi bi-info-circle me-2"></i>
                                    <span>Đổi: 1 điểm = 1.000đ</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Spending Milestone Card -->
                <div>
                    <div class="spending-card h-100">
                        <div class="spending-header">
                            <div class="spending-icon">
                                <i class="bi bi-wallet2"></i>
                            </div>
                        </div>

                        <div class="spending-body">
                            <h6 class="spending-title">MỨC CHI TIÊU</h6>
                            <div class="spending-display">
                                <div class="spending-number">{{ formatCurrency(totalSpent) }}</div>
                                <div class="spending-label">
                                    đã thanh toán trong {{ formatWindowYears(profileSpendingWindowDays, profile.spendingYear) }}
                                </div>
                            </div>

                            <div class="spending-info">
                                <div class="info-row">
                                    <span class="info-label">Mốc tiếp theo:</span>
                                    <span class="info-value">
                                        {{ nextSpendMilestone ? formatCurrency(nextSpendMilestone) : "Đã đạt mốc cao nhất" }}
                                    </span>
                                </div>
                                <div class="info-row">
                                    <span class="info-label">Còn thiếu:</span>
                                    <span class="info-value">
                                        {{ nextSpendMilestone ? formatCurrency(remainingToNextMilestone) : "0đ" }}
                                    </span>
                                </div>
                                <div class="spending-progress">
                                    <div class="spending-progress-bar" :style="{ width: `${spendingProgress}%` }"></div>
                                </div>
                                <div class="exchange-info">
                                    <i class="bi bi-info-circle me-2"></i>
                                    <span>Voucher tự xuất hiện khi bạn đạt mốc chi tiêu.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                </div>

                <!-- Personal Information Card -->
                <div class="profile-main-grid">
                    <div class="info-card">
                        <div class="card-header">
                            <i class="bi bi-person-gear me-2"></i>
                            <span>Thông tin cá nhân</span>
                        </div>

                        <form @submit.prevent="updateProfile" class="card-body">
                            <div class="form-grid">
                                <div class="form-group">
                                    <label class="form-label">
                                        <i class="bi bi-person"></i>
                                        Họ và tên
                                    </label>
                                    <input
                                        v-model="profile.user.fullName"
                                        class="form-input"
                                        placeholder="Nhập họ và tên đầy đủ"
                                        required
                                    />
                                </div>

                                <div class="form-group">
                                    <label class="form-label">
                                        <i class="bi bi-envelope"></i>
                                        Email
                                    </label>
                                    <input
                                        v-model="profile.user.email"
                                        type="email"
                                        class="form-input"
                                        placeholder="example@email.com"
                                        required
                                    />
                                </div>

                                <div class="form-group">
                                    <label class="form-label">
                                        <i class="bi bi-telephone"></i>
                                        Số điện thoại
                                    </label>
                                    <input
                                        v-model="profile.user.phone"
                                        class="form-input"
                                        placeholder="0123 456 789"
                                        pattern="[0-9\s\-\+\(\)]+"
                                    />
                                </div>

                                <div class="form-group">
                                    <label class="form-label">
                                        <i class="bi bi-gender-ambiguous"></i>
                                        Giới tính
                                    </label>
                                    <select v-model="profile.gender" class="form-select">
                                        <option value="">-- Chọn giới tính --</option>
                                        <option value="MALE">Nam</option>
                                        <option value="FEMALE">Nữ</option>
                                    </select>
                                </div>

                                <div class="form-group full-width">
                                    <label class="form-label">
                                        <i class="bi bi-geo-alt"></i>
                                        Địa chỉ
                                    </label>
                                    <input
                                        v-model="profile.address"
                                        class="form-input"
                                        placeholder="Nhập địa chỉ của bạn"
                                    />
                                </div>
                            </div>

                            <div class="form-actions">
                                <button type="submit" class="btn-primary">
                                    <i class="bi bi-check-circle"></i>
                                    <span>Lưu thay đổi</span>
                                </button>
                            </div>
                        </form>
                    </div>

                    <div class="voucher-card">
                        <div class="card-header">
                            <i class="bi bi-ticket-perforated me-2"></i>
                            <span>Voucher của bạn</span>
                        </div>

                        <div class="voucher-card-body">
                            <div v-if="voucherLoading" class="voucher-loading">Đang tải voucher...</div>
                            <div v-else-if="voucherGroups.length" class="voucher-groups">
                                <div v-for="group in voucherGroups" :key="group.key" class="voucher-group">
                                    <div class="voucher-section-title">{{ group.title }}</div>
                                    <div class="my-voucher-list">
                                        <div
                                            v-for="voucher in group.vouchers"
                                            :key="voucher.code"
                                            class="my-voucher-item"
                                            :class="{ locked: !voucher.eligible }"
                                        >
                                            <div class="my-voucher-main">
                                                <div>
                                                    <div class="my-voucher-code">{{ voucher.code }}</div>
                                                    <div class="my-voucher-name">{{ voucher.name }}</div>
                                                </div>
                                                <span
                                                    class="my-voucher-status"
                                                    :class="{ eligible: voucher.claimed }"
                                                >
                                                    {{ getVoucherStatusText(voucher) }}
                                                </span>
                                            </div>

                                            <div class="my-voucher-desc">
                                                {{ formatVoucherValue(voucher) }}
                                                <span v-if="voucher.minOrder">
                                                    - Đơn từ {{ formatCurrency(voucher.minOrder) }}
                                                </span>
                                            </div>

                                            <div v-if="voucher.requiredTotalSpent" class="my-voucher-progress">
                                                <div class="progress-text">
                                                    <span>
                                                        Đã tiêu {{ formatCurrency(voucher.currentTotalSpent) }} /
                                                        {{ formatCurrency(voucher.requiredTotalSpent) }}
                                                    </span>
                                                    <strong>{{ formatWindowYears(voucher.spendingWindowDays, profile.spendingYear) }}</strong>
                                                </div>
                                                <div class="spending-progress slim">
                                                    <div
                                                        class="spending-progress-bar"
                                                        :style="{ width: `${getVoucherProgress(voucher)}%` }"
                                                    ></div>
                                                </div>
                                        <div v-if="!voucher.eligible" class="voucher-remaining">
                                            Còn thiếu {{ formatCurrency(voucher.remainingAmount) }}
                                        </div>
                                    </div>

                                    <div v-if="voucher.reason" class="my-voucher-reason">
                                        {{ voucher.reason }}
                                    </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div v-else class="voucher-empty-state">
                                Chưa có voucher nào khả dụng. Khi đạt mốc chi tiêu, voucher sẽ tự xuất hiện tại đây.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth.store";
import api from "@/api";
import { useRouter } from "vue-router";
import { showCinemaAlert } from "@/utils/cinemaAlert";

const router = useRouter();
const auth = useAuthStore();
const profile = ref({ user: {} });
const loading = ref(true);
const loyalty = ref({ availablePoints: 0, transactions: [] });
const nextExpiryDate = ref("");
const myVouchers = ref([]);
const voucherLoading = ref(false);
const fallbackSpendMilestones = [500000, 1000000, 2000000];

const totalSpent = computed(() => Number(profile.value.totalSpent || 0));
const profileSpendingWindowDays = computed(() => Number(profile.value.spendingWindowDays || 365));
const getMilestoneAmount = (voucher) => Number(voucher.requiredTotalSpent || 0);
const spendingVouchers = computed(() => myVouchers.value.filter((voucher) => getMilestoneAmount(voucher) > 0));
const ownedSpendingVouchers = computed(() => spendingVouchers.value.filter((voucher) => voucher.claimed && voucher.eligible));
const highestOwnedMilestone = computed(() => {
    return ownedSpendingVouchers.value.reduce((highest, voucher) => {
        return Math.max(highest, getMilestoneAmount(voucher));
    }, 0);
});
const ownedVouchers = computed(() =>
    myVouchers.value.filter((voucher) => {
        if (!voucher.claimed || !voucher.eligible) return false;
        const milestone = getMilestoneAmount(voucher);
        return !milestone || milestone === highestOwnedMilestone.value;
    }),
);
const allUpcomingSpendingVouchers = computed(() =>
    spendingVouchers.value.filter((voucher) => !voucher.claimed),
);
const nextUpcomingMilestone = computed(() => {
    return allUpcomingSpendingVouchers.value.reduce((next, voucher) => {
        const milestone = getMilestoneAmount(voucher);
        if (!milestone) return next;
        return next === null || milestone < next ? milestone : next;
    }, null);
});
const upcomingSpendingVouchers = computed(() =>
    allUpcomingSpendingVouchers.value.filter((voucher) => getMilestoneAmount(voucher) === nextUpcomingMilestone.value),
);
const voucherGroups = computed(() =>
    [
        { key: "owned", title: "Voucher đã có", vouchers: ownedVouchers.value },
        { key: "upcoming", title: "Sắp nhận theo mốc chi tiêu", vouchers: upcomingSpendingVouchers.value },
    ].filter((group) => group.vouchers.length),
);
const spendMilestones = computed(() => {
    const milestones = spendingVouchers.value
        .filter((voucher) => {
            return (
                voucher.requiredTotalSpent &&
                Number(voucher.spendingWindowDays || 365) === profileSpendingWindowDays.value
            );
        })
        .map((voucher) => Number(voucher.requiredTotalSpent))
        .filter((value) => value > 0);

    const unique = [...new Set(milestones)].sort((a, b) => a - b);
    return unique.length ? unique : fallbackSpendMilestones;
});
const nextSpendMilestone = computed(() => spendMilestones.value.find((milestone) => totalSpent.value < milestone) || null);
const remainingToNextMilestone = computed(() => {
    return nextSpendMilestone.value ? Math.max(0, nextSpendMilestone.value - totalSpent.value) : 0;
});
const spendingProgress = computed(() => {
    if (!nextSpendMilestone.value) return 100;
    const previousMilestone =
        [...spendMilestones.value].reverse().find((milestone) => milestone < nextSpendMilestone.value) || 0;
    const span = nextSpendMilestone.value - previousMilestone;
    const progress = ((totalSpent.value - previousMilestone) / span) * 100;
    return Math.min(100, Math.max(0, progress));
});

const goHome = () => router.push("/");

onMounted(async () => {
    try {
        const userId = auth.userId || localStorage.getItem("userId");

        if (!userId) {
            await showCinemaAlert({
                icon: "info",
                title: "Cần đăng nhập",
                text: "Bạn cần đăng nhập để xem hồ sơ.",
            });
            router.push("/login");
            return;
        }

        const res = await api.get(`/auth/profile/${userId}`);
        profile.value = res.data;
        profile.value.user = profile.value.user || {};
        profile.value.user.email = profile.value.user.email || profile.value.email || "";
        profile.value.user.phone = profile.value.user.phone || profile.value.phone || "";
        await Promise.all([loadLoyalty(), loadMyVouchers()]);
    } catch (err) {
        console.error(err);
        await showCinemaAlert({
            icon: "error",
            title: "Không thể tải hồ sơ",
            text: "Vui lòng thử lại sau ít phút.",
        });
    } finally {
        loading.value = false;
    }
});

const loadLoyalty = async () => {
    try {
        const { data } = await api.get("/loyalty/my-points");
        loyalty.value = data || { availablePoints: 0, transactions: [] };
        nextExpiryDate.value = getNearestExpiryDate(loyalty.value.transactions || []);
    } catch (err) {
        console.error("Loyalty load failed:", err);
        nextExpiryDate.value = "Không thể tải hạn điểm";
    }
};

const getNearestExpiryDate = (transactions) => {
    const candidates = transactions
        .filter((t) => t && t.expiredAt && t.expired === false)
        .map((t) => new Date(t.expiredAt))
        .filter((d) => Number.isFinite(d.getTime()));

    if (!candidates.length) return "";
    candidates.sort((a, b) => a.getTime() - b.getTime());
    return formatDate(candidates[0]);
};

const formatDate = (date) => {
    return new Date(date).toLocaleDateString("vi-VN");
};

const loadMyVouchers = async () => {
    try {
        voucherLoading.value = true;
        const { data } = await api.get("/vouchers/my");
        myVouchers.value = Array.isArray(data) ? data : [];
    } catch (err) {
        console.error("Voucher load failed:", err);
        myVouchers.value = [];
    } finally {
        voucherLoading.value = false;
    }
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(amount || 0);
};

const formatWindowYears = (days, year = new Date().getFullYear()) => {
    const endYear = Number(year || new Date().getFullYear());
    const years = Math.max(1, Math.round(Number(days || 365) / 365));
    const startYear = endYear - years + 1;
    if (years === 1) return `năm ${endYear}`;
    return `từ năm ${startYear} đến năm ${endYear}`;
};

const formatVoucherValue = (voucher) => {
    if (voucher.type === "PERCENT") {
        const maxDiscount = voucher.maxDiscount ? `, tối đa ${formatCurrency(voucher.maxDiscount)}` : "";
        return `Giảm ${voucher.value || 0}%${maxDiscount}`;
    }

    return `Giảm ${formatCurrency(voucher.value || 0)}`;
};

const getVoucherProgress = (voucher) => {
    const required = Number(voucher.requiredTotalSpent || 0);
    if (!required) return 100;
    const current = Number(voucher.currentTotalSpent || 0);
    return Math.min(100, Math.max(0, (current / required) * 100));
};

const getVoucherStatusText = (voucher) => {
    if (voucher.claimed) return "Đã có";
    return "Sắp nhận";
};

const updateProfile = async () => {
    try {
        const userId = auth.userId || localStorage.getItem("userId");

        if (!userId) {
            await showCinemaAlert({
                icon: "warning",
                title: "Không xác định được người dùng",
                text: "Vui lòng đăng nhập lại.",
            });
            return;
        }

        await api.put(`/auth/profile/${userId}`, profile.value);

        await showCinemaAlert({
            icon: "success",
            title: "Cập nhật thành công!",
            text: "Hồ sơ của bạn đã được lưu.",
            timer: 1500,
        });

        router.push("/");
    } catch (err) {
        console.error(err);
        await showCinemaAlert({
            icon: "error",
            title: "Cập nhật thất bại",
            text: "Vui lòng thử lại sau ít phút.",
        });
    }
};
</script>

<style scoped>
/* Global Styling */
.profile-page {
    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
    min-height: 100vh;
    color: #ffffff;
}

.container {
    max-width: 1000px;
}

/* Back Button */
.back-button-container {
    display: flex;
    justify-content: flex-start;
}

.btn-back {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.8rem 1.5rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    color: #fff;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
}

.btn-back:hover {
    background: rgba(255, 215, 0, 0.2);
    border-color: rgba(255, 215, 0, 0.3);
    color: #ffd700;
    transform: translateX(-2px);
}

.btn-back i {
    font-size: 1.1rem;
}

/* Page Header */
.page-header {
    margin-bottom: 3rem;
}

.page-title {
    font-size: 2.5rem;
    font-weight: 700;
    color: #ffd700;
    margin-bottom: 1rem;
    text-shadow: 0 4px 8px rgba(255, 215, 0, 0.3);
}

.page-subtitle {
    font-size: 1.1rem;
    color: #ccc;
    margin: 0;
}

/* Loading State */
.loading-state {
    text-align: center;
    padding: 4rem 0;
}

.loading-spinner {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(255, 215, 0, 0.2);
    border-top-color: #ffd700;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1.5rem;
}

.loading-text {
    color: #ccc;
    font-size: 1.1rem;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* Profile Content */
.container {
    max-width: 1120px;
}

.profile-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.profile-summary-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.5rem;
    align-items: stretch;
}

.profile-summary-grid > div {
    display: flex;
}

.profile-main-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.5rem;
    align-items: start;
}

.loyalty-card {
    background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(255, 215, 0, 0.3);
    color: #000;
    transition:
        transform 0.3s ease,
        box-shadow 0.3s ease;
}

.loyalty-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 25px 50px rgba(255, 215, 0, 0.4);
}

.spending-card {
    background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(17, 24, 39, 0.3);
    color: #fff;
    transition:
        transform 0.3s ease,
        box-shadow 0.3s ease;
}

.spending-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 25px 50px rgba(17, 24, 39, 0.38);
}

.loyalty-header {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1.5rem;
    background: rgba(0, 0, 0, 0.1);
}

.spending-header {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1.5rem;
    background: rgba(255, 255, 255, 0.08);
}

.loyalty-icon i {
    font-size: 3rem;
    color: #000;
}

.spending-icon i {
    font-size: 3rem;
    color: #ffd700;
}

.loyalty-body {
    padding: 1.5rem;
}

.spending-body {
    padding: 1.5rem;
}

.loyalty-title {
    text-align: center;
    font-size: 0.9rem;
    font-weight: 600;
    color: #000;
    opacity: 0.8;
    letter-spacing: 1px;
    margin-bottom: 1rem;
}

.spending-title {
    text-align: center;
    font-size: 0.9rem;
    font-weight: 600;
    color: #fff;
    opacity: 0.86;
    letter-spacing: 1px;
    margin-bottom: 1rem;
}

.points-display {
    text-align: center;
    margin-bottom: 2rem;
}

.spending-display {
    text-align: center;
    margin-bottom: 2rem;
}

.points-number {
    font-size: 4rem;
    font-weight: 700;
    color: #000;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    line-height: 1;
}

.spending-number {
    font-size: 2rem;
    font-weight: 800;
    color: #ffd700;
    line-height: 1.2;
}

.points-label {
    font-size: 1rem;
    font-weight: 600;
    color: #000;
    opacity: 0.8;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.spending-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #fff;
    opacity: 0.74;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.points-info {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    padding: 1.5rem;
}

.spending-info {
    background: rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 1.5rem;
}

.spending-progress {
    height: 8px;
    background: rgba(255, 255, 255, 0.18);
    border-radius: 999px;
    overflow: hidden;
    margin: 1rem 0;
}

.spending-progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #ffd700, #ffed4e);
    border-radius: inherit;
    transition: width 0.3s ease;
}

.spending-info .info-label,
.spending-info .info-value,
.spending-info .exchange-info {
    color: #fff;
}

.info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.info-row:last-child {
    margin-bottom: 0;
}

.info-label {
    font-weight: 600;
    color: #000;
}

.info-value {
    font-weight: 700;
    font-size: 1.1rem;
    color: #000;
}

.exchange-info {
    justify-content: center;
    font-size: 0.9rem;
    color: #000;
    opacity: 0.8;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
}

/* Information Card */
.info-card,
.voucher-card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 20px;
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    overflow: hidden;
}

.card-header {
    background: rgba(255, 215, 0, 0.2);
    border-bottom: 1px solid rgba(255, 215, 0, 0.3);
    padding: 1.5rem 2rem;
    font-size: 1.2rem;
    font-weight: 600;
    color: #ffd700;
    display: flex;
    align-items: center;
}

.card-body {
    padding: 2rem;
}

.voucher-card-body {
    padding: 1.25rem;
}

.voucher-loading,
.voucher-empty-state {
    color: #777;
    font-size: 0.95rem;
    line-height: 1.5;
}

.my-voucher-list {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
}

.voucher-groups,
.voucher-group {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.voucher-section-title {
    font-size: 0.78rem;
    font-weight: 800;
    color: rgba(255, 255, 255, 0.78);
    text-transform: uppercase;
}

.my-voucher-item {
    border: 1px solid rgba(255, 215, 0, 0.2);
    border-radius: 14px;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.06);
}

.my-voucher-item.locked {
    border-color: rgba(255, 255, 255, 0.16);
    opacity: 0.88;
}

.my-voucher-main {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
}

.my-voucher-code {
    font-size: 1rem;
    font-weight: 800;
    color: #ffd700;
    letter-spacing: 0.04em;
}

.my-voucher-name {
    color: #fff;
    font-weight: 600;
    margin-top: 0.2rem;
}

.my-voucher-status {
    flex: 0 0 auto;
    border-radius: 999px;
    padding: 0.25rem 0.65rem;
    font-size: 0.78rem;
    font-weight: 700;
    color: #b45309;
    background: #fef3c7;
}

.my-voucher-status.eligible {
    color: #166534;
    background: #dcfce7;
}

.my-voucher-status.claimable {
    color: #9a3412;
    background: #ffedd5;
}

.btn-claim-voucher {
    width: 100%;
    margin-top: 0.9rem;
    border: none;
    border-radius: 10px;
    background: linear-gradient(45deg, #ff6b35, #ff8a5f);
    color: #fff;
    font-weight: 800;
    padding: 0.7rem 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-claim-voucher:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(255, 107, 53, 0.24);
}

.btn-claim-voucher:disabled {
    cursor: not-allowed;
    opacity: 0.7;
}

.my-voucher-desc,
.my-voucher-reason,
.voucher-remaining {
    margin-top: 0.65rem;
    color: rgba(255, 255, 255, 0.78);
    font-size: 0.9rem;
    line-height: 1.45;
}

.my-voucher-progress {
    margin-top: 0.8rem;
}

.progress-text {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    color: rgba(255, 255, 255, 0.86);
    font-size: 0.85rem;
}

.progress-text strong {
    flex: 0 0 auto;
}

.spending-progress.slim {
    height: 7px;
    margin: 0.55rem 0 0;
}

/* Form Styling */
.form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.form-group.full-width {
    grid-column: span 2;
}

.form-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    color: #ccc;
    margin-bottom: 0.5rem;
    font-size: 0.95rem;
}

.form-label i {
    color: #ffd700;
    width: 16px;
}

.form-input,
.form-select {
    width: 100%;
    padding: 0.875rem 1rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    color: #fff;
    font-size: 1rem;
    transition: all 0.3s ease;
}

.form-input:focus,
.form-select:focus {
    outline: none;
    border-color: #ffd700;
    box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.2);
    background: rgba(255, 255, 255, 0.1);
}

.form-input::placeholder {
    color: rgba(255, 255, 255, 0.5);
}

.form-select option {
    background: #1a1a1a;
    color: #fff;
}

/* Form Actions */
.form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-start;
    padding-top: 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-primary {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 2rem;
    background: linear-gradient(45deg, #ffd700, #ffed4e);
    color: #000;
    border: none;
    border-radius: 12px;
    font-weight: 700;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(255, 215, 0, 0.4);
    background: linear-gradient(45deg, #ffed4e, #ffd700);
}

.btn-secondary {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 2rem;
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn-secondary:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(255, 255, 255, 0.2);
}

/* Cinema Branding */
.cinema-branding {
    margin-top: 3rem;
    text-align: center;
}

.cinema-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem 2rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.9);
}

.cinema-icon {
    font-size: 1.2rem;
    color: #ffd700;
}

.cinema-label {
    font-size: 0.9rem;
    font-weight: 500;
}

.cinema-name {
    font-size: 1rem;
    font-weight: 700;
    background: linear-gradient(45deg, #ffd700, #ffed4e);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

/* Redesign Theme: Light + Orange */
.profile-page {
    background: #f5f5f5;
    color: #333;
}

.btn-back {
    background: #fff;
    border: 1px solid #e1e1e1;
    color: #444;
    backdrop-filter: none;
}

.btn-back:hover {
    background: #fff3ed;
    border-color: #ffc4b1;
    color: #ff6b35;
}

.page-title {
    color: #2f2f2f;
    text-shadow: none;
}

.page-subtitle,
.loading-text {
    color: #666;
}

.loading-spinner {
    border-color: rgba(255, 107, 53, 0.2);
    border-top-color: #ff6b35;
}

.loyalty-card,
.spending-card,
.info-card,
.voucher-card {
    background: #fff;
    border: 1px solid #e6e6e6;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
    color: #333;
    border-radius: 18px;
}

.loyalty-card,
.spending-card {
    width: 100%;
    min-height: 238px;
    display: flex;
    flex-direction: column;
    background: linear-gradient(180deg, #fffaf7 0%, #ffffff 100%);
    box-shadow: 0 10px 24px rgba(255, 107, 53, 0.12);
}

.loyalty-card:hover,
.spending-card:hover {
    transform: translateY(-3px);
    border-color: #ffc4b1;
    box-shadow: 0 14px 30px rgba(255, 107, 53, 0.16);
}

.loyalty-header,
.spending-header {
    background: rgba(255, 107, 53, 0.08);
    min-height: 64px;
    padding: 0.8rem 1rem;
}

.loyalty-icon i,
.spending-icon i {
    font-size: 2rem;
}

.loyalty-icon i,
.spending-icon i,
.loyalty-title,
.spending-title,
.points-number,
.spending-number,
.points-label,
.spending-label,
.info-label,
.info-value,
.exchange-info {
    color: #333;
}

.loyalty-body,
.spending-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 1rem 1.25rem 1.25rem;
}

.loyalty-title,
.spending-title {
    font-size: 0.78rem;
    margin-bottom: 0.65rem;
    letter-spacing: 0.06em;
}

.points-display,
.spending-display {
    min-height: 52px;
    margin-bottom: 0.85rem;
}

.points-number {
    font-size: 2.15rem;
    text-shadow: none;
}

.spending-number {
    font-size: 1.45rem;
}

.points-label,
.spending-label {
    font-size: 0.72rem;
    letter-spacing: 0.04em;
}

.points-info,
.spending-info {
    min-height: 96px;
    background: #fff;
    border: 1px solid #ecdcd5;
    margin-top: auto;
    padding: 0.9rem 1rem;
    border-radius: 10px;
}

.info-row {
    margin-bottom: 0.35rem;
}

.info-label,
.info-value {
    font-size: 0.86rem;
}

.exchange-info {
    font-size: 0.78rem;
    margin-top: 0.7rem;
    padding-top: 0.7rem;
}

.spending-info .info-label,
.spending-info .info-value,
.spending-info .exchange-info {
    color: #333;
}

.spending-progress {
    background: #f3dfd7;
}

.spending-progress-bar {
    background: linear-gradient(90deg, #ff6b35, #ff8a5f);
}

.card-header {
    background: #fff6f1;
    border-bottom: 1px solid #f0ddd5;
    color: #ff6b35;
    padding: 1rem 1.25rem;
    font-size: 1rem;
}

.card-body {
    padding: 1.25rem;
}

.voucher-card-body {
    padding: 1rem;
}

.form-label {
    color: #555;
}

.form-label i {
    color: #ff6b35;
}

.form-input,
.form-select {
    background: #fff;
    border: 1px solid #d9d9d9;
    color: #333;
}

.form-input:focus,
.form-select:focus {
    border-color: #ff6b35;
    box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.15);
    background: #fff;
}

.form-input::placeholder {
    color: #999;
}

.form-select option {
    background: #fff;
    color: #333;
}

.form-actions {
    border-top-color: #ececec;
}

.btn-primary {
    background: linear-gradient(45deg, #ff6b35, #ff8a5f);
    color: #fff;
    box-shadow: 0 4px 14px rgba(255, 107, 53, 0.25);
}

.btn-primary:hover {
    box-shadow: 0 8px 22px rgba(255, 107, 53, 0.35);
    background: linear-gradient(45deg, #ff8a5f, #ff6b35);
}

.my-voucher-item {
    background: #fff;
    border-color: #f0ddd5;
}

.my-voucher-item.locked {
    border-color: #ececec;
    background: #fafafa;
}

.my-voucher-code {
    color: #ff6b35;
}

.voucher-section-title,
.my-voucher-name,
.my-voucher-desc,
.my-voucher-reason,
.voucher-remaining,
.progress-text {
    color: #444;
}

/* Responsive Design */
@media (max-width: 768px) {
    .profile-summary-grid,
    .profile-main-grid {
        grid-template-columns: 1fr;
    }

    .form-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
    }

    .form-group.full-width {
        grid-column: span 1;
    }

    .loyalty-header {
        flex-direction: column;
        text-align: center;
        gap: 1rem;
    }

    .loyalty-icon {
        margin-right: 0;
    }

    .points-number {
        font-size: 3rem;
    }

    .page-title {
        font-size: 2rem;
    }

    .cinema-row {
        flex-wrap: wrap;
        padding: 0.75rem 1.5rem;
    }
}

@media (max-width: 480px) {
    .loyalty-card,
    .spending-card,
    .info-card,
    .voucher-card {
        margin: 0 1rem;
    }

    .card-body,
    .voucher-card-body,
    .loyalty-body,
    .spending-body {
        padding: 1.5rem;
    }

    .my-voucher-main,
    .progress-text {
        flex-direction: column;
        gap: 0.45rem;
    }

    .info-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
    }

    .exchange-info {
        flex-direction: row;
        text-align: center;
    }
}
</style>


