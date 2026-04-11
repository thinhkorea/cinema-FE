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
            <div v-else class="row g-4">
                <!-- Loyalty Points Card -->
                <div class="col-lg-4 col-md-6">
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
                                <div class="exchange-info">
                                    <i class="bi bi-info-circle me-2"></i>
                                    <span>Tích: 20.000đ = 1 điểm</span>
                                    <br />
                                    <i class="bi bi-info-circle me-2"></i>
                                    <span>Đổi: 1 điểm = 1. 000đ</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Personal Information Card -->
                <div class="col-lg-8 col-md-6">
                    <div class="info-card h-100">
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
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth.store";
import api from "@/api";
import Swal from "sweetalert2";
import { useRouter } from "vue-router";

const router = useRouter();
const auth = useAuthStore();
const profile = ref({ user: {} });
const loading = ref(true);

const goHome = () => router.push("/");

onMounted(async () => {
    try {
        const userId = auth.userId || localStorage.getItem("userId");

        if (!userId) {
            Swal.fire("Thông báo", "Bạn cần đăng nhập để xem hồ sơ", "info");
            router.push("/login");
            return;
        }

        const res = await api.get(`/auth/profile/${userId}`);
        profile.value = res.data;
        profile.value.user = profile.value.user || {};
        profile.value.user.email = profile.value.user.email || profile.value.email || "";
        profile.value.user.phone = profile.value.user.phone || profile.value.phone || "";
    } catch (err) {
        console.error(err);
        Swal.fire("Lỗi", "Không thể tải hồ sơ", "error");
    } finally {
        loading.value = false;
    }
});

const updateProfile = async () => {
    try {
        const userId = auth.userId || localStorage.getItem("userId");

        if (!userId) {
            Swal.fire("Thông báo", "Không xác định được người dùng!", "warning");
            return;
        }

        await api.put(`/auth/profile/${userId}`, profile.value);

        await Swal.fire({
            icon: "success",
            title: "Cập nhật thành công!",
            text: "Hồ sơ của bạn đã được lưu.",
            timer: 1500,
            showConfirmButton: false,
        });

        router.push("/");
    } catch (err) {
        console.error(err);
        Swal.fire("Lỗi", "Cập nhật thất bại", "error");
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
    max-width: 1000px;
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

.loyalty-header {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1.5rem;
    background: rgba(0, 0, 0, 0.1);
}

.loyalty-icon i {
    font-size: 3rem;
    color: #000;
}

.loyalty-body {
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

.points-display {
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

.points-label {
    font-size: 1rem;
    font-weight: 600;
    color: #000;
    opacity: 0.8;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.points-info {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    padding: 1.5rem;
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
.info-card {
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
.info-card {
    background: #fff;
    border: 1px solid #e6e6e6;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
    color: #333;
}

.loyalty-card {
    background: linear-gradient(180deg, #fff8f4 0%, #fff2ec 100%);
    box-shadow: 0 10px 24px rgba(255, 107, 53, 0.15);
}

.loyalty-header {
    background: rgba(255, 107, 53, 0.08);
}

.loyalty-icon i,
.loyalty-title,
.points-number,
.points-label,
.info-label,
.info-value,
.exchange-info {
    color: #333;
}

.points-info {
    background: #fff;
    border: 1px solid #ecdcd5;
}

.card-header {
    background: #fff6f1;
    border-bottom: 1px solid #f0ddd5;
    color: #ff6b35;
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

/* Responsive Design */
@media (max-width: 768px) {
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
    .info-card {
        margin: 0 1rem;
    }

    .card-body,
    .loyalty-body {
        padding: 1.5rem;
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
