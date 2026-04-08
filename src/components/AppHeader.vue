<template>
    <nav class="navbar navbar-expand-lg navbar-light sticky-top py-4 px-4">
        <div class="container">
            <!-- Logo -->
            <router-link class="navbar-brand fw-bold fs-3 d-flex align-items-center" to="/">
                <img src="../assets/logo.png" alt="Cinema Logo" class="logo-img me-2" />
            </router-link>

            <!-- Toggle (mobile) -->
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>

            <!-- Menu -->
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav mx-auto gap-4 ms-5">
                    <li class="nav-item">
                        <router-link to="/" class="nav-link" exact>Trang chủ</router-link>
                    </li>
                    <li class="nav-item">
                        <router-link to="/movies" class="nav-link">Phim</router-link>
                    </li>
                    <li class="nav-item">
                        <router-link to="/about" class="nav-link">Giới thiệu</router-link>
                    </li>
                    <li class="nav-item">
                        <router-link to="/my-bookings" class="nav-link"> Vé của tôi </router-link>
                    </li>
                </ul>

                <!-- User -->
                <ul class="navbar-nav ms-auto gap-2">
                    <template v-if="isAuthenticated">
                        <li
                            class="nav-item d-flex align-items-center position-relative user-area"
                            @mouseenter="showDropdown = true"
                            @mouseleave="showDropdown = false"
                        >
                            <!-- Vùng chào -->
                            <div class="d-flex align-items-center px-3 py-2 user-trigger">
                                <span class="me-2 greeting-text">Xin chào,</span>
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
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";

const router = useRouter();
const auth = useAuthStore();
const showDropdown = ref(false);

// Computed để đảm bảo reactive
const isAuthenticated = computed(() => auth.isAuthenticated);
const isCustomer = computed(() => auth.isCustomer);

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
.navbar {
    background: #ffffff;
    font-size: 17px;
    z-index: 1050;
    border-bottom: 1px solid #e6e6e6;
    min-height: 70px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.brand-text {
    color: #ff6b35 !important;
    font-weight: 700;
    letter-spacing: 0.5px;
}

.logo-img {
    height: 40px;
    width: auto;
    object-fit: contain;
    border-radius: 8px;
    transition: transform 0.3s ease;
}

.navbar-brand:hover .logo-img {
    transform: scale(1.05);
}

.nav-link {
    color: #555 !important;
    font-weight: 500;
    transition: all 0.3s ease;
    padding: 0.5rem 1rem;
    line-height: 1.5;
}

.nav-link:hover,
.router-link-active {
    color: #ff6b35 !important;
    text-shadow: none;
}

.navbar-brand {
    font-weight: bold;
}

.navbar-toggler {
    border-color: rgba(255, 107, 53, 0.5);
}

.navbar-toggler:focus {
    box-shadow: 0 0 0 0.25rem rgba(255, 107, 53, 0.2);
}

.user-area {
    position: relative;
    cursor: pointer;
}

.user-trigger {
    border-radius: 6px;
    transition: all 0.2s ease;
}

.user-trigger:hover {
    background-color: rgba(255, 107, 53, 0.1);
}

.user-name {
    color: #ff6b35 !important;
}

.greeting-text {
    color: #444;
}

.dropdown-menu {
    background-color: #ffffff;
    border: 1px solid #e6e6e6;
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
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12);
}

.dropdown-menu.show {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
}

.dropdown-item {
    font-size: 14px;
    padding: 0.5rem 1.2rem;
    transition: all 0.2s ease;
    color: #444 !important;
}

.dropdown-item:hover {
    background-color: rgba(255, 107, 53, 0.08);
    color: #ff6b35 !important;
}

.dropdown-divider {
    border-color: #ececec;
}

.btn-outline-gold {
    color: #ff6b35;
    border-color: #ff6b35;
}

.btn-outline-gold:hover {
    background-color: #ff6b35;
    border-color: #ff6b35;
    color: #fff;
}

.btn-gold {
    background-color: #ff6b35;
    border-color: #ff6b35;
    color: #fff;
    font-weight: 600;
}

.btn-gold:hover {
    background-color: #ff5722;
    border-color: #ff5722;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
    transition: all 0.25s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

@media (max-width: 991px) {
    .navbar-collapse {
        background-color: rgba(255, 255, 255, 0.98);
        border-top: 1px solid #ececec;
        margin-top: 0.5rem;
        padding-top: 0.5rem;
        border-radius: 0 0 8px 8px;
    }
}
</style>
