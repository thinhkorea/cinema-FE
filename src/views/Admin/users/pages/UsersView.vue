<template>
    <div class="container py-4">
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

            <div v-else-if="customers.length === 0" class="text-muted py-3">
                Chưa có khách hàng nào
            </div>

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

            <div v-else-if="staffs.length === 0" class="text-muted py-3">
                Chưa có nhân viên nào
            </div>

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

</template>

<script setup>
import { ref, onMounted } from "vue";
import api from "@/api";
import { getApiErrorMessage, showCinemaAlert, showCinemaConfirm, showCinemaToast } from "@/utils/cinemaAlert";

const activeTab = ref("customers");
const customers = ref([]);
const staffs = ref([]);
const loadingUsers = ref(true);
const loadingStaffs = ref(true);
const notifiedEmptyUsers = ref(false);
const notifiedEmptyStaffs = ref(false);

const confirmAction = async (message) => {
    return showCinemaConfirm({
        title: "Xác nhận",
        text: message,
        confirmButtonText: "Xác nhận",
    });
};

// Fetch khách hàng
const fetchUsers = async () => {
    loadingUsers.value = true;
    try {
        const { data } = await api.get("/admin/users");
        customers.value = data;
        if (customers.value.length === 0 && !notifiedEmptyUsers.value) {
            notifiedEmptyUsers.value = true;
            await showCinemaToast({
                icon: "info",
                title: "Chưa có khách hàng",
                text: "Danh sách khách hàng đang trống.",
            });
        }
    } catch (err) {
        console.error("Error loading users:", err);
        await showCinemaAlert({
            icon: "error",
            title: "Không thể tải danh sách khách hàng",
            text: "Vui lòng thử lại sau ít phút.",
        });
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
        if (staffs.value.length === 0 && !notifiedEmptyStaffs.value) {
            notifiedEmptyStaffs.value = true;
            await showCinemaToast({
                icon: "info",
                title: "Chưa có nhân viên",
                text: "Danh sách nhân viên đang trống.",
            });
        }
    } catch (err) {
        console.error("Error loading staffs:", err);
        await showCinemaAlert({
            icon: "error",
            title: "Không thể tải danh sách nhân viên",
            text: "Vui lòng thử lại sau ít phút.",
        });
    } finally {
        loadingStaffs.value = false;
    }
};

// Khóa tài khoản khách hàng
const lockUser = (userId) => {
    const user = customers.value.find((u) => u.userId === userId);
    const message = `Bạn có chắc chắn muốn khóa tài khoản "${user.username}" không?`;
    confirmAction(message).then(async (confirmed) => {
        if (!confirmed) return;
        try {
            await api.put(`/admin/users/${userId}/lock`);
            await fetchUsers();
            await showCinemaAlert({ icon: "success", title: "Khóa tài khoản thành công", timer: 1500 });
        } catch (err) {
            console.error("Error locking user:", err);
            await showCinemaAlert({
                icon: "error",
                title: "Lỗi khi khóa tài khoản",
                text: getApiErrorMessage(err),
            });
        }
    });
};

// Mở khóa tài khoản khách hàng
const unlockUser = (userId) => {
    const user = customers.value.find((u) => u.userId === userId);
    const message = `Bạn có chắc chắn muốn mở khóa tài khoản "${user.username}" không?`;
    confirmAction(message).then(async (confirmed) => {
        if (!confirmed) return;
        try {
            await api.put(`/admin/users/${userId}/unlock`);
            await fetchUsers();
            await showCinemaAlert({ icon: "success", title: "Mở khóa tài khoản thành công", timer: 1500 });
        } catch (err) {
            console.error("Error unlocking user:", err);
            await showCinemaAlert({
                icon: "error",
                title: "Lỗi khi mở khóa tài khoản",
                text: getApiErrorMessage(err),
            });
        }
    });
};

// Xóa tài khoản khách hàng
const deleteUser = (userId, username) => {
    const message = `Bạn có chắc chắn muốn xóa tài khoản "${username}" không? Hành động này không thể hoàn tác.`;
    confirmAction(message).then(async (confirmed) => {
        if (!confirmed) return;
        try {
            const { data } = await api.delete(`/admin/users/${userId}`);
            await fetchUsers();
            await showCinemaAlert({
                icon: "success",
                title: data?.message || "Xóa tài khoản thành công",
                timer: 1800,
            });
        } catch (err) {
            console.error("Error deleting user:", err);
            await showCinemaAlert({
                icon: "error",
                title: "Lỗi khi xóa tài khoản",
                text: getApiErrorMessage(err),
            });
        }
    });
};

// Khóa tài khoản nhân viên
const lockStaff = (username, userId) => {
    const message = `Bạn có chắc chắn muốn khóa tài khoản nhân viên "${username}" không?`;
    confirmAction(message).then(async (confirmed) => {
        if (!confirmed) return;
        try {
            console.log("Locking staff with userId:", userId);
            await api.put(`/admin/users/${userId}/lock`);
            console.log("Lock successful");
            await fetchStaffs();
            await showCinemaAlert({ icon: "success", title: "Khóa tài khoản nhân viên thành công", timer: 1500 });
        } catch (err) {
            console.error("Error locking staff:", err);
            await showCinemaAlert({
                icon: "error",
                title: "Lỗi khi khóa tài khoản nhân viên",
                text: getApiErrorMessage(err),
            });
        }
    });
};

// Mở khóa tài khoản nhân viên
const unlockStaff = (username, userId) => {
    const message = `Bạn có chắc chắn muốn mở khóa tài khoản nhân viên "${username}" không?`;
    confirmAction(message).then(async (confirmed) => {
        if (!confirmed) return;
        try {
            console.log("Unlocking staff with userId:", userId);
            await api.put(`/admin/users/${userId}/unlock`);
            console.log("Unlock successful");
            await fetchStaffs();
            await showCinemaAlert({ icon: "success", title: "Mở khóa tài khoản nhân viên thành công", timer: 1500 });
        } catch (err) {
            console.error("Error unlocking staff:", err);
            await showCinemaAlert({
                icon: "error",
                title: "Lỗi khi mở khóa tài khoản nhân viên",
                text: getApiErrorMessage(err),
            });
        }
    });
};

// Xóa tài khoản nhân viên
const deleteStaff = (username, userId) => {
    const message = `Bạn có chắc chắn muốn xóa tài khoản nhân viên "${username}" không? Hành động này không thể hoàn tác.`;
    confirmAction(message).then(async (confirmed) => {
        if (!confirmed) return;
        try {
            console.log("Deleting staff with userId:", userId);
            const { data } = await api.delete(`/admin/users/${userId}`);
            console.log("Delete successful");
            await fetchStaffs();
            await showCinemaAlert({
                icon: "success",
                title: data?.message || "Xóa tài khoản nhân viên thành công",
                timer: 1800,
            });
        } catch (err) {
            console.error("Error deleting staff:", err);
            await showCinemaAlert({
                icon: "error",
                title: "Lỗi khi xóa tài khoản nhân viên",
                text: getApiErrorMessage(err),
            });
        }
    });
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
    color: #ff6b35;
    border-bottom-color: #ff6b35;
    background: none;
}

.btn-sm {
    padding: 0.35rem 0.65rem;
    font-size: 0.85rem;
}
</style>
