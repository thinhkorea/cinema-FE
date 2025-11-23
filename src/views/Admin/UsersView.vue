<template>
    <div class="container py-4">
        <!-- Header -->
        <h4 class="mb-4 d-flex align-items-center"><i class="bi bi-people me-2"></i> Quản lý tài khoản người dùng</h4>

        <!-- Tabs: Customers & Staffs -->
        <div class="mb-4">
            <ul class="nav nav-tabs" role="tablist">
                <li class="nav-item" role="presentation">
                    <button
                        class="nav-link"
                        :class="{ active: activeTab === 'customers' }"
                        @click="activeTab = 'customers'"
                        type="button"
                    >
                        <i class="bi bi-person-circle me-2"></i> Khách hàng
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button
                        class="nav-link"
                        :class="{ active: activeTab === 'staffs' }"
                        @click="activeTab = 'staffs'"
                        type="button"
                    >
                        <i class="bi bi-person-workspace me-2"></i> Nhân viên
                    </button>
                </li>
            </ul>
        </div>

        <!-- Tab Content: Customers -->
        <div v-show="activeTab === 'customers'" class="full-width-section">
            <h5 class="mb-4">Danh sách khách hàng</h5>

            <div v-if="loadingUsers" class="text-center py-5">
                <div class="spinner-border text-primary"></div>
            </div>

            <div v-else-if="customers.length === 0" class="alert alert-info">Chưa có khách hàng nào</div>

            <div v-else class="table-responsive">
                <table class="table table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>#</th>
                            <th>Tên tài khoản</th>
                            <th>Tên đầy đủ</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(user, index) in customers" :key="user.userId">
                            <td>{{ index + 1 }}</td>
                            <td class="fw-semibold">{{ user.username }}</td>
                            <td>{{ user.fullName || "N/A" }}</td>
                            <td>
                                <span class="badge" :class="user.isActive ? 'bg-success' : 'bg-danger'">
                                    {{ user.isActive ? "Hoạt động" : "Bị khóa" }}
                                </span>
                            </td>
                            <td>
                                <button
                                    v-if="user.isActive"
                                    class="btn btn-sm btn-warning me-2"
                                    @click="lockUser(user.userId)"
                                    title="Khóa tài khoản"
                                >
                                    <i class="bi bi-lock"></i> Khóa
                                </button>
                                <button
                                    v-else
                                    class="btn btn-sm btn-info me-2"
                                    @click="unlockUser(user.userId)"
                                    title="Mở khóa tài khoản"
                                >
                                    <i class="bi bi-unlock"></i> Mở khóa
                                </button>
                                <button
                                    class="btn btn-sm btn-danger"
                                    @click="deleteUser(user.userId, user.username)"
                                    title="Xóa tài khoản"
                                >
                                    <i class="bi bi-trash"></i> Xóa
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Tab Content: Staffs -->
        <div v-show="activeTab === 'staffs'" class="full-width-section">
            <h5 class="mb-4">Danh sách nhân viên</h5>

            <div v-if="loadingStaffs" class="text-center py-5">
                <div class="spinner-border text-primary"></div>
            </div>

            <div v-else-if="staffs.length === 0" class="alert alert-info">Chưa có nhân viên nào</div>

            <div v-else class="table-responsive">
                <table class="table table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>#</th>
                            <th>Tên tài khoản</th>
                            <th>Tên đầy đủ</th>
                            <th>Email</th>
                            <th>Điện thoại</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(staff, index) in staffs" :key="staff.staffId">
                            <td>{{ index + 1 }}</td>
                            <td class="fw-semibold">{{ staff.username }}</td>
                            <td>{{ staff.fullName || "N/A" }}</td>
                            <td>{{ staff.email || "N/A" }}</td>
                            <td>{{ staff.phone || "N/A" }}</td>
                            <td>
                                <span class="badge" :class="staff.isActive ? 'bg-success' : 'bg-danger'">
                                    {{ staff.isActive ? "Hoạt động" : "Bị khóa" }}
                                </span>
                            </td>
                            <td>
                                <button
                                    v-if="staff.isActive"
                                    class="btn btn-sm btn-warning me-2"
                                    @click="lockStaff(staff.username, staff.userId)"
                                    title="Khóa tài khoản"
                                >
                                    <i class="bi bi-lock"></i> Khóa
                                </button>
                                <button
                                    v-else
                                    class="btn btn-sm btn-info me-2"
                                    @click="unlockStaff(staff.username, staff.userId)"
                                    title="Mở khóa tài khoản"
                                >
                                    <i class="bi bi-unlock"></i> Mở khóa
                                </button>
                                <button
                                    class="btn btn-sm btn-danger"
                                    @click="deleteStaff(staff.username, staff.userId)"
                                    title="Xóa tài khoản"
                                >
                                    <i class="bi bi-trash"></i> Xóa
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Modal xác nhận -->
    <div class="modal fade" id="confirmModal" tabindex="-1" ref="confirmModalRef">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Xác nhận hành động</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    {{ confirmMessage }}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
                    <button type="button" class="btn btn-primary" @click="confirmAction" data-bs-dismiss="modal">
                        Xác nhận
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal thông báo kết quả -->
    <div class="modal fade" id="resultModal" tabindex="-1" ref="resultModalRef">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg">
                <div class="modal-header border-0" :class="resultStatus === 'success' ? 'bg-success' : 'bg-danger'">
                    <h5 class="modal-title text-white d-flex align-items-center">
                        <i
                            :class="
                                resultStatus === 'success' ? 'bi bi-check-circle-fill' : 'bi bi-exclamation-circle-fill'
                            "
                            class="me-2"
                        ></i>
                        {{ resultStatus === "success" ? "Thành công" : "Lỗi" }}
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body text-center py-4">
                    <i
                        :class="
                            resultStatus === 'success'
                                ? 'bi bi-check-circle text-success'
                                : 'bi bi-exclamation-triangle text-danger'
                        "
                        style="font-size: 3rem; display: block; margin-bottom: 1rem"
                    ></i>
                    <h5 class="mb-2">{{ resultMessage }}</h5>
                </div>
                <div class="modal-footer border-0">
                    <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Đóng</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import api from "../../api";
import * as bootstrap from "bootstrap";

const activeTab = ref("customers");
const customers = ref([]);
const staffs = ref([]);
const loadingUsers = ref(true);
const loadingStaffs = ref(true);

const confirmModalRef = ref(null);
let confirmModal = null;
const confirmMessage = ref("");
const pendingAction = ref(null);

const resultModalRef = ref(null);
let resultModal = null;
const resultMessage = ref("");
const resultStatus = ref("success");

// Fetch khách hàng
const fetchUsers = async () => {
    loadingUsers.value = true;
    try {
        const { data } = await api.get("/admin/users");
        customers.value = data;
    } catch (err) {
        console.error("Error loading users:", err);
        alert("Lỗi khi tải danh sách khách hàng");
    } finally {
        loadingUsers.value = false;
    }
};

// Fetch nhân viên
const fetchStaffs = async () => {
    loadingStaffs.value = true;
    try {
        const { data } = await api.get("/admin/staffs");
        staffs.value = data;
    } catch (err) {
        console.error("Error loading staffs:", err);
        alert("Lỗi khi tải danh sách nhân viên");
    } finally {
        loadingStaffs.value = false;
    }
};

// Khóa tài khoản khách hàng
const lockUser = (userId) => {
    const user = customers.value.find((u) => u.userId === userId);
    confirmMessage.value = `Bạn có chắc chắn muốn khóa tài khoản "${user.username}" không?`;
    pendingAction.value = async () => {
        try {
            await api.put(`/admin/users/${userId}/lock`);
            await fetchUsers();
            showResultModal("Khóa tài khoản thành công", "success");
        } catch (err) {
            console.error("Error locking user:", err);
            showResultModal("Lỗi khi khóa tài khoản", "error");
        }
    };
    showConfirmModal();
};

// Mở khóa tài khoản khách hàng
const unlockUser = (userId) => {
    const user = customers.value.find((u) => u.userId === userId);
    confirmMessage.value = `Bạn có chắc chắn muốn mở khóa tài khoản "${user.username}" không?`;
    pendingAction.value = async () => {
        try {
            await api.put(`/admin/users/${userId}/unlock`);
            await fetchUsers();
            showResultModal("Mở khóa tài khoản thành công", "success");
        } catch (err) {
            console.error("Error unlocking user:", err);
            showResultModal("Lỗi khi mở khóa tài khoản", "error");
        }
    };
    showConfirmModal();
};

// Xóa tài khoản khách hàng
const deleteUser = (userId, username) => {
    confirmMessage.value = `Bạn có chắc chắn muốn xóa tài khoản "${username}" không? Hành động này không thể hoàn tác.`;
    pendingAction.value = async () => {
        try {
            await api.delete(`/admin/users/${userId}`);
            await fetchUsers();
            showResultModal("Xóa tài khoản thành công", "success");
        } catch (err) {
            console.error("Error deleting user:", err);
            showResultModal("Lỗi khi xóa tài khoản", "error");
        }
    };
    showConfirmModal();
};

// Khóa tài khoản nhân viên
const lockStaff = (username, userId) => {
    confirmMessage.value = `Bạn có chắc chắn muốn khóa tài khoản nhân viên "${username}" không?`;
    pendingAction.value = async () => {
        try {
            console.log("Locking staff with userId:", userId);
            await api.put(`/admin/users/${userId}/lock`);
            console.log("Lock successful");
            await fetchStaffs();
            showResultModal("Khóa tài khoản nhân viên thành công", "success");
        } catch (err) {
            console.error("Error locking staff:", err);
            showResultModal(
                "Lỗi khi khóa tài khoản nhân viên: " + (err.response?.data?.message || err.message),
                "error"
            );
        }
    };
    showConfirmModal();
};

// Mở khóa tài khoản nhân viên
const unlockStaff = (username, userId) => {
    confirmMessage.value = `Bạn có chắc chắn muốn mở khóa tài khoản nhân viên "${username}" không?`;
    pendingAction.value = async () => {
        try {
            console.log("Unlocking staff with userId:", userId);
            await api.put(`/admin/users/${userId}/unlock`);
            console.log("Unlock successful");
            await fetchStaffs();
            showResultModal("Mở khóa tài khoản nhân viên thành công", "success");
        } catch (err) {
            console.error("Error unlocking staff:", err);
            showResultModal(
                "Lỗi khi mở khóa tài khoản nhân viên: " + (err.response?.data?.message || err.message),
                "error"
            );
        }
    };
    showConfirmModal();
};

// Xóa tài khoản nhân viên
const deleteStaff = (username, userId) => {
    confirmMessage.value = `Bạn có chắc chắn muốn xóa tài khoản nhân viên "${username}" không? Hành động này không thể hoàn tác.`;
    pendingAction.value = async () => {
        try {
            console.log("Deleting staff with userId:", userId);
            await api.delete(`/admin/users/${userId}`);
            console.log("Delete successful");
            await fetchStaffs();
            showResultModal("Xóa tài khoản nhân viên thành công", "success");
        } catch (err) {
            console.error("Error deleting staff:", err);
            showResultModal(
                "Lỗi khi xóa tài khoản nhân viên: " + (err.response?.data?.message || err.message),
                "error"
            );
        }
    };
    showConfirmModal();
};

// Hiển thị modal xác nhận
const showConfirmModal = () => {
    if (!confirmModal) {
        confirmModal = new bootstrap.Modal(confirmModalRef.value);
    }
    confirmModal.show();
};

// Hiển thị modal kết quả
const showResultModal = (message, status = "success") => {
    resultMessage.value = message;
    resultStatus.value = status;

    if (!resultModal) {
        resultModal = new bootstrap.Modal(resultModalRef.value);
    }
    resultModal.show();
    
    // Tự đóng sau 2 giây
    setTimeout(() => {
        resultModal.hide();
    }, 2000);
};

// Xác nhận hành động
const confirmAction = async () => {
    if (pendingAction.value) {
        await pendingAction.value();
    }
};

// Khi component mount
onMounted(async () => {
    await fetchUsers();
    await fetchStaffs();
});
</script>

<style scoped>
.full-width-section {
    width: 100%;
    background: #fff;
    padding: 2rem;
    border-radius: 14px;
    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.1);
}

.table-responsive {
    max-width: 100%;
    overflow-x: auto;
}

.nav-tabs .nav-link {
    color: #6c757d;
    border: none;
    border-bottom: 3px solid transparent;
    cursor: pointer;
    transition: all 0.3s ease;
}

.nav-tabs .nav-link:hover {
    color: #495057;
}

.nav-tabs .nav-link.active {
    color: #0d6efd;
    border-bottom-color: #0d6efd;
    background: none;
}

.btn-sm {
    padding: 0.35rem 0.65rem;
    font-size: 0.85rem;
}
</style>
