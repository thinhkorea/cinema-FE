<template>
    <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top py-3 px-4">
        <div class="container-fluid">
            <!-- Logo -->
            <router-link class="navbar-brand fw-bold text-warning fs-4" to="/">
                🍿 <span class="text-dark">CGV Cinema</span>
            </router-link>

            <!-- Toggle (mobile) -->
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>

            <!-- Menu -->
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav mx-auto">
                    <li class="nav-item">
                        <router-link to="/" class="nav-link" exact>Trang chủ</router-link>
                    </li>
                    <li class="nav-item">
                        <router-link to="/movies" class="nav-link">Phim</router-link>
                    </li>
                    <li v-if="auth.isAuthenticated" class="nav-item">
                        <router-link to="/my-bookings" class="nav-link">
                            <i class="bi me-1"></i>Vé của tôi
                        </router-link>
                    </li>
                    <li class="nav-item">
                        <router-link to="/promotions" class="nav-link">Khuyến mãi</router-link>
                    </li>
                    <li class="nav-item">
                        <router-link to="/contact" class="nav-link">Liên hệ</router-link>
                    </li>
                </ul>

                <!-- User -->
                <ul class="navbar-nav ms-auto">
                    <template v-if="auth.isAuthenticated">
                        <li
                            class="nav-item d-flex align-items-center position-relative user-area"
                            @mouseenter="showDropdown = true"
                            @mouseleave="showDropdown = false"
                        >
                            <!-- Vùng chào -->
                            <div class="d-flex align-items-center px-2 py-1 user-trigger">
                                <span class="me-1 text-secondary small">Xin chào,</span>
                                <span class="fw-bold text-dark user-name">
                                    {{ auth.fullName || auth.username }}
                                </span>
                                <span class="ms-1">🎟️</span>
                            </div>

                            <!-- Dropdown -->
                            <transition name="fade-slide">
                                <ul
                                    v-if="showDropdown"
                                    class="dropdown-menu dropdown-menu-end shadow-sm show"
                                    style="display: block"
                                >
                                    <li>
                                        <router-link class="dropdown-item" to="/profile">
                                            <i class="bi bi-person-circle me-2"></i> Hồ sơ cá nhân
                                        </router-link>
                                    </li>
                                </ul>
                            </transition>

                            <!-- Nút đăng xuất -->
                            <button class="btn btn-outline-danger btn-sm ms-2" @click="handleLogout">
                                <i class="bi bi-box-arrow-right me-1"></i> Đăng xuất
                            </button>
                        </li>
                    </template>

                    <template v-else>
                        <li class="nav-item ms-2">
                            <router-link to="/login" class="btn btn-outline-primary btn-sm">
                                <i class="bi bi-person me-1"></i> Đăng nhập
                            </router-link>
                        </li>
                        <li class="nav-item ms-2">
                            <router-link to="/register" class="btn btn-primary btn-sm text-white">
                                Đăng ký
                            </router-link>
                        </li>
                    </template>
                </ul>
            </div>
        </div>
    </nav>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";

const router = useRouter();
const auth = useAuthStore();
const showDropdown = ref(false);

const handleLogout = () => {
    auth.logout();
    router.push("/");
};
</script>

<style scoped>
.navbar {
    font-size: 16px;
    z-index: 1050;
}

.nav-link {
    color: #444 !important;
    font-weight: 500;
    transition: 0.3s;
    padding: 0.5rem 1rem;
}

.nav-link:hover,
.router-link-active {
    color: #ff9900 !important;
}

.navbar-brand {
    font-weight: bold;
}

/* Hover vùng user rộng hơn */
.user-area {
    position: relative;
    cursor: pointer;
}

.user-trigger {
    border-radius: 6px;
    transition: background-color 0.2s;
}

.user-trigger:hover {
    background-color: #fff3cd;
}

/* Dropdown hồ sơ */
.dropdown-menu {
    border-radius: 8px;
    border: none;
    padding: 0.5rem 0;
    min-width: 180px;
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    opacity: 0;
    transform: translateY(-10px);
    pointer-events: none;
    transition: all 0.2s ease-in-out;
}

/* Khi hiện */
.dropdown-menu.show {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
}

/* Item */
.dropdown-item {
    font-size: 14px;
    padding: 0.5rem 1.2rem;
    transition: 0.2s;
}

.dropdown-item:hover {
    background-color: #fff7e6;
    color: #ff9900;
}

/* Hiệu ứng transition */
.fade-slide-enter-active,
.fade-slide-leave-active {
    transition: all 0.25s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}
</style>
