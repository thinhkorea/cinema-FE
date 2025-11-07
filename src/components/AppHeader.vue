<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top py-3 px-4">
    <div class="container-fluid">
      <!-- Logo -->
      <router-link class="navbar-brand fw-bold text-warning fs-4" to="/">
        🍿 <span class="text-dark">CGV Cinema</span>
      </router-link>

      <!-- Toggle (mobile) -->
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
      >
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
            <li class="nav-item d-flex align-items-center">
              <span class="me-3 text-secondary small">
                Xin chào, <b>{{ auth.fullName || auth.username }}</b> 🎟️
              </span>
              <button class="btn btn-outline-danger btn-sm" @click="handleLogout">
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
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";

const router = useRouter();
const auth = useAuthStore();

const handleLogout = () => {
  auth.logout();
  router.push("/");
};
</script>

<style scoped>
.navbar {
  font-size: 16px;
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
</style>
