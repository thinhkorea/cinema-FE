<template>
    <div class="container py-4">
        <!-- Ô nhập mã giao dịch -->
        <div class="input-group mb-4">
            <input v-model="txnRef" type="text" class="form-control" placeholder="Nhập mã giao dịch (txnRef)..." />
            <button class="btn btn-primary" @click="searchTicket" :disabled="loading">
                <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
                Tra cứu
            </button>
        </div>

        <!-- Kết quả -->
        <div v-if="tickets.length > 0" class="mt-4">
            <h5 class="mb-3">
                Kết quả cho mã giao dịch:
                <span class="text-primary">{{ txnRef }}</span>
            </h5>

            <table class="table table-bordered align-middle">
                <thead class="table-light">
                    <tr>
                        <th>#</th>
                        <th>Phim</th>
                        <th>Phòng</th>
                        <th>Ghế</th>
                        <th>Suất chiếu</th>
                        <th>Trạng thái</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(ticket, index) in tickets" :key="ticket.bookingId">
                        <td>{{ index + 1 }}</td>
                        <td>{{ ticket.movieTitle }}</td>
                        <td>{{ ticket.roomName }}</td>
                        <td>{{ ticket.seatNumber }}</td>
                        <td>{{ formatDateTime(ticket.startTime) }}</td>
                        <td>
                            <span
                                class="badge"
                                :class="ticket.status === 'PAID' ? 'bg-success' : 'bg-warning text-dark'"
                            >
                                {{ ticket.status }}
                            </span>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div class="mt-4">
                <h6 class="mb-2">Bắp nước đi kèm</h6>
                <div v-if="snacks.length > 0" class="table-responsive">
                    <table class="table table-sm table-bordered align-middle mb-0">
                        <thead class="table-light">
                            <tr>
                                <th>#</th>
                                <th>Sản phẩm</th>
                                <th>Số lượng</th>
                                <th>Tạm tính</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(snack, index) in snacks" :key="`${snack.snackName}-${index}`">
                                <td>{{ index + 1 }}</td>
                                <td>{{ snack.snackName }}</td>
                                <td>{{ snack.quantity }}</td>
                                <td>{{ formatCurrency(snack.subtotal) }}</td>
                            </tr>
                            <tr class="fw-bold table-warning">
                                <td colspan="3" class="text-end">Tổng bắp nước</td>
                                <td>{{ formatCurrency(snackTotal) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-else class="text-muted">Không có bắp nước cho mã giao dịch này.</div>
            </div>

            <div v-if="snacks.length > 0" class="mt-3 d-flex flex-wrap align-items-center gap-2">
                <button class="btn btn-warning" @click="fulfillSnacks" :disabled="fulfilling || snacksFulfilled">
                    <span v-if="fulfilling" class="spinner-border spinner-border-sm me-2"></span>
                    <i class="bi bi-box-seam me-2"></i>
                    Xác nhận xuất bắp nước
                </button>
            </div>

            <!-- Hành động in -->
            <div class="text-center mt-4">
                <button
                    class="btn btn-success px-4"
                    v-if="!printedTxn.includes(txnRef)"
                    @click="printGroup"
                    :disabled="printing"
                >
                    <span v-if="printing" class="spinner-border spinner-border-sm me-2"></span>
                    <i class="bi bi-printer me-2"></i> In toàn bộ vé
                </button>

                <div v-else class="text-success fw-bold mt-2">
                    <i class="bi bi-check-circle-fill me-1"></i> Đã in vé cho mã này
                </div>
            </div>
        </div>

        <!-- Nếu chưa tìm thấy -->
        <div v-else-if="searched && tickets.length === 0" class="text-muted text-center py-4">
            Không tìm thấy vé với mã giao dịch này.
        </div>
    </div>
</template>

<script setup>
import { computed, ref } from "vue";
import api from "@/api";
import { showCinemaAlert, showCinemaToast } from "@/utils/cinemaAlert";

const txnRef = ref("");
const tickets = ref([]);
const snacks = ref([]);
const loading = ref(false);
const printing = ref(false);
const printedTxn = ref([]); // danh sách txnRef đã in
const searched = ref(false);
const fulfilling = ref(false);
const snackTotal = computed(() => snacks.value.reduce((sum, item) => sum + item.subtotal, 0));
const snacksFulfilled = computed(
    () => tickets.value.length > 0 && tickets.value.every((ticket) => ticket.snacksFulfilled),
);

// === Tra cứu vé ===
async function searchTicket() {
    if (!txnRef.value.trim()) {
        await showCinemaAlert({
            icon: "warning",
            title: "Thiếu mã giao dịch",
            text: "Vui lòng nhập mã giao dịch!",
        });
        return;
    }
    loading.value = true;
    searched.value = false;

    try {
        const res = await api.get(`/bookings/txn/${txnRef.value.trim()}`);
        tickets.value = res.data || [];

        try {
            const snackRes = await api.get(`/snacks/txn/${txnRef.value.trim()}`);
            snacks.value = mergeSnackItems(snackRes.data || []);
        } catch (snackErr) {
            console.warn("Không thể tải thông tin bắp nước:", snackErr);
            snacks.value = [];
        }

        searched.value = true;

        if (tickets.value.length === 0) {
            await showCinemaAlert({
                icon: "warning",
                title: "Không tìm thấy vé",
                text: "Không tìm thấy vé với mã giao dịch này.",
            });
        } else if (snacks.value.length === 0) {
            await showCinemaToast({
                icon: "info",
                title: "Không có bắp nước",
                text: "Mã giao dịch này không kèm bắp nước.",
            });
        }

        // Nếu tất cả vé đều printed = true → chặn nút in
        if (tickets.value.length > 0 && tickets.value.every((t) => t.printed)) {
            const trimmedTxn = txnRef.value.trim();
            printedTxn.value.push(trimmedTxn);
        }

        console.log("Vé tìm được:", res.data);
    } catch (err) {
        console.error("Lỗi tra cứu vé:", err);
        snacks.value = [];
        searched.value = true;
        await showCinemaAlert({
            icon: "error",
            title: "Tra cứu thất bại",
            text: "Không thể tra cứu vé. Kiểm tra kết nối hoặc mã giao dịch.",
        });
    } finally {
        loading.value = false;
    }
}

function mergeSnackItems(items) {
    const grouped = new Map();
    for (const item of items) {
        const key = String(item.snackId ?? item.snackName ?? "unknown");
        if (!grouped.has(key)) {
            grouped.set(key, {
                snackName: item.snackName,
                quantity: 0,
                subtotal: 0,
            });
        }
        const entry = grouped.get(key);
        entry.quantity += Number(item.quantity || 0);
        entry.subtotal += Number(item.subtotal || 0);
    }
    return Array.from(grouped.values());
}

// === In tất cả vé trong nhóm ===
async function printGroup() {
    const currentTxnRef = txnRef.value.trim();
    if (!currentTxnRef) return;

    printing.value = true;

    try {
        // Mở trang in trong một tab mới
        const printUrl = `/staff/ticket/${currentTxnRef}`;
        window.open(printUrl, "_blank");

        // Gọi API để cập nhật trường printed = true trong database
        await api.post(`/bookings/mark-printed/${currentTxnRef}`);

        // Cập nhật UI - thêm vào danh sách đã in
        if (!printedTxn.value.includes(currentTxnRef)) {
            printedTxn.value.push(currentTxnRef);
        }
        console.log("Đã đánh dấu in vé cho:", currentTxnRef);
    } catch (err) {
        console.error("Lỗi khi cập nhật trạng thái in:", err);
    } finally {
        printing.value = false;
    }
}

async function fulfillSnacks() {
    const currentTxnRef = txnRef.value.trim();
    if (!currentTxnRef) return;

    fulfilling.value = true;
    try {
        const res = await api.post(`/staff/snacks/fulfill/${currentTxnRef}`);
        await showCinemaAlert({
            icon: "success",
            title: "Xuất kho thành công",
            text: res.data?.message || "Đã xuất bắp nước cho mã giao dịch này.",
        });
        await searchTicket();
    } catch (err) {
        console.error("Lỗi khi xuất bắp nước:", err);
        await showCinemaAlert({
            icon: "error",
            title: "Xuất kho thất bại",
            text: err?.response?.data?.error || "Không thể xuất bắp nước. Vui lòng thử lại.",
        });
    } finally {
        fulfilling.value = false;
    }
}

// === Format thời gian ===
function formatDateTime(t) {
    return new Date(t).toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function formatCurrency(value) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(value || 0);
}
</script>

<style scoped>
.table {
    font-size: 0.95rem;
}

input.form-control {
    max-width: 350px;
}

.text-success i {
    color: #ff6b35;
}

.bi-printer {
    font-size: 1rem;
}
</style>
