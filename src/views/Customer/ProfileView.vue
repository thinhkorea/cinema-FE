<template>
    <div class="profile-page">
        <div class="container py-5">
            <!-- Header -->
            <div class="text-center mb-5">
                <h1 class="fw-bold display-5" style="color: #1a1a1a">
                    <i class="bi bi-person-circle me-2" style="color: #ffc107"></i>
                    Hồ sơ cá nhân
                </h1>
                <p class="text-muted">Quản lý thông tin tài khoản và điểm tích lũy</p>
            </div>

            <div v-if="loading" class="text-center my-5">
                <div class="spinner-border text-warning" role="status"></div>
                <p class="text-muted mt-3">Đang tải hồ sơ...</p>
            </div>

            <div v-else class="row g-4">
                <!-- Card Điểm tích lũy -->
                <div class="col-lg-4 col-md-6">
                    <div class="loyalty-card h-100">
                        <div class="loyalty-header">
                            <i class="bi bi-gem"></i>
                        </div>
                        <div class="loyalty-body">
                            <h6 class="text-white mb-3" style="font-size: 0.9rem; letter-spacing: 1px; opacity: 0.95">
                                ĐIỂM TÍCH LŨY
                            </h6>
                            <div class="points-display">
                                <h1 class="display-5 fw-bold text-white mb-0">{{ profile.loyaltyPoints || 0 }}</h1>
                                <span class="points-label">điểm</span>
                            </div>
                            <hr style="border-color: rgba(255, 255, 255, 0.2); margin: 16px 0" />
                            <div class="loyalty-info">
                                <div class="discount-value">
                                    <span class="label">Giá trị giảm:</span>
                                    <span class="value"
                                        >{{ ((profile.loyaltyPoints || 0) * 20000).toLocaleString() }}₫</span
                                    >
                                </div>
                                <div class="exchange-rate mt-3">
                                    <i class="bi bi-info-circle me-2"></i>
                                    <span>1 điểm = 20.000đ</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Card Thông tin cá nhân -->
                <div class="col-lg-8 col-md-6">
                    <div class="info-card h-100">
                        <div class="card-header bg-warning text-dark fw-bold py-3 px-4 rounded-top">
                            <i class="bi bi-person me-2"></i>Thông tin cá nhân
                        </div>
                        <form @submit.prevent="updateProfile" class="card-body p-4">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label fw-semibold">
                                        <i class="bi bi-person me-1"></i>Họ và tên
                                    </label>
                                    <input
                                        v-model="profile.user.fullName"
                                        class="form-control"
                                        placeholder="Nhập họ và tên"
                                    />
                                </div>

                                <div class="col-md-6">
                                    <label class="form-label fw-semibold">
                                        <i class="bi bi-envelope me-1"></i>Email
                                    </label>
                                    <input
                                        v-model="profile.email"
                                        type="email"
                                        class="form-control"
                                        placeholder="Nhập email"
                                    />
                                </div>

                                <div class="col-md-6">
                                    <label class="form-label fw-semibold">
                                        <i class="bi bi-telephone me-1"></i>Số điện thoại
                                    </label>
                                    <input
                                        v-model="profile.phone"
                                        class="form-control"
                                        placeholder="Nhập số điện thoại"
                                    />
                                </div>

                                <div class="col-md-6">
                                    <label class="form-label fw-semibold">
                                        <i class="bi bi-venus-mars me-1"></i>Giới tính
                                    </label>
                                    <select v-model="profile.gender" class="form-select">
                                        <option value="">-- Chọn giới tính --</option>
                                        <option value="MALE">Nam</option>
                                        <option value="FEMALE">Nữ</option>
                                    </select>
                                </div>

                                <div class="col-12">
                                    <label class="form-label fw-semibold">
                                        <i class="bi bi-geo-alt me-1"></i>Địa chỉ
                                    </label>
                                    <input v-model="profile.address" class="form-control" placeholder="Nhập địa chỉ" />
                                </div>
                            </div>

                            <div class="d-flex gap-2 mt-4 pt-3 border-top">
                                <button type="submit" class="btn btn-warning fw-bold px-4">
                                    <i class="bi bi-check-circle me-1"></i>Lưu thay đổi
                                </button>
                                <button type="button" class="btn btn-outline-secondary" @click="goHome">
                                    <i class="bi bi-house me-1"></i>Quay lại
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
.profile-page {
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    min-height: 100vh;
    padding: 40px 0;
}

.loyalty-card {
    background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
    border-radius: 16px;
    box-shadow: 0 8px 24px rgba(255, 193, 7, 0.3);
    overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.loyalty-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 32px rgba(255, 193, 7, 0.4);
}

.loyalty-header {
    background: rgba(0, 0, 0, 0.1);
    padding: 20px;
    text-align: center;
}

.loyalty-header i {
    font-size: 3rem;
    color: white;
}

.loyalty-body {
    padding: 24px;
    color: white;
}

.points-display {
    text-align: center;
    margin: 12px 0 20px;
}

.points-display h1 {
    color: white;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    letter-spacing: 2px;
    margin-bottom: 4px;
}

.points-label {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.9);
    font-weight: 500;
}

.discount-value {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 1rem;
    margin-bottom: 8px;
}

.discount-value .label {
    font-weight: 600;
    opacity: 0.95;
}

.discount-value .value {
    color: white;
    font-size: 1.15rem;
    font-weight: bold;
    padding: 6px 12px;
    background: rgba(0, 0, 0, 0.15);
    border-radius: 6px;
}

.loyalty-info {
    background: rgba(0, 0, 0, 0.1);
    padding: 14px;
    border-radius: 8px;
}

.info-card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    border: 1px solid #e9ecef;
}

.info-card .card-header {
    font-size: 1.1rem;
    letter-spacing: 0.5px;
    border-bottom: 3px solid #ffb300;
}

.info-card .form-control,
.info-card .form-select {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 10px 12px;
    transition: all 0.3s ease;
    font-size: 0.95rem;
}

.info-card .form-control:focus,
.info-card .form-select:focus {
    border-color: #ffc107;
    box-shadow: 0 0 0 3px rgba(255, 193, 7, 0.1);
    color: #212529;
}

.info-card .form-label {
    font-size: 0.95rem;
    margin-bottom: 6px;
    color: #495057;
}

.info-card .btn {
    border-radius: 8px;
    padding: 10px 20px;
    font-weight: 600;
    transition: all 0.3s ease;
}

.info-card .btn-warning {
    background: #ffc107;
    border: none;
}

.info-card .btn-warning:hover {
    background: #ffb300;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
}

.info-card .btn-outline-secondary:hover {
    transform: translateY(-2px);
}

@media (max-width: 768px) {
    .profile-page {
        padding: 20px 0;
    }

    .loyalty-card {
        margin-bottom: 20px;
    }

    .info-card .card-body {
        padding: 1.5rem !important;
    }

    .row.g-4 {
        margin: 0 -12px;
    }

    .col-lg-4,
    .col-lg-8 {
        padding-left: 12px;
        padding-right: 12px;
    }
}
</style>
