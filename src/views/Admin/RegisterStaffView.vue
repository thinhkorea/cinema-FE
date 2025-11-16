<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3 class="fw-bold text-primary">Quản lý nhân viên</h3>
      <button class="btn btn-success" @click="openAddModal">
        <i class="bi bi-plus-circle me-1"></i> Thêm nhân viên
      </button>
    </div>

    <!-- Bảng danh sách -->
    <div class="card shadow-sm border-0">
      <div class="card-body">
        <table class="table table-hover align-middle">
          <thead class="table-light">
            <tr>
              <th>#</th>
              <th>Họ tên</th>
              <th>Tài khoản</th>
              <th>Email</th>
              <th>Số điện thoại</th>
              <th>Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(s, i) in staffs" :key="s.userId">
              <td>{{ i + 1 }}</td>
              <td>{{ s.fullName }}</td>
              <td>{{ s.username }}</td>
              <td>{{ s.email || '-' }}</td>
              <td>{{ s.phone || '-' }}</td>
              <td>{{ new Date(s.createdAt).toLocaleString() }}</td>
            </tr>
            <tr v-if="!staffs.length">
              <td colspan="6" class="text-center text-muted py-3">
                Chưa có nhân viên nào.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal thêm nhân viên -->
    <div
      class="modal fade"
      id="addStaffModal"
      tabindex="-1"
      aria-labelledby="addStaffModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold" id="addStaffModalLabel">
              ➕ Thêm nhân viên mới
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>

          <div class="modal-body">
            <form @submit.prevent="createStaff">
              <div class="mb-3">
                <label class="form-label">Họ và tên</label>
                <input v-model="form.fullName" class="form-control" required />
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
                <label class="form-label">Email</label>
                <input v-model="form.email" type="email" class="form-control" />
              </div>
              <div class="mb-3">
                <label class="form-label">Số điện thoại</label>
                <input v-model="form.phone" class="form-control" />
              </div>
              <div class="mb-3">
                <label class="form-label">CCCD</label>
                <input v-model="form.cccd" class="form-control" />
              </div>

              <div class="mb-3">
                <label class="form-label">Chức vụ</label>
                <input v-model="form.position" class="form-control" />
              </div>

              <div class="mb-3">
                <label class="form-label">Lương</label>
                <input v-model="form.salary" type="number" class="form-control" />
              </div>

              <div class="mb-3">
                <label class="form-label">Giới tính</label>
                <select v-model="form.gender" class="form-select">
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                </select>
              </div>

              <div class="text-end">
                <button type="submit" class="btn btn-primary" :disabled="loading">
                  <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
                  Lưu lại
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import api from "@/api";
import Swal from "sweetalert2";
import * as bootstrap from "bootstrap";

const staffs = ref([]);
const loading = ref(false);
const form = ref({
  username: "",
  password: "",
  fullName: "",
  email: "",
  phone: "",
  cccd: "",
  position: "",
  salary: null,
  gender: "MALE",
});

let modalInstance;

const loadStaffs = async () => {
  try {
    const res = await api.get("/admin/staffs");
    staffs.value = res.data;
  } catch (err) {
    console.error(err);
    Swal.fire("Lỗi", "Không thể tải danh sách nhân viên!", "error");
  }
};

const openAddModal = () => {
  form.value = { username: "", password: "", fullName: "", email: "", phone: "" };
  modalInstance = new bootstrap.Modal(document.getElementById("addStaffModal"));
  modalInstance.show();
};

const createStaff = async () => {
  try {
    loading.value = true;
    await api.post("/auth/register-staff", form.value);

    Swal.fire({
      icon: "success",
      title: "Thêm nhân viên thành công!",
      timer: 1500,
      showConfirmButton: false,
    });

    modalInstance.hide();
    await loadStaffs();
  } catch (err) {
    console.error(err);
    Swal.fire("Lỗi", err.response?.data || "Không thể thêm nhân viên!", "error");
  } finally {
    loading.value = false;
  }
};

onMounted(loadStaffs);
</script>

<style scoped>
.card {
  border-radius: 12px;
}
.table th {
  font-weight: 600;
}
.btn-success {
  background: linear-gradient(135deg, #28a745, #218838);
  border: none;
}
</style>
