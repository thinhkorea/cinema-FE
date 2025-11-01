<template>
  <div class="container text-center py-5">
    <div v-if="loading">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-3 fw-semibold text-secondary">
        Đang xử lý đăng nhập, vui lòng chờ...
      </p>
    </div>

    <div v-else-if="error">
      <p class="text-danger fw-bold">{{ error }}</p>
      <button class="btn btn-outline-primary mt-3" @click="goLogin">
        Quay lại đăng nhập
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { jwtDecode } from "jwt-decode";
import { useAuthStore } from "@/stores/auth.store";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const loading = ref(true);
const error = ref(null);

const goLogin = () => router.push("/login");

onMounted(() => {
  const token = route.query.token;

  if (!token) {
    error.value = "Không nhận được token từ máy chủ!";
    loading.value = false;
    return;
  }

  try {
    // Giải mã JWT token
    const decoded = jwtDecode(token);
    console.log("JWT decoded:", decoded);

    // Lấy fullname từ token (nếu backend có trả)
    const fullName = decoded.fullName || decoded.name || decoded.sub || decoded.email || "Khách hàng";

    // Lưu vào localStorage
    localStorage.setItem("token", token);
    localStorage.setItem("username", decoded.sub || decoded.email || "Khách hàng");
    localStorage.setItem("fullName", fullName);
    localStorage.setItem("role", decoded.role || "CUSTOMER");

    // Cập nhật Pinia store
    auth.token = token;
    auth.role = decoded.role || "CUSTOMER";
    auth.username = decoded.sub || decoded.email || "Khách hàng";
    auth.fullName = fullName;

    // Điều hướng theo vai trò
    if (decoded.role === "ADMIN") {
      router.push("/admin/dashboard");
    } else if (decoded.role === "STAFF") {
      router.push("/staff/seat-map");
    } else {
      // Mặc định cho CUSTOMER hoặc vai trò khác không xác định
      router.push("/"); 
    }
  } catch (err) {
    console.error("Lỗi giải mã token:", err);
    error.value = "Token không hợp lệ hoặc đã hết hạn!";
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.spinner-border {
  width: 3rem;
  height: 3rem;
}
</style>
