<template>
    <nav class="navbar navbar-expand-lg navbar-dark sticky-top py-4 px-4">
        <div class="container-fluid">
            <!-- Logo -->
            <router-link class="navbar-brand fw-bold fs-3" to="/">
                <span class="brand-text">CAJ Cinema</span>
            </router-link>

            <!-- Toggle (mobile) -->
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>

            <!-- Menu -->
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav mx-auto gap-4">
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
                </ul>

                <!-- User -->
                <ul class="navbar-nav ms-auto gap-2">
                    <template v-if="auth.isAuthenticated">
                        <li
                            class="nav-item d-flex align-items-center position-relative user-area"
                            @mouseenter="showDropdown = true"
                            @mouseleave="showDropdown = false"
                        >
                            <!-- Vùng chào -->
                            <div class="d-flex align-items-center px-3 py-2 user-trigger">
                                <span class="me-2 text-light">Xin chào,</span>
                                <span class="fw-bold user-name">
                                    {{ auth.fullName || auth.username }}
                                </span>
                                <span class="ms-1"></span>
                            </div>

                            <!-- Dropdown -->
                            <transition name="fade-slide">
                                <ul
                                    v-if="showDropdown"
                                    class="dropdown-menu dropdown-menu-end shadow-lg show"
                                    style="display: block"
                                >
                                    <li>
                                        <router-link class="dropdown-item" to="/profile">
                                            <i class="bi bi-person-circle me-2"></i> Hồ sơ cá nhân
                                        </router-link>
                                    </li>
                                    <li v-if="auth.isAdmin || auth.isStaff">
                                        <hr class="dropdown-divider" />
                                    </li>
                                    <li v-if="auth.isAdmin">
                                        <button class="dropdown-item w-100 text-start" @click="goDashboard">
                                            <i class="bi bi-speedometer2 me-2"></i> Admin Dashboard
                                        </button>
                                    </li>
                                    <li v-if="auth.isStaff">
                                        <button class="dropdown-item w-100 text-start" @click="goDashboard">
                                            <i class="bi bi-ticket-detailed me-2"></i> Staff Panel
                                        </button>
                                    </li>
                                </ul>
                            </transition>

                            <!-- Nút đăng xuất -->
                            <button class="btn btn-outline-gold btn-sm ms-3" @click="handleLogout">
                                <i class="bi bi-box-arrow-right me-1"></i> Đăng xuất
                            </button>
                        </li>
                    </template>

                    <template v-else>
                        <li class="nav-item ms-2">
                            <router-link to="/login" class="btn btn-outline-gold btn-sm">
                                <i class="bi bi-person me-1"></i> Đăng nhập
                            </router-link>
                        </li>
                        <li class="nav-item ms-2">
                            <router-link to="/register" class="btn btn-gold btn-sm"> Đăng ký </router-link>
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

const goDashboard = () => {
    showDropdown.value = false;
    if (auth.isAdmin) {
        router.push("/admin/dashboard");
    } else if (auth.isStaff) {
        router.push("/staff/seat-map");
    }
};
</script>

<style scoped>
/* Dark theme navbar with black background and gold accents */
.navbar {
    background: linear-gradient(to bottom, #1a1a1a, #121212);
    font-size: 17px;
    z-index: 1050;
    border-bottom: 1px solid #2a2a2a;
    min-height: 70px;
}

/* Brand text in gold/yellow */
.brand-text {
    color: #ffc107 !important;
    font-weight: 700;
    letter-spacing: 0.5px;
}

/* Light text for navigation links on dark background */
.nav-link {
    color: #e0e0e0 !important;
    font-weight: 500;
    transition: all 0.3s ease;
    padding: 0.5rem 1rem;
    line-height: 1.5;
}

.nav-link:hover,
.router-link-active {
    color: #ffc107 !important;
    text-shadow: 0 0 8px rgba(255, 193, 7, 0.3);
}

.navbar-brand {
    font-weight: bold;
}

/* Dark navbar toggler for mobile */
.navbar-toggler {
    border-color: rgba(255, 193, 7, 0.5);
}

.navbar-toggler:focus {
    box-shadow: 0 0 0 0.25rem rgba(255, 193, 7, 0.25);
}

/* Hover vùng user rộng hơn */
.user-area {
    position: relative;
    cursor: pointer;
}

.user-trigger {
    border-radius: 6px;
    transition: all 0.2s ease;
}

.user-trigger:hover {
    background-color: rgba(255, 193, 7, 0.1);
}

.user-name {
    color: #ffc107 !important;
}

/* Dark dropdown menu */
.dropdown-menu {
    background-color: #1a1a1a;
    border: 1px solid #2a2a2a;
    border-radius: 8px;
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
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
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
    transition: all 0.2s ease;
    color: #e0e0e0 !important;
}

.dropdown-item:hover {
    background-color: rgba(255, 193, 7, 0.1);
    color: #ffc107 !important;
}

/* Dropdown divider */
.dropdown-divider {
    border-color: #2a2a2a;
}

/* Gold buttons matching dark theme */
.btn-outline-gold {
    color: #ffc107;
    border-color: #ffc107;
}

.btn-outline-gold:hover {
    background-color: #ffc107;
    border-color: #ffc107;
    color: #1a1a1a;
}

.btn-gold {
    background-color: #ffc107;
    border-color: #ffc107;
    color: #1a1a1a;
    font-weight: 600;
}

.btn-gold:hover {
    background-color: #ffb300;
    border-color: #ffb300;
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

/* Responsive adjustments */
@media (max-width: 991px) {
    .navbar-collapse {
        background-color: rgba(26, 26, 26, 0.95);
        border-top: 1px solid #2a2a2a;
        margin-top: 0.5rem;
        padding-top: 0.5rem;
    }
}
</style>
