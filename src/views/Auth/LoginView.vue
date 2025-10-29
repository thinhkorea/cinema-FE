<template>
  <div class="container py-5">
    <div class="row justify-content-center">
      <div class="col-md-4">
        <div class="card shadow-sm">
          <div class="card-body">
            <h5 class="mb-3 text-center">Đăng nhập quản trị</h5>

            <form @submit.prevent="handleLogin">
              <div class="mb-3">
                <label class="form-label">Username</label>
                <input
                  v-model="form.username"
                  class="form-control"
                  placeholder="Nhập tên đăng nhập"
                  required
                />
              </div>

              <div class="mb-3">
                <label class="form-label">Password</label>
                <input
                  type="password"
                  v-model="form.password"
                  class="form-control"
                  placeholder="Nhập mật khẩu"
                  required
                />
              </div>

              <button type="submit" class="btn btn-primary w-100">
                Đăng nhập
              </button>

              <p v-if="error" class="text-danger mt-3 text-center">{{ error }}</p>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.store'

const router = useRouter()
const auth = useAuthStore()
const form = reactive({ username: '', password: '' })
const error = ref('')

const handleLogin = async () => {
  error.value = ''
  try {
    await auth.login(form) // dùng store login() luôn

    if (auth.role === 'ADMIN') {
    router.push('/admin/dashboard')
    } else if (auth.role === 'STAFF') {
      router.push('/staff/seat-map')
    } else {
      error.value = 'Bạn không có quyền truy cập khu vực quản trị.'
    }
  } catch (err) {
    console.error('Login failed:', err)
    if (err.response?.data?.message) {
      error.value = err.response.data.message
    } else {
      error.value = 'Sai tài khoản hoặc mật khẩu.'
    }
  }
}
</script>
