<template>
    <div class="about-page">
        <AppHeader />

        <div class="container">
            <!-- Hero Section -->
            <div class="hero-section">
                <div class="hero-content">
                    <h1 class="hero-title">Cinema And Joy</h1>
                    <p class="hero-subtitle">Trải nghiệm điện ảnh đẳng cấp thế giới</p>
                    <div class="hero-stats">
                        <div class="stat-item">
                            <div class="stat-number">50+</div>
                            <div class="stat-label">Phim mỗi tháng</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">15</div>
                            <div class="stat-label">Phòng chiếu</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">10K+</div>
                            <div class="stat-label">Khách hàng hài lòng</div>
                        </div>
                    </div>
                </div>
                <div class="hero-image">
                    <div class="cinema-illustration">
                        <i class="bi bi-camera-reels hero-icon"></i>
                    </div>
                </div>
            </div>

            <!-- About Section -->
            <div class="about-section">
                <div class="row align-items-center">
                    <div class="col-lg-6">
                        <div class="about-content">
                            <h2 class="section-title">Về Cinema And Joy</h2>
                            <p class="about-text">
                                CAJ Cinema được thành lập với sứ mệnh mang đến những trải nghiệm điện ảnh tuyệt vời nhất
                                cho khán giả Việt Nam. Với hệ thống rạp hiện đại, âm thanh sống động và dịch vụ chuyên
                                nghiệp, chúng tôi cam kết tạo ra không gian giải trí đẳng cấp.
                            </p>
                            <p class="about-text">
                                Từ những bộ phim bom tấn Hollywood đến những tác phẩm nghệ thuật tinh tế, CAJ Cinema
                                luôn cập nhật và đa dạng hóa kho phim để phục vụ mọi sở thích của khán giả.
                            </p>
                        </div>
                    </div>
                    <div class="col-lg-6">
                        <div class="features-grid">
                            <div class="feature-card">
                                <i class="bi bi-projector feature-icon"></i>
                                <h4>Công nghệ hiện đại</h4>
                                <p>Máy chiếu 4K, âm thanh Dolby Atmos</p>
                            </div>
                            <div class="feature-card">
                                <i class="bi bi-people feature-icon"></i>
                                <h4>Dịch vụ tận tâm</h4>
                                <p>Đội ngũ nhân viên chuyên nghiệp, chu đáo</p>
                            </div>
                            <div class="feature-card">
                                <i class="bi bi-geo-alt feature-icon"></i>
                                <h4>Vị trí thuận lợi</h4>
                                <p>Trung tâm thành phố, giao thông dễ dàng</p>
                            </div>
                            <div class="feature-card">
                                <i class="bi bi-cup-straw feature-icon"></i>
                                <h4>F&B đa dạng</h4>
                                <p>Bắp rang, nước giải khát, snack cao cấp</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Services Section -->
            <div class="services-section">
                <h2 class="section-title text-center">Dịch vụ của chúng tôi</h2>
                <div class="services-grid">
                    <div class="service-card">
                        <div class="service-icon">
                            <i class="bi bi-ticket-detailed"></i>
                        </div>
                        <h3>Đặt vé Online</h3>
                        <p>Đặt vé nhanh chóng, thuận tiện qua website hoặc mobile app</p>
                    </div>
                    <div class="service-card">
                        <div class="service-icon">
                            <i class="bi bi-credit-card"></i>
                        </div>
                        <h3>Thanh toán linh hoạt</h3>
                        <p>Hỗ trợ nhiều hình thức thanh toán: tiền mặt, thẻ, ví điện tử</p>
                    </div>
                    <div class="service-card">
                        <div class="service-icon">
                            <i class="bi bi-gift"></i>
                        </div>
                        <h3>Chương trình ưu đãi</h3>
                        <p>Khuyến mãi hấp dẫn, tích điểm thành viên, giảm giá sinh nhật</p>
                    </div>
                    <div class="service-card">
                        <div class="service-icon">
                            <i class="bi bi-calendar-event"></i>
                        </div>
                        <h3>Sự kiện đặc biệt</h3>
                        <p>Suất chiếu sớm, gặp gỡ diễn viên, lễ hội phim quốc tế</p>
                    </div>
                </div>
            </div>

            <!-- Spending Rewards Section -->
            <div class="spending-rewards-section">
                <div class="rewards-heading">
                    <span class="rewards-kicker">Ưu đãi theo chi tiêu</span>
                    <h2 class="section-title text-center">Mua càng nhiều, giảm càng sâu</h2>
                    <p>
                        Mỗi đơn vé đã thanh toán thành công sẽ được tính vào tổng chi tiêu của tài khoản theo năm
                        dương lịch, ví dụ năm 2026. Khi đạt các mốc chi tiêu, hệ thống tự mở khóa voucher phù hợp để
                        bạn dùng ở lần thanh toán tiếp theo.
                    </p>
                </div>

                <div class="reward-milestone-panel">
                    <div class="reward-progress-head">
                        <div>
                            <span class="tier-label">Các cấp ưu đãi</span>
                            <strong>
                                {{
                                    hasRewardProfile
                                        ? `Bạn đã thanh toán ${formatCurrency(accountTotalSpent)} trong ${formatWindowYears(accountSpendingWindowDays, accountSpendingYear)}`
                                        : "Mốc chi tiêu được tính tự động theo từng voucher"
                                }}
                            </strong>
                        </div>
                        <span class="reward-progress-badge">
                            {{ hasRewardProfile ? rewardProgressLabel : "Tự mở khóa khi đủ mốc" }}
                        </span>
                    </div>

                    <div
                        class="reward-progress-track"
                        :style="{ gridTemplateColumns: `repeat(${rewardMilestones.length}, minmax(0, 1fr))` }"
                        aria-label="Các mốc ưu đãi theo chi tiêu"
                    >
                        <div class="reward-progress-line">
                            <div
                                v-if="hasRewardProfile"
                                class="reward-progress-fill"
                                :style="{ width: `${accountRewardProgress}%` }"
                            ></div>
                        </div>

                        <div
                            v-for="(milestone, index) in rewardMilestones"
                            :key="milestone.amount"
                            class="reward-milestone"
                            :class="[milestone.tone, getMilestoneState(milestone)]"
                        >
                            <span class="reward-tier-badge" :class="milestone.tone">
                                <em>{{ milestone.label }}</em>
                            </span>
                            <span class="reward-milestone-dot">{{ index + 1 }}</span>
                            <strong>{{ formatCompactCurrency(milestone.amount) }}</strong>
                            <small v-if="hasRewardProfile">
                                {{ accountTotalSpent >= milestone.amount ? "Đã đạt" : `Còn ${formatCurrency(milestone.amount - accountTotalSpent)}` }}
                            </small>
                        </div>
                    </div>

                    <div class="reward-progress-caption">
                        <template v-if="hasRewardProfile">
                            <span>Tiến độ này lấy từ các thanh toán đã hoàn tất của tài khoản đang đăng nhập.</span>
                            <span>{{ nextRewardMilestone ? `Mốc tiếp theo: ${formatCurrency(nextRewardMilestone.amount)}` : "Bạn đã đạt mốc cao nhất đang áp dụng." }}</span>
                            <span>Voucher đủ điều kiện sẽ tự xuất hiện ở trang thanh toán hoặc trong ví voucher.</span>
                        </template>
                        <template v-else>
                            <span>Khách mua vé hoặc combo bằng tài khoản đã đăng nhập.</span>
                            <span>Hệ thống cộng các đơn đã thanh toán trong khoảng thời gian của voucher.</span>
                            <span>Khi đạt mốc, voucher phù hợp tự xuất hiện ở trang thanh toán.</span>
                        </template>
                    </div>
                </div>

                <div class="reward-note">
                    <strong>Lưu ý</strong>
                    <span>
                        Mốc cụ thể và thời hạn tính chi tiêu do quản trị viên thiết lập cho từng voucher. Khách chưa đủ
                        mốc sẽ không thấy voucher đó trong danh sách mã phù hợp.
                    </span>
                </div>
            </div>

            <!-- Contact Section -->
            <div class="contact-section">
                <div class="row">
                    <div class="col-lg-6">
                        <h2 class="section-title">Liên hệ với chúng tôi</h2>
                        <div class="contact-info">
                            <div class="contact-item">
                                <i class="bi bi-geo-alt contact-icon"></i>
                                <div>
                                    <strong>Địa chỉ:</strong><br />
                                    Khu II, Đường 3/2, Cần Thơ
                                </div>
                            </div>
                            <div class="contact-item">
                                <i class="bi bi-telephone contact-icon"></i>
                                <div>
                                    <strong>Hotline:</strong><br />
                                    1900 1234 (24/7)
                                </div>
                            </div>
                            <div class="contact-item">
                                <i class="bi bi-envelope contact-icon"></i>
                                <div>
                                    <strong>Email:</strong><br />
                                    info@cinemaandjoy.com
                                </div>
                            </div>
                            <div class="contact-item">
                                <i class="bi bi-clock contact-icon"></i>
                                <div>
                                    <strong>Giờ hoạt động:</strong><br />
                                    8:00 - 23:00 (Tất cả các ngày)
                                </div>
                            </div>
                        </div>
                        <div class="social-links">
                            <h4>Theo dõi chúng tôi</h4>
                            <div class="social-icons">
                                <a href="#" class="social-icon">
                                    <i class="bi bi-facebook"></i>
                                </a>
                                <a href="#" class="social-icon">
                                    <i class="bi bi-instagram"></i>
                                </a>
                                <a href="#" class="social-icon">
                                    <i class="bi bi-youtube"></i>
                                </a>
                                <a href="#" class="social-icon">
                                    <i class="bi bi-tiktok"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-6">
                        <div class="contact-form">
                            <h3>Gửi tin nhắn cho chúng tôi</h3>
                            <form @submit.prevent="sendMessage">
                                <div class="form-group">
                                    <input
                                        type="text"
                                        class="form-control"
                                        placeholder="Họ và tên *"
                                        v-model="contactForm.name"
                                        required
                                    />
                                </div>
                                <div class="form-group">
                                    <input
                                        type="email"
                                        class="form-control"
                                        placeholder="Email *"
                                        v-model="contactForm.email"
                                        required
                                    />
                                </div>
                                <div class="form-group">
                                    <input
                                        type="tel"
                                        class="form-control"
                                        placeholder="Số điện thoại"
                                        v-model="contactForm.phone"
                                    />
                                </div>
                                <div class="form-group">
                                    <textarea
                                        class="form-control"
                                        rows="4"
                                        placeholder="Nội dung tin nhắn *"
                                        v-model="contactForm.message"
                                        required
                                    ></textarea>
                                </div>
                                <button type="submit" class="btn-submit" :disabled="sending">
                                    <i class="bi bi-send" v-if="!sending"></i>
                                    <i class="bi bi-arrow-repeat spin" v-else></i>
                                    {{ sending ? "Đang gửi..." : "Gửi tin nhắn" }}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import api from "@/api";
import AppHeader from "@/components/AppHeader.vue";
import { useAuthStore } from "@/stores/auth.store";
import { showCinemaAlert } from "@/utils/cinemaAlert";

const auth = useAuthStore();
const fallbackRewardMilestones = [
    { amount: 500000, label: "Starter", tone: "starter" },
    { amount: 1000000, label: "Member Plus", tone: "member" },
    { amount: 2000000, label: "VIP", tone: "vip" },
];
const milestoneTones = ["starter", "member", "vip"];
const REWARD_LINE_SIDE_OFFSET_PERCENT = 12;
const publicVouchers = ref([]);
const rewardProfile = ref(null);
const rewardProfileLoading = ref(false);

// Contact form
const contactForm = ref({
    name: "",
    email: "",
    phone: "",
    message: "",
});

const sending = ref(false);
const rewardMilestones = computed(() => {
    const rows = publicVouchers.value
        .map((voucher) => ({
            amount: Number(voucher.requiredTotalSpent || 0),
            label: voucher.name || voucher.code || "",
        }))
        .filter((milestone) => milestone.amount > 0)
        .sort((left, right) => left.amount - right.amount);

    const unique = [];
    const seen = new Set();
    for (const row of rows) {
        if (seen.has(row.amount)) continue;
        seen.add(row.amount);
        unique.push({
            amount: row.amount,
            label: row.label || fallbackRewardMilestones[unique.length]?.label || `Mốc ${unique.length + 1}`,
            tone: milestoneTones[unique.length % milestoneTones.length],
        });
    }

    return unique.length ? unique : fallbackRewardMilestones;
});
const currentUserId = computed(() => auth.userId || localStorage.getItem("userId"));
const hasRewardProfile = computed(() => Boolean(rewardProfile.value));
const accountTotalSpent = computed(() => Number(rewardProfile.value?.totalSpent || 0));
const accountSpendingWindowDays = computed(() => Number(rewardProfile.value?.spendingWindowDays || 365));
const accountSpendingYear = computed(() => Number(rewardProfile.value?.spendingYear || new Date().getFullYear()));
const nextRewardMilestone = computed(() =>
    rewardMilestones.value.find((milestone) => accountTotalSpent.value < milestone.amount) || null,
);
const accountRewardProgress = computed(() => {
    const milestones = rewardMilestones.value;
    const spent = accountTotalSpent.value;
    if (!milestones.length || spent <= 0) return 0;

    const lineWidth = 100 - REWARD_LINE_SIDE_OFFSET_PERCENT * 2;
    const markerPosition = (index) => {
        const markerCenter = ((index + 0.5) / milestones.length) * 100;
        return Math.min(100, Math.max(0, ((markerCenter - REWARD_LINE_SIDE_OFFSET_PERCENT) / lineWidth) * 100));
    };

    const firstAmount = milestones[0].amount;
    if (spent < firstAmount) {
        return markerPosition(0) * (spent / firstAmount);
    }

    for (let index = 0; index < milestones.length - 1; index++) {
        const current = milestones[index];
        const next = milestones[index + 1];
        if (spent < next.amount) {
            const currentPosition = markerPosition(index);
            const nextPosition = markerPosition(index + 1);
            const segmentProgress = (spent - current.amount) / (next.amount - current.amount);
            return currentPosition + (nextPosition - currentPosition) * segmentProgress;
        }
    }

    return markerPosition(milestones.length - 1);
});
const rewardProgressLabel = computed(() => {
    if (rewardProfileLoading.value) return "Đang tải tiến độ";
    if (!nextRewardMilestone.value) return "Đã đạt mốc cao nhất";
    return `Còn ${formatCurrency(nextRewardMilestone.value.amount - accountTotalSpent.value)}`;
});

const loadRewardMilestones = async () => {
    try {
        const { data } = await api.get("/public/vouchers/active");
        publicVouchers.value = Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Reward milestones load failed:", error);
        publicVouchers.value = [];
    }
};

const loadRewardProfile = async () => {
    if (!auth.isAuthenticated || !auth.isCustomer || !currentUserId.value) {
        rewardProfile.value = null;
        return;
    }

    try {
        rewardProfileLoading.value = true;
        const { data } = await api.get(`/auth/profile/${currentUserId.value}`);
        rewardProfile.value = data || null;
    } catch (error) {
        console.error("Reward profile load failed:", error);
        rewardProfile.value = null;
    } finally {
        rewardProfileLoading.value = false;
    }
};

const getMilestoneState = (milestone) => {
    if (!hasRewardProfile.value) return "reference";
    if (accountTotalSpent.value >= milestone.amount) return "achieved";
    if (nextRewardMilestone.value?.amount === milestone.amount) return "current";
    return "locked";
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(Math.max(0, Number(amount || 0)));
};

const formatCompactCurrency = (amount) => {
    const value = Number(amount || 0);
    if (value >= 1000000) {
        const millions = value / 1000000;
        return `${Number.isInteger(millions) ? millions : millions.toFixed(1)}TR`;
    }
    if (value >= 1000) return `${Math.round(value / 1000)}K`;
    return formatCurrency(value);
};

const formatWindowYears = (days, year = new Date().getFullYear()) => {
    const endYear = Number(year || new Date().getFullYear());
    const years = Math.max(1, Math.round(Number(days || 365) / 365));
    const startYear = endYear - years + 1;
    if (years === 1) return `năm ${endYear}`;
    return `từ năm ${startYear} đến năm ${endYear}`;
};

onMounted(() => {
    loadRewardMilestones();
    loadRewardProfile();
});

const sendMessage = async () => {
    sending.value = true;

    try {
        // Simulate sending message
        await new Promise((resolve) => setTimeout(resolve, 2000));

        await showCinemaAlert({
            icon: "success",
            title: "Gửi liên hệ thành công",
            text: "Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi trong thời gian sớm nhất.",
        });

        // Reset form
        contactForm.value = {
            name: "",
            email: "",
            phone: "",
            message: "",
        };
    } catch (error) {
        await showCinemaAlert({
            icon: "error",
            title: "Không thể gửi liên hệ",
            text: "Có lỗi xảy ra. Vui lòng thử lại sau.",
        });
    } finally {
        sending.value = false;
    }
};
</script>

<style scoped>
.about-page {
    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
    min-height: 100vh;
    color: #ffffff;
}

.container {
    max-width: 1200px;
    padding: 2rem 15px;
}

/* Hero Section */
.hero-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
    align-items: center;
    padding: 3rem 0;
    margin-bottom: 4rem;
}

.hero-title {
    font-size: 3.5rem;
    font-weight: 800;
    color: #ffd700;
    margin-bottom: 1rem;
    text-shadow: 0 4px 8px rgba(255, 215, 0, 0.3);
}

.hero-subtitle {
    font-size: 1.3rem;
    color: #ccc;
    margin-bottom: 2rem;
    line-height: 1.6;
}

.hero-stats {
    display: flex;
    gap: 2rem;
}

.stat-item {
    text-align: center;
}

.stat-number {
    font-size: 2rem;
    font-weight: 700;
    color: #ffd700;
    line-height: 1;
}

.stat-label {
    font-size: 0.9rem;
    color: #999;
    margin-top: 0.5rem;
}

.hero-image {
    display: flex;
    justify-content: center;
    align-items: center;
}

.cinema-illustration {
    width: 200px;
    height: 200px;
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1));
    border: 2px solid rgba(255, 215, 0, 0.3);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.hero-icon {
    font-size: 4rem;
    color: #ffd700;
}

/* About Section */
.about-section {
    margin-bottom: 5rem;
}

.section-title {
    font-size: 2.5rem;
    font-weight: 700;
    color: #ffd700;
    margin-bottom: 2rem;
    position: relative;
}

.section-title::after {
    content: "";
    position: absolute;
    bottom: -10px;
    left: 0;
    width: 60px;
    height: 3px;
    background: linear-gradient(45deg, #ffd700, #ffed4e);
    border-radius: 2px;
}

.section-title.text-center::after {
    left: 50%;
    transform: translateX(-50%);
}

.about-text {
    font-size: 1.1rem;
    line-height: 1.8;
    color: #ccc;
    margin-bottom: 1.5rem;
}

.features-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
}

.feature-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 15px;
    padding: 1.5rem;
    text-align: center;
    transition: all 0.3s ease;
}

.feature-card:hover {
    transform: translateY(-5px);
    border-color: rgba(255, 215, 0, 0.3);
    box-shadow: 0 10px 30px rgba(255, 215, 0, 0.1);
}

.feature-icon {
    font-size: 2rem;
    color: #ffd700;
    margin-bottom: 1rem;
}

.feature-card h4 {
    color: #fff;
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
}

.feature-card p {
    color: #999;
    font-size: 0.9rem;
    margin: 0;
}

/* Services Section */
.services-section {
    margin-bottom: 5rem;
}

.services-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin-top: 3rem;
}

.service-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 2rem;
    text-align: center;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.service-card::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(45deg, #ffd700, #ffed4e);
    transform: scaleX(0);
    transition: transform 0.3s ease;
}

.service-card:hover::before {
    transform: scaleX(1);
}

.service-card:hover {
    transform: translateY(-10px);
    border-color: rgba(255, 215, 0, 0.3);
    box-shadow: 0 15px 40px rgba(255, 215, 0, 0.15);
}

.service-icon {
    width: 70px;
    height: 70px;
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1));
    border: 2px solid rgba(255, 215, 0, 0.3);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
    font-size: 1.8rem;
    color: #ffd700;
}

.service-card h3 {
    color: #fff;
    font-size: 1.3rem;
    margin-bottom: 1rem;
}

.service-card p {
    color: #ccc;
    line-height: 1.6;
    margin: 0;
}

/* Spending Rewards Section */
.spending-rewards-section {
    margin-bottom: 5rem;
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.12), rgba(255, 255, 255, 0.04));
    border: 1px solid rgba(255, 215, 0, 0.18);
    border-radius: 20px;
    padding: 3rem;
}

.rewards-heading {
    max-width: 760px;
    margin: 0 auto 2.5rem;
    text-align: center;
}

.rewards-kicker {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.8rem;
    padding: 0.35rem 0.8rem;
    border-radius: 999px;
    background: rgba(255, 215, 0, 0.16);
    color: #ffd700;
    font-weight: 700;
    font-size: 0.85rem;
}

.rewards-heading p,
.reward-note {
    color: #ccc;
    line-height: 1.7;
}

.tier-label {
    display: inline-block;
    color: #ffd700;
    font-weight: 700;
    font-size: 0.8rem;
    margin-bottom: 0.55rem;
    text-transform: uppercase;
}

.reward-note {
    display: flex;
    gap: 0.7rem;
    align-items: flex-start;
    margin-top: 1.5rem;
    padding: 1rem 1.2rem;
    border-radius: 14px;
    background: rgba(0, 0, 0, 0.18);
}

.reward-note strong {
    color: #ffd700;
    flex: 0 0 auto;
    font-size: 0.9rem;
    text-transform: uppercase;
}

.reward-milestone-panel {
    border: 1px solid rgba(255, 215, 0, 0.22);
    border-radius: 18px;
    background: rgba(0, 0, 0, 0.2);
    padding: 1.4rem 1.6rem 1.6rem;
    margin-bottom: 1.5rem;
}

.reward-progress-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 2rem;
}

.reward-progress-head strong {
    display: block;
    color: #fff;
    font-size: 1.3rem;
    line-height: 1.35;
}

.reward-progress-badge {
    flex: 0 0 auto;
    border-radius: 999px;
    padding: 0.45rem 0.8rem;
    background: rgba(255, 215, 0, 0.16);
    color: #ffd700;
    font-weight: 800;
    font-size: 0.85rem;
}

.reward-progress-track {
    position: relative;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
    margin: 0.8rem 0 1.1rem;
    padding-top: 0.35rem;
}

.reward-progress-line {
    position: absolute;
    left: 12%;
    right: 12%;
    top: 92px;
    height: 2px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.14);
    overflow: hidden;
}

.reward-progress-fill {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #ff6b35, #ffd700);
    transition: width 0.3s ease;
}

.reward-milestone {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
    min-height: 190px;
    padding: 0.4rem 0.75rem 0;
    text-align: center;
    color: #cfcfcf;
}

.reward-tier-badge {
    width: 100%;
    max-width: 156px;
    min-height: 68px;
    border-radius: 16px;
    padding: 0.65rem 0.75rem;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.2rem;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.16);
    box-shadow: 0 12px 26px rgba(0, 0, 0, 0.16);
}

.reward-tier-badge b {
    min-width: 34px;
    height: 34px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.86);
    color: currentColor;
    font-size: 0.86rem;
    font-weight: 900;
}

.reward-tier-badge em {
    font-style: normal;
    font-size: 0.72rem;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-transform: uppercase;
}

.reward-tier-badge.starter {
    color: #facc15;
}

.reward-tier-badge.member {
    color: #38bdf8;
}

.reward-tier-badge.vip {
    color: #fb7185;
}

.reward-milestone-dot {
    width: 42px;
    height: 42px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #151515;
    border: 3px solid rgba(255, 255, 255, 0.22);
    color: #aaa;
    font-size: 0.9rem;
    font-weight: 900;
    box-shadow: 0 0 0 8px rgba(0, 0, 0, 0.28);
}

.reward-milestone strong {
    color: #fff;
    font-size: 0.95rem;
}

.reward-milestone small {
    color: #ffd700;
    font-weight: 700;
    max-width: 190px;
    line-height: 1.35;
}

.reward-progress-caption {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.9rem;
    color: #ccc;
    font-size: 0.9rem;
    line-height: 1.55;
}

.reward-progress-caption span {
    border-left: 2px solid rgba(255, 215, 0, 0.35);
    padding-left: 0.75rem;
}

/* Contact Section */
.contact-section {
    background: rgba(255, 255, 255, 0.03);
    border-radius: 20px;
    padding: 3rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.contact-info {
    margin-bottom: 2rem;
}

.contact-item {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.contact-icon {
    font-size: 1.3rem;
    color: #ffd700;
    margin-top: 0.2rem;
    min-width: 20px;
}

.contact-item strong {
    color: #ffd700;
}

.social-links h4 {
    color: #ffd700;
    margin-bottom: 1rem;
}

.social-icons {
    display: flex;
    gap: 1rem;
}

.social-icon {
    width: 45px;
    height: 45px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ccc;
    font-size: 1.2rem;
    transition: all 0.3s ease;
    text-decoration: none;
}

.social-icon:hover {
    background: linear-gradient(45deg, #ffd700, #ffed4e);
    color: #000;
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(255, 215, 0, 0.4);
}

/* Contact Form */
.contact-form {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 15px;
    padding: 2rem;
}

.contact-form h3 {
    color: #ffd700;
    margin-bottom: 1.5rem;
}

.form-group {
    margin-bottom: 1rem;
}

.form-control {
    width: 100%;
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: #fff;
    font-size: 0.95rem;
    transition: all 0.3s ease;
}

.form-control::placeholder {
    color: #999;
}

.form-control:focus {
    outline: none;
    border-color: rgba(255, 215, 0, 0.5);
    box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.1);
    background: rgba(255, 255, 255, 0.15);
}

.btn-submit {
    width: 100%;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(45deg, #ffd700, #ffed4e);
    color: #000;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.btn-submit:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(255, 215, 0, 0.4);
}

.btn-submit:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

/* Redesign Theme: Light + Orange */
.about-page {
    background: #f5f5f5;
    color: #333;
}

.hero-section,
.about-section,
.services-section,
.spending-rewards-section,
.contact-section {
    background: #fff;
    border: 1px solid #e9e2de;
    border-radius: 18px;
    padding: 2rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.hero-title,
.section-title {
    color: #2f2f2f;
    text-shadow: none;
}

.hero-subtitle,
.about-text,
.service-card p,
.feature-card p {
    color: #666;
}

.hero-stats .stat-number,
.feature-icon,
.service-icon,
.contact-icon,
.social-links h4,
.contact-item strong,
.contact-form h3 {
    color: #ff6b35;
}

.stat-label {
    color: #777;
}

.cinema-illustration,
.service-icon {
    background: rgba(255, 107, 53, 0.12);
    border-color: rgba(255, 107, 53, 0.28);
}

.section-title::after,
.service-card::before {
    background: linear-gradient(45deg, #ff6b35, #ff8a5f);
}

.feature-card,
.service-card,
.contact-form {
    background: #fff;
    border: 1px solid #e6e6e6;
}

.feature-card h4,
.service-card h3 {
    color: #333;
}

.feature-card:hover,
.service-card:hover {
    border-color: #ffc2ad;
    box-shadow: 0 10px 26px rgba(255, 107, 53, 0.14);
}

.contact-section {
    background: #fff8f4;
    border-color: #f0ddd5;
}

.spending-rewards-section {
    background: linear-gradient(135deg, #fff8f4, #ffffff);
    border-color: #f0ddd5;
}

.rewards-kicker,
.tier-label,
.reward-note strong {
    color: #ff6b35;
}

.rewards-kicker,
.reward-step-icon {
    background: rgba(255, 107, 53, 0.12);
}

.rewards-heading p,
.reward-note,
.reward-step p,
.reward-tier p {
    color: #666;
}

.reward-step,
.reward-tier {
    background: #fff;
    border-color: #e6e6e6;
}

.reward-step h3,
.reward-tier strong {
    color: #333;
}

.reward-step-icon {
    color: #ff6b35;
}

.reward-tier.featured {
    border-color: #ffb59a;
    box-shadow: 0 14px 30px rgba(255, 107, 53, 0.14);
}

.reward-note {
    background: #fff3ed;
}

.reward-milestone-panel {
    background: #fff;
    border-color: #f0ddd5;
}

.reward-progress-head strong,
.reward-milestone strong {
    color: #2f2f2f;
}

.reward-progress-badge {
    background: #fff1e8;
    color: #c2410c;
}

.reward-progress-line {
    background: #f3dfd7;
}

.reward-milestone {
    color: #7a6a63;
}

.reward-tier-badge {
    background: #fffaf7;
    border-color: #f0ddd5;
    box-shadow: 0 10px 24px rgba(255, 107, 53, 0.1);
}

.reward-tier-badge.starter {
    color: #c2410c;
}

.reward-tier-badge.member {
    color: #2563eb;
}

.reward-tier-badge.vip {
    color: #be123c;
}

.reward-tier-badge b {
    background: #fff;
}

.reward-milestone-dot {
    background: #fff;
    border-color: #ead4ca;
    color: #b36a4f;
    box-shadow: 0 0 0 8px #fff;
}

.reward-milestone .reward-milestone-dot {
    background: #fff;
    border-color: #ff8a5f;
    color: #ff6b35;
}

.reward-milestone.achieved .reward-milestone-dot {
    background: #ff6b35;
    border-color: #ff8a5f;
    color: #fff;
}

.reward-milestone.current .reward-milestone-dot {
    background: #fff;
    border-color: #ff6b35;
    color: #ff6b35;
    box-shadow:
        0 0 0 8px #fff,
        0 8px 20px rgba(255, 107, 53, 0.18);
}

.reward-milestone.locked {
    opacity: 0.72;
}

.reward-milestone.achieved .reward-tier-badge {
    border-color: #ffb59a;
    background: #fff4ee;
}

.reward-milestone small {
    color: #c2410c;
}

.reward-progress-caption {
    color: #666;
}

.contact-item div {
    color: #555;
}

.social-icon {
    background: #fff5f1;
    border-color: #ffd3c3;
    color: #ff6b35;
}

.social-icon:hover {
    background: #ff6b35;
    color: #fff;
    box-shadow: 0 5px 15px rgba(255, 107, 53, 0.35);
}

.form-control {
    background: #fff;
    border: 1px solid #dcdcdc;
    color: #333;
}

.form-control::placeholder {
    color: #888;
}

.form-control:focus {
    border-color: #ff6b35;
    box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.14);
    background: #fff;
}

.btn-submit {
    background: linear-gradient(45deg, #ff6b35, #ff8a5f);
    color: #fff;
}

.btn-submit:hover:not(:disabled) {
    box-shadow: 0 5px 15px rgba(255, 107, 53, 0.35);
}

/* Responsive Design */
@media (max-width: 768px) {
    .hero-section {
        grid-template-columns: 1fr;
        gap: 2rem;
        text-align: center;
    }

    .hero-title {
        font-size: 2.5rem;
    }

    .hero-stats {
        justify-content: center;
        gap: 1.5rem;
    }

    .features-grid {
        grid-template-columns: 1fr;
    }

    .services-grid {
        grid-template-columns: 1fr;
    }

    .spending-rewards-section {
        padding: 2rem 1rem;
    }

    .reward-progress-head,
    .reward-progress-caption {
        grid-template-columns: 1fr;
        flex-direction: column;
    }

    .reward-progress-track {
        grid-template-columns: 1fr;
        gap: 0.9rem;
        margin: 0.5rem 0 1rem;
    }

    .reward-progress-line {
        display: none;
    }

    .reward-milestone {
        min-height: auto;
        padding: 0.85rem;
        border: 1px solid #f0ddd5;
        border-radius: 14px;
        background: #fffaf7;
        font-size: 0.82rem;
    }

    .reward-tier-badge {
        max-width: none;
        min-height: 52px;
        padding: 0.45rem 0.35rem;
    }

    .reward-tier-badge b {
        min-width: 30px;
        height: 30px;
    }

    .reward-tier-badge em {
        font-size: 0.62rem;
    }

    .reward-milestone-dot {
        width: 40px;
        height: 40px;
    }

    .contact-section {
        padding: 2rem 1rem;
    }

    .social-icons {
        justify-content: center;
    }
}

@media (max-width: 480px) {
    .container {
        padding: 1rem;
    }

    .hero-stats {
        flex-direction: column;
        gap: 1rem;
    }

    .stat-number {
        font-size: 1.5rem;
    }
}
</style>

