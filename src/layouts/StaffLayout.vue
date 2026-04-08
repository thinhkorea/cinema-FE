<template>
    <div class="staff-layout d-flex">
        <!-- Sidebar -->
        <div class="staff-sidebar p-3 d-flex flex-column justify-content-between">
            <div>
                <h5 class="mb-4">🎬 Staff Panel</h5>

                <ul class="nav flex-column">
                    <li class="nav-item mb-2">
                        <router-link to="/staff/seat-map" class="nav-link" active-class="active">
                            <i class="bi bi-ticket-detailed me-2"></i> Bán vé
                        </router-link>
                    </li>

                    <li class="nav-item mb-2">
                        <router-link to="/staff/showtimes" class="nav-link" active-class="active">
                            <i class="bi bi-clock-history me-2"></i> Suất chiếu
                        </router-link>
                    </li>

                    <li class="nav-item mb-2">
                        <router-link to="/staff/sold-tickets" class="nav-link" active-class="active">
                            <i class="bi bi-receipt me-2"></i> Vé đã bán
                        </router-link>
                    </li>

                    <!-- 🔍 Tra cứu vé -->
                    <li class="nav-item mb-2">
                        <router-link to="/staff/search-ticket" class="nav-link" active-class="active">
                            <i class="bi bi-search me-2"></i> Tra cứu vé
                        </router-link>
                    </li>
                </ul>
            </div>

            <!-- Thông tin nhân viên -->
            <div class="text-center mt-4 border-top pt-3 staff-footer">
                <p class="mb-1 fw-bold">{{ auth.username || "Nhân viên" }}</p>
                <button class="btn btn-outline-primary btn-sm w-100 mb-2" @click="goHome">
                    <i class="bi bi-house me-1"></i> Trang chủ
                </button>
                <button class="btn btn-primary btn-sm w-100" @click="logout">
                    <i class="bi bi-box-arrow-right me-1"></i> Đăng xuất
                </button>
            </div>
        </div>

        <!-- Nội dung -->
        <div class="staff-content flex-grow-1 p-4">
            <router-view />
        </div>
    </div>
</template>

<script setup>
import { useAuthStore } from "@/stores/auth.store";
import { useRouter } from "vue-router";

const auth = useAuthStore();
const router = useRouter();

const logout = () => {
    auth.logout();
    router.push("/login");
};

const goHome = () => {
    router.push("/");
};
</script>

<style scoped>
.staff-layout {
    min-height: 100vh;
}

.staff-sidebar {
    width: 230px;
    min-height: 100vh;
    background-color: #ffffff;
    border-right: 1px solid #e6e6e6;
    color: #333;
}

.nav-link {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border-radius: 8px;
    transition: 0.2s;
    color: #666;
}

.nav-link:hover {
    background-color: rgba(255, 107, 53, 0.1);
    color: #ff6b35;
}

.nav-link.active {
    background-color: #ff6b35;
    color: #fff;
    font-weight: 500;
}

.staff-footer {
    border-top-color: #ececec !important;
}

.staff-content {
    background: #f5f5f5;
}
</style>
