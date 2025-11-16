<template>
  <div class="container py-5">
    <div class="row justify-content-center">
      <div class="col-md-4">
        <div class="card shadow-sm border-0 p-4">
          <h4 class="mb-4 text-center text-primary fw-bold">Đăng nhập hệ thống</h4>

          <form @submit.prevent="handleLogin">
            <div class="mb-3">
              <label class="form-label">Tên đăng nhập</label>
              <input
                v-model.trim="form.username"
                class="form-control"
                placeholder="Nhập username..."
                required
              />
            </div>

            <div class="mb-3">
              <label class="form-label">Mật khẩu</label>
              <input
                type="password"
                v-model.trim="form.password"
                class="form-control"
                placeholder="Nhập mật khẩu..."
                required
              />
            </div>

            <button
              type="submit"
              class="btn btn-primary w-100"
              :disabled="loading"
            >
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              Đăng nhập
            </button>

            <p v-if="error" class="text-danger mt-3 text-center">{{ error }}</p>
          </form>

          <!-- Liên kết sang đăng ký -->
          <div class="text-center mt-3">
            <p class="mb-0">
              Chưa có tài khoản?
              <router-link to="/register" class="text-decoration-none fw-semibold text-primary">
                Đăng ký ngay
              </router-link>
            </p>
          </div>

          <!-- Hoặc đăng nhập bằng Google -->
          <div class="text-center mt-4">
            <p class="text-muted mb-2">hoặc</p>
            <button
              class="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2"
              @click="loginWithGoogle"
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                width="22"
                height="22"
                alt="Google"
              />
              <span>Đăng nhập bằng Google</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const auth = useAuthStore()
const form = reactive({ username: '', password: '' })
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
  error.value = ''
  loading.value = true

  try {
    await auth.login(form)
    switch (auth.role) {
      case 'ADMIN':
        router.push('/admin/dashboard')
        break
      case 'STAFF':
        router.push('/staff/seat-map')
        break
      case 'CUSTOMER':
        router.push('/')
        break
      default:
        error.value = 'Không xác định được quyền truy cập.'
    }
  } catch (err) {
    console.error('Login failed:', err)
    error.value =
      err.response?.data?.message ||
      'Tên đăng nhập hoặc mật khẩu không đúng.'
  } finally {
    loading.value = false
  }
}

const loginWithGoogle = () => {
  window.location.href = 'http://localhost:8080/oauth2/authorization/google'
}
</script>

<style scoped>
.btn-outline-danger:hover {
  background-color: #ea4335;
  color: white;
  border-color: #ea4335;
  transition: 0.3s;
}
.card {
  border-radius: 16px;
}
</style>
