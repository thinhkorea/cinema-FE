<template>
  <div class="container py-5">
    <h2 class="fw-bold mb-4 text-center">Hồ sơ cá nhân</h2>

    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-warning"></div>
    </div>

    <form
      v-else
      @submit.prevent="updateProfile"
      class="col-md-6 mx-auto bg-white p-4 rounded shadow-sm border"
    >
      <div class="mb-3">
        <label class="form-label fw-semibold">Họ và tên</label>
        <input v-model="profile.user.fullName" class="form-control" />
      </div>

      <div class="mb-3">
        <label class="form-label fw-semibold">Email</label>
        <input v-model="profile.email" type="email" class="form-control" />
      </div>

      <div class="mb-3">
        <label class="form-label fw-semibold">Số điện thoại</label>
        <input v-model="profile.phone" class="form-control" />
      </div>

      <div class="mb-3">
        <label class="form-label fw-semibold">Địa chỉ</label>
        <input v-model="profile.address" class="form-control" />
      </div>

      <div class="mb-3">
        <label class="form-label fw-semibold">Giới tính</label>
        <select v-model="profile.gender" class="form-select">
          <option value="MALE">Nam</option>
          <option value="FEMALE">Nữ</option>
        </select>
      </div>

      <div class="text-center">
        <button type="submit" class="btn btn-warning fw-semibold px-4">
          Lưu thay đổi
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth.store";
import api from "@/api";
import Swal from "sweetalert2";
import { useRouter } from "vue-router";

const router = useRouter();
const auth = useAuthStore();
const profile = ref({ user: {} });
const loading = ref(true);

onMounted(async () => {
  try {
    // Lấy userId từ Pinia hoặc localStorage
    const userId = auth.userId || localStorage.getItem("userId");

    if (!userId) {
      console.warn("Không tìm thấy userId, chuyển hướng về trang đăng nhập");
      Swal.fire("Thông báo", "Bạn cần đăng nhập để xem hồ sơ", "info");
      router.push("/login");
      return;
    }

    // Gọi API lấy thông tin hồ sơ
    const res = await api.get(`/auth/profile/${userId}`);
    profile.value = res.data;
  } catch (err) {
    console.error(err);
    Swal.fire("Lỗi", "Không thể tải hồ sơ", "error");
  } finally {
    loading.value = false;
  }
});
const updateProfile = async () => {
  try {
    const userId = auth.userId || localStorage.getItem("userId");

    if (!userId) {
      Swal.fire("Thông báo", "Không xác định được người dùng!", "warning");
      return;
    }

    await api.put(`/auth/profile/${userId}`, profile.value);

    await Swal.fire({
      icon: "success",
      title: "Cập nhật thành công!",
      text: "Hồ sơ của bạn đã được lưu.",
      timer: 1500,
      showConfirmButton: false,
    });

    router.push("/");
  } catch (err) {
    console.error(err);
    Swal.fire("Lỗi", "Cập nhật thất bại", "error");
  }
};
</script>

<style scoped>
form {
  background-color: #fffdf7;
}
</style>
