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
import api from "@/api";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const loading = ref(true);
const error = ref(null);

const goLogin = () => router.push("/login");

onMounted(async () => {
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

    const fullName =
      decoded.fullName || decoded.name || decoded.sub || decoded.email || "Khách hàng";

    // Lưu token vào localStorage
    localStorage.setItem("token", token);
    auth.token = token;

    // Gọi /auth/me để lấy thông tin user đầy đủ (bao gồm userId)
    const res = await api.get("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const user = res.data;
    console.log("Thông tin user từ /auth/me:", user);

    // Cập nhật Pinia store & localStorage
    auth.userId = user.userId;
    auth.username = user.username;
    auth.fullName = user.fullName || fullName;
    auth.role = user.role || decoded.role || "CUSTOMER";

    localStorage.setItem("userId", user.userId);
    localStorage.setItem("username", user.username);
    localStorage.setItem("fullName", user.fullName || fullName);
    localStorage.setItem("role", user.role || decoded.role || "CUSTOMER");

    // Điều hướng theo vai trò
    if (user.role === "ADMIN") {
      router.push("/admin/dashboard");
    } else if (user.role === "STAFF") {
      router.push("/staff/seat-map");
    } else {
      router.push("/"); // Mặc định là CUSTOMER
    }
  } catch (err) {
    console.error("Lỗi khi xử lý đăng nhập Google:", err);
    error.value = "Đăng nhập thất bại, vui lòng thử lại!";
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
