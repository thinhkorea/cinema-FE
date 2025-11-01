<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-light shadow-sm px-4">
    <div class="container-fluid">
      <router-link class="navbar-brand fw-bold text-primary" to="/">
        🎬 Cinema
      </router-link>

      <div class="d-flex ms-auto align-items-center">
        <!-- Nếu đã đăng nhập -->
        <template v-if="auth.isAuthenticated">
          <span class="me-3">
            Xin chào, <b>{{ auth.username || 'Khách hàng' }}</b> 🎟️
          </span>
          <button class="btn btn-outline-danger btn-sm" @click="handleLogout">
            <i class="bi bi-box-arrow-right me-1"></i> Đăng xuất
          </button>
        </template>

        <!-- Nếu chưa đăng nhập -->
        <template v-else>
          <router-link to="/login" class="btn btn-outline-primary btn-sm">
            <i class="bi bi-person me-1"></i> Đăng nhập
          </router-link>
        </template>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const auth = useAuthStore()

// Khôi phục session nếu reload
onMounted(() => {
  auth.restoreSession()
})

const handleLogout = () => {
  auth.logout()
  router.push('/')
}
</script>

<style scoped>
nav {
  font-size: 16px;
}
</style>
