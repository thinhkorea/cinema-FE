<template>
  <button class="btn btn-dark d-md-none mb-2" @click="toggleSidebar">
  <i class="bi bi-list"></i>
</button>

  <div class="admin-layout d-flex">
    <!-- Sidebar -->
    <aside class="sidebar bg-dark text-white p-3">
      <h5 class="mb-4 d-flex align-items-center">
        <i class="bi bi-film me-2"></i> Admin Panel
      </h5>
      <ul class="nav flex-column">
        <li v-for="link in links" :key="link.path" class="nav-item">
          <RouterLink
            :to="link.path"
            class="nav-link text-white"
            active-class="active"
          >
            <i :class="link.icon + ' me-2'"></i>
            {{ link.label }}
          </RouterLink>
        </li>
      </ul>

      <div class="mt-auto pt-3 border-top">
        <button class="btn btn-outline-light w-100 mb-2" @click="goHome">
          <i class="bi bi-house me-2"></i> Trang chủ
        </button>
        <button class="btn btn-outline-light w-100" @click="logout">
          <i class="bi bi-box-arrow-right me-2"></i> Đăng xuất
        </button>
      </div>
    </aside>

    <!-- Nội dung -->
    <main class="content flex-grow-1 p-4">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'vue-router'

const router = useRouter()
const auth = useAuthStore()

const links = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: 'bi bi-speedometer2' },
  { label: 'Movies', path: '/admin/movies', icon: 'bi bi-film' },
  { label: 'Rooms', path: '/admin/rooms', icon: 'bi bi-door-open' },
  { label: 'Showtimes', path: '/admin/showtimes', icon: 'bi bi-clock' },
  { label: 'Bookings', path: '/admin/bookings', icon: 'bi bi-ticket' },
  { label: 'Revenue', path: '/admin/revenue', icon: 'bi bi-graph-up' },
  { label: 'Register Staff', path: '/admin/register-staff', icon: 'bi bi-person-plus' }
]

const logout = () => {
  auth.logout()
  router.push('/login')
}

const goHome = () => {
  router.push('/')
}

import { ref } from 'vue'
const showSidebar = ref(true)
const toggleSidebar = () => (showSidebar.value = !showSidebar.value)

</script>

<style scoped>
.admin-layout {
  height: 100vh;
}

.sidebar {
  width: 240px;
  display: flex;
  flex-direction: column;
}

.nav-link {
  color: #ccc;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background 0.2s;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
}

.nav-link.active {
  background: #0d6efd;
  color: white !important;
}

.content {
  background: #f8f9fa;
  overflow-y: auto;
}

.sidebar {
  transition: all 0.3s ease;
}
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    height: 100vh;
    z-index: 1000;
    left: -250px;
  }
  .sidebar.show {
    left: 0;
  }
}

</style>
