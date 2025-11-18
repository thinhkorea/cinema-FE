<template>
    <div class="sold-tickets-page">
        <!-- Header -->
        <div class="header-section mb-4">
            <div class="d-flex justify-content-between align-items-center">
                <h3 class="page-title mb-0"><i class="bi bi-ticket-perforated me-3"></i> Vé đã bán</h3>

                <!-- Bộ lọc ngày -->
                <div class="filter-section">
                    <div class="input-group">
                        <span class="input-group-text bg-light border-0">
                            <i class="bi bi-calendar-event"></i>
                        </span>
                        <input
                            type="date"
                            v-model="selectedDate"
                            class="form-control border-start-0"
                            placeholder="Chọn ngày"
                        />
                        <button class="btn btn-outline-secondary" @click="resetFilter" title="Xóa bộ lọc">
                            <i class="bi bi-x-circle"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Stats -->
        <div class="stats-bar mb-4">
            <span class="stat-item">
                <span class="stat-label">Tổng vé:</span>
                <span class="stat-value">{{ filteredBookings.length }}</span>
            </span>
        </div>

        <!-- Pagination Info -->
        <div v-if="totalPages > 1" class="pagination-info mb-4">
            <span class="stat-item">
                <span class="stat-label">Trang:</span>
                <span class="stat-value">{{ currentPage }} / {{ totalPages }}</span>
            </span>
        </div>

        <!-- Bảng vé đã bán -->
        <div v-if="paginatedBookings.length > 0" class="table-responsive ticket-table-wrapper">
            <table class="table table-hover align-middle mb-0">
                <thead>
                    <tr>
                        <th class="text-center">#</th>
                        <th>Phim</th>
                        <th>Phòng</th>
                        <th>Ghế</th>
                        <th>Suất chiếu</th>
                        <th>Phương thức</th>
                        <th>Trạng thái</th>
                        <th>Ngày bán</th>
                        <th class="text-center">Hành động</th>
                    </tr>
                </thead>

                <tbody>
                    <tr
                        v-for="(group, index) in paginatedBookings"
                        :key="group.txnRef || `group-${index}`"
                        class="ticket-row"
                    >
                        <td class="text-center fw-bold">{{ (currentPage - 1) * itemsPerPage + index + 1 }}</td>
                        <td>
                            <span class="movie-badge">{{ group.movieTitle }}</span>
                        </td>
                        <td>
                            <span class="room-badge">{{ group.roomName }}</span>
                        </td>
                        <td>
                            <span class="seat-display">{{ group.seatDisplay }}</span>
                        </td>
                        <td>
                            <span class="time-badge">{{ formatTime(group.startTime) }}</span>
                        </td>
                        <td>
                            <span class="badge" :class="group.paymentMethod === 'VNPAY' ? 'bg-primary' : 'bg-success'">
                                {{ group.paymentMethod }}
                            </span>
                        </td>
                        <td>
                            <span
                                class="badge"
                                :class="group.status === 'PAID' ? 'bg-success' : 'bg-warning text-dark'"
                            >
                                {{ group.status }}
                            </span>
                        </td>
                        <td>
                            <small class="text-muted">{{ formatDate(group.createdAt) }}</small>
                        </td>
                        <td class="text-center">
                            <div class="action-buttons">
                                <span v-if="downloadedRefs.has(group.txnRef)" class="text-success" title="Đã in">
                                    <i class="bi bi-check-circle-fill"></i>
                                </span>
                                <button
                                    v-else
                                    class="btn btn-sm btn-primary print-btn"
                                    @click="printTicket(group.txnRef)"
                                    title="In vé"
                                >
                                    <i class="bi bi-printer me-1"></i> In
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
            <p class="empty-text">Không có vé nào được bán trong ngày này</p>
        </div>

        <!-- Phân trang -->
        <nav v-if="totalPages > 1" class="pagination-section mt-4">
            <ul class="pagination justify-content-center">
                <li class="page-item" :class="{ disabled: currentPage === 1 }">
                    <button class="page-link" @click="currentPage = 1" :disabled="currentPage === 1">
                        <i class="bi bi-chevron-double-left"></i>
                    </button>
                </li>
                <li class="page-item" :class="{ disabled: currentPage === 1 }">
                    <button class="page-link" @click="currentPage--" :disabled="currentPage === 1">
                        <i class="bi bi-chevron-left"></i>
                    </button>
                </li>

                <li v-for="page in pageNumbers" :key="page" class="page-item" :class="{ active: currentPage === page }">
                    <button class="page-link" @click="currentPage = page">
                        {{ page }}
                    </button>
                </li>

                <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                    <button class="page-link" @click="currentPage++" :disabled="currentPage === totalPages">
                        <i class="bi bi-chevron-right"></i>
                    </button>
                </li>
                <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                    <button class="page-link" @click="currentPage = totalPages" :disabled="currentPage === totalPages">
                        <i class="bi bi-chevron-double-right"></i>
                    </button>
                </li>
            </ul>
        </nav>
    </div>
</template>

<script setup>
import { ref, watchEffect, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";
import api from "@/api";

const bookings = ref([]);
const authStore = useAuthStore();
const downloadingId = ref(null);
const selectedDate = ref("");
const downloadedRefs = ref(new Set());
const router = useRouter();
const currentPage = ref(1);
const itemsPerPage = 10;

// === Đọc cache vé đã tải
onMounted(() => {
    const stored = JSON.parse(localStorage.getItem("downloadedRefs") || "[]");
    downloadedRefs.value = new Set(stored);
});

// === Lấy danh sách vé đã bán ===
watchEffect(async () => {
    if (!authStore.username) return;
    try {
        const username = authStore.username;
        const res = await api.get(`/bookings/staff/sold?username=${username}`);
        bookings.value = res.data;
        console.log("Vé đã bán:", res.data);
    } catch (err) {
        console.error("Lỗi tải vé đã bán:", err);
    }
});

// === Gom nhóm vé ===
const groupedBookings = computed(() => {
    const groupedByTxn = {};

    bookings.value.forEach((booking) => {
        const key = booking.txnRef || `cash_${booking.createdAt}_${booking.roomName}_${booking.startTime}`;

        if (!groupedByTxn[key]) {
            groupedByTxn[key] = {
                txnRef: booking.txnRef || null,
                movieTitle: booking.movieTitle,
                roomName: booking.roomName,
                startTime: booking.startTime,
                paymentMethod: booking.paymentMethod,
                status: booking.status,
                createdAt: booking.createdAt,
                seatNumbers: [booking.seatNumber],
            };
        } else {
            groupedByTxn[key].seatNumbers.push(booking.seatNumber);
        }
    });

    return Object.values(groupedByTxn).map((group) => {
        const sortedSeats = group.seatNumbers.sort((a, b) => {
            const rowA = a.charAt(0);
            const rowB = b.charAt(0);
            const numA = parseInt(a.match(/\d+/)?.[0] || 0);
            const numB = parseInt(b.match(/\d+/)?.[0] || 0);
            return rowA === rowB ? numA - numB : rowA.localeCompare(rowB);
        });

        return {
            ...group,
            seatDisplay: sortedSeats.join(", "),
        };
    });
});

// === Lọc theo ngày được chọn ===
const filteredBookings = computed(() => {
    if (!selectedDate.value) return groupedBookings.value;

    const targetDate = new Date(selectedDate.value).toDateString();

    return groupedBookings.value.filter((group) => {
        const created = new Date(group.createdAt).toDateString();
        return created === targetDate;
    });
});

// === Tính toán phân trang ===
const totalPages = computed(() => {
    return Math.ceil(filteredBookings.value.length / itemsPerPage);
});

const paginatedBookings = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredBookings.value.slice(start, end);
});

const pageNumbers = computed(() => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage.value - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages.value, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }
    return pages;
});

// === Xóa bộ lọc ===
function resetFilter() {
    selectedDate.value = "";
    currentPage.value = 1;
}

// === Formatters ===
function formatTime(t) {
    return new Date(t).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(date) {
    return new Date(date).toLocaleDateString("vi-VN");
}

function printTicket(txnRef) {
    if (!txnRef) {
        alert("Không tìm thấy mã giao dịch!");
        return;
    }
    // Mở trang in trong tab mới
    const printUrl = `${window.location.origin}/staff/ticket/${txnRef}`;
    window.open(printUrl, "_blank");

    // Cập nhật trạng thái đã tải/in
    downloadedRefs.value.add(txnRef);
    localStorage.setItem("downloadedRefs", JSON.stringify([...downloadedRefs.value]));
}
</script>
