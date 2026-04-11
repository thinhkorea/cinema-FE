<template>
    <div class="sold-tickets-page">
        <div class="summary-toolbar mb-4">
            <div class="summary-metrics">
                <div class="metric-item">
                    <div class="metric-icon"><i class="bi bi-ticket-perforated"></i></div>
                    <div>
                        <p class="metric-label mb-1">Tổng vé</p>
                        <h5 class="metric-value mb-0">{{ filteredTicketCount }}</h5>
                    </div>
                </div>
                <div class="metric-item">
                    <div class="metric-icon"><i class="bi bi-receipt"></i></div>
                    <div>
                        <p class="metric-label mb-1">Giao dịch</p>
                        <h5 class="metric-value mb-0">{{ filteredBookings.length }}</h5>
                    </div>
                </div>
                <div v-if="selectedDate" class="filter-tag">
                    <i class="bi bi-funnel-fill me-1"></i> {{ selectedDateText }}
                </div>
            </div>

            <div class="filter-panel">
                <div class="input-group filter-input-group">
                    <span class="input-group-text bg-transparent border-0">
                        <i class="bi bi-calendar-event"></i>
                    </span>
                    <input type="date" v-model="selectedDate" class="form-control border-start-0" />
                </div>

                <div class="filter-actions">
                    <button class="btn btn-outline-primary btn-sm" @click="setTodayFilter">Hôm nay</button>
                    <button class="btn btn-outline-secondary btn-sm" @click="resetFilter" :disabled="!selectedDate">
                        Xóa lọc
                    </button>
                </div>
            </div>
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
            <div class="empty-icon"><i class="bi bi-ticket-perforated"></i></div>
            <h5 class="empty-title mb-2">Chưa có vé nào được bán</h5>
            <p class="empty-text mb-1">Nhân viên chưa tạo giao dịch nào trong thời gian lọc hiện tại.</p>
            <p class="empty-subtext mb-0">Sau khi bán vé thành công, danh sách sẽ tự cập nhật tại đây.</p>
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
import { ref, watchEffect, computed, onMounted, watch } from "vue";
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
            seatCount: sortedSeats.length,
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

const filteredTicketCount = computed(() => {
    return filteredBookings.value.reduce((sum, group) => sum + (group.seatCount || 0), 0);
});

const selectedDateText = computed(() => {
    if (!selectedDate.value) return "";
    return new Date(selectedDate.value).toLocaleDateString("vi-VN", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
});

// === Xóa bộ lọc ===
function resetFilter() {
    selectedDate.value = "";
    currentPage.value = 1;
}

function setTodayFilter() {
    selectedDate.value = new Date().toISOString().slice(0, 10);
}

watch(selectedDate, () => {
    currentPage.value = 1;
});

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

<style scoped>
.summary-toolbar {
    border: 1px solid #efdcd3;
    border-radius: 14px;
    background: #fff;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    flex-wrap: wrap;
    box-shadow: 0 6px 16px rgba(255, 107, 53, 0.08);
}

.summary-metrics {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}

.metric-item {
    background: #fff8f4;
    border: 1px solid #f2d6ca;
    border-radius: 12px;
    padding: 10px 12px;
    min-width: 160px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.metric-icon {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #ff6b35;
    background: rgba(255, 107, 53, 0.14);
}

.metric-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #9c7060;
}

.metric-value {
    color: #3f3937;
}

.filter-tag {
    color: #a65d43;
    background: rgba(255, 107, 53, 0.1);
    border: 1px solid #f2c0ae;
    border-radius: 999px;
    padding: 5px 10px;
    font-size: 0.83rem;
    font-weight: 500;
}

.filter-panel {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}

.filter-input-group {
    width: 230px;
    border: 1px solid #f1d8cc;
    border-radius: 10px;
    background: #fff8f4;
    overflow: hidden;
}

.filter-actions {
    display: flex;
    gap: 6px;
}

.empty-state {
    border: 1px dashed #f1c8b6;
    border-radius: 14px;
    background: linear-gradient(140deg, #fff9f5 0%, #fff 70%);
    text-align: center;
    padding: 28px 18px;
}

.empty-icon {
    width: 56px;
    height: 56px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 107, 53, 0.12);
    color: #ff6b35;
    font-size: 1.5rem;
    margin-bottom: 10px;
}

.empty-title {
    color: #3f3937;
}

.empty-text,
.empty-subtext {
    color: #746c68;
}

@media (max-width: 768px) {
    .summary-toolbar {
        align-items: stretch;
    }

    .summary-metrics {
        width: 100%;
    }

    .metric-item {
        flex: 1;
        min-width: 135px;
    }

    .filter-panel {
        width: 100%;
    }

    .filter-input-group {
        width: 100%;
    }
}
</style>
