<template>
  <div class="container py-5" style="max-width: 500px;">
    <div class="card shadow-sm border-0 p-4">
      <h4 class="text-center mb-4 fw-bold text-primary">Đăng ký khách hàng</h4>

      <form @submit.prevent="register">
        <div class="mb-3">
          <label class="form-label">Họ và tên</label>
          <input v-model.trim="form.fullName" class="form-control" required />
        </div>

        <div class="mb-3">
          <label class="form-label">Email</label>
          <input v-model.trim="form.email" type="email" class="form-control" required />
        </div>

        <div class="mb-3">
          <label class="form-label">Tên đăng nhập</label>
          <input v-model.trim="form.username" class="form-control" required />
        </div>

        <div class="mb-3">
          <label class="form-label">Mật khẩu</label>
          <input
            v-model.trim="form.password"
            type="password"
            class="form-control"
            required
            minlength="6"
          />
        </div>

        <div class="mb-3">
          <label class="form-label">Số điện thoại</label>
          <input v-model.trim="form.phone" class="form-control" placeholder="VD: 0901234567" />
        </div>

        <div class="mb-3">
          <label class="form-label">Địa chỉ</label>
          <input
            v-model.trim="form.address"
            class="form-control"
            placeholder="VD: 123 Lý Thường Kiệt, TP.HCM"
          />
        </div>

        <div class="mb-3">
          <label class="form-label">Giới tính</label>
          <select v-model="form.gender" class="form-select">
            <option value="MALE">Nam</option>
            <option value="FEMALE">Nữ</option>
          </select>
        </div>

        <button type="submit" class="btn btn-primary w-100" :disabled="loading">
          <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
          Đăng ký
        </button>
      </form>

      <div class="text-center mt-3">
        <p class="mb-0">
          Đã có tài khoản?
          <router-link to="/login" class="text-decoration-none text-primary fw-semibold">
            Đăng nhập ngay
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import Swal from "sweetalert2";
import api from "@/api";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";

const router = useRouter();
const auth = useAuthStore();
const loading = ref(false);

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
  if (!form.value.username || !form.value.password || !form.value.email) {
    Swal.fire("Thiếu thông tin", "Vui lòng nhập đầy đủ thông tin!", "warning");
    return;
  }

  try {
    loading.value = true;

    // B1: Gửi đăng ký tài khoản
    const res = await api.post("/auth/register", form.value);
    console.log("Register success:", res.data);

    // B2: Đăng nhập tự động bằng store
    await auth.login({
      username: form.value.username,
      password: form.value.password,
    });

    // B3: Hiển thị thông báo
    await Swal.fire({
      icon: "success",
      title: "Đăng ký & đăng nhập thành công!",
      text: `Chào mừng ${auth.fullName || auth.username}!`,
      timer: 2000,
      showConfirmButton: false,
      willClose: () => Swal.close(), // Đảm bảo đóng overlay
    });

    // B4: Chuyển hướng theo role
    if (auth.role === "ADMIN") router.push("/admin/dashboard");
    else if (auth.role === "STAFF") router.push("/staff/seat-map");
    else router.push("/");

  } catch (err) {
    console.error("Register/Login error:", err);
    const msg =
      err.response?.data?.error ||
      err.response?.data ||
      "Đăng ký thất bại, vui lòng thử lại!";
    Swal.fire("Lỗi", msg, "error");
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.card {
  border-radius: 16px;
}
.btn-primary {
  background: linear-gradient(135deg, #007bff, #0056b3);
  border: none;
}
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(0, 123, 255, 0.3);
}
</style>
