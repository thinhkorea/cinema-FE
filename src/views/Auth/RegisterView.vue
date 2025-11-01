<template>
  <div class="container py-5" style="max-width: 500px;">
    <div class="card shadow-sm border-0 p-4">
      <h4 class="text-center mb-4">🎟️ Đăng ký khách hàng</h4>

      <form @submit.prevent="register">
        <div class="mb-3">
          <label class="form-label">Họ và tên</label>
          <input v-model="form.fullName" class="form-control" required />
        </div>

        <div class="mb-3">
          <label class="form-label">Email</label>
          <input v-model="form.email" type="email" class="form-control" required />
        </div>

        <div class="mb-3">
          <label class="form-label">Tên đăng nhập</label>
          <input v-model="form.username" class="form-control" required />
        </div>

        <div class="mb-3">
          <label class="form-label">Mật khẩu</label>
          <input v-model="form.password" type="password" class="form-control" required />
        </div>

        <div class="mb-3">
          <label class="form-label">Số điện thoại</label>
          <input v-model="form.phone" class="form-control" />
        </div>

        <div class="mb-3">
          <label class="form-label">Địa chỉ</label>
          <input v-model="form.address" class="form-control" />
        </div>

        <div class="mb-3">
          <label class="form-label">Giới tính</label>
          <select v-model="form.gender" class="form-select">
            <option value="MALE">Nam</option>
            <option value="FEMALE">Nữ</option>
          </select>
        </div>

        <button type="submit" class="btn btn-primary w-100">Đăng ký</button>
      </form>

      <div class="text-center mt-3">
        <p>Hoặc đăng nhập bằng:</p>
        <button class="btn btn-outline-danger w-100" @click="loginWithGoogle">
          <i class="bi bi-google"></i> Đăng nhập bằng Gmail
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import axios from "axios";
import { ref } from "vue";

const form = ref({
  username: "",
  password: "",
  fullName: "",
  email: "",
  phone: "",
  address: "",
  gender: "MALE",
});

const register = async () => {
  try {
    await axios.post("http://localhost:8080/api/auth/register", form.value);
    alert("Đăng ký thành công! Hãy đăng nhập.");
  } catch (err) {
    alert(err.response?.data || "Đăng ký thất bại!");
  }
};

// Tạm thời mô phỏng login bằng Gmail
const loginWithGoogle = () => {
  window.location.href = "http://localhost:8080/oauth2/authorization/google";
};
</script>
