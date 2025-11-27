<template>
    <div class="booking-page">
        <AppHeader />

        <div class="container mt-4">
            <!-- HEADER -->
            <div class="page-header mb-4">
                <h1 class="page-title">Lịch sử vé của tôi</h1>
                <p class="page-subtitle">Quản lý và xem chi tiết các vé đã đặt</p>
            </div>

            <!-- LOADING -->
            <div v-if="loading" class="text-center py-5">
                <div class="spinner-border text-warning mb-3" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="text-light">Đang tải dữ liệu...</p>
            </div>

            <!-- EMPTY -->
            <div v-else-if="bookings.length === 0" class="alert alert-info text-center py-4">
                <i class="bi bi-inbox fs-3 mb-3"></i>
                <p class="mb-0">Bạn chưa có vé nào</p>
            </div>

            <!-- CONTENT -->
            <div v-else>
                <!-- STATS -->
                <div class="stats-container mb-4">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="bi bi-ticket-fill"></i>
                        </div>
                        <div class="stat-info">
                            <div class="stat-number">{{ paidCount }}</div>
                            <div class="stat-label">Tổng vé</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon success">
                            <i class="bi bi-calendar-check-fill"></i>
                        </div>
                        <div class="stat-info">
                            <div class="stat-number">{{ paidCount }}</div>
                            <div class="stat-label">Đã thanh toán</div>
                        </div>
                    </div>
                </div>

                <!-- TICKET LIST -->
                <div>
                    <div v-for="dateGroup in paginatedDateGroups" :key="dateGroup.date" class="mb-4">
                        <!-- DATE GROUP HEADER -->
                        <div class="date-group-header" @click="dateGroup.expanded = !dateGroup.expanded">
                            <div class="date-header-content">
                                <i
                                    class="bi chevron-icon"
                                    :class="dateGroup.expanded ? 'bi-chevron-down' : 'bi-chevron-right'"
                                ></i>
                                <i class="bi bi-calendar-event date-icon"></i>
                                <strong class="date-text">{{ dateGroup.date }}</strong>
                                <span class="date-badge">{{ dateGroup.groups.length }} lịch chiếu</span>
                            </div>
                            <span class="ticket-count">{{ dateGroup.totalTickets }} vé</span>
                        </div>

                        <!-- TICKETS IN THIS DATE -->
                        <transition name="collapse" @enter="enter" @leave="leave">
                            <div v-show="dateGroup.expanded" class="date-group-tickets">
                                <div v-for="group in dateGroup.groups" :key="group.txnRef" class="mb-3">
                                    <div class="ticket-card">
                                        <!-- CARD HEADER -->
                                        <div class="ticket-header">
                                            <div class="ticket-title-section">
                                                <h5 class="ticket-movie-title">{{ group.movieTitle }}</h5>
                                                <p class="ticket-txn-ref">{{ group.txnRef }}</p>
                                            </div>
                                            <div class="ticket-badge">
                                                <i class="bi bi-check-circle"></i>
                                                <span>{{ group.bookings.length }} vé</span>
                                            </div>
                                        </div>

                                        <!-- CARD BODY -->
                                        <div class="ticket-body">
                                            <div class="ticket-info-grid">
                                                <div class="info-item">
                                                    <i class="bi bi-door-closed info-icon"></i>
                                                    <div class="info-content">
                                                        <span class="info-label">Phòng</span>
                                                        <span class="info-value">{{ group.roomName }}</span>
                                                    </div>
                                                </div>
                                                <div class="info-item">
                                                    <i class="bi bi-calendar info-icon"></i>
                                                    <div class="info-content">
                                                        <span class="info-label">Ngày chiếu</span>
                                                        <span class="info-value">{{
                                                            formatDate(group.startTime)
                                                        }}</span>
                                                    </div>
                                                </div>
                                                <div class="info-item">
                                                    <i class="bi bi-clock info-icon"></i>
                                                    <div class="info-content">
                                                        <span class="info-label">Giờ chiếu</span>
                                                        <span class="info-value">{{
                                                            formatTime(group.startTime)
                                                        }}</span>
                                                    </div>
                                                </div>
                                                <div class="info-item">
                                                    <i class="bi bi-collection info-icon"></i>
                                                    <div class="info-content">
                                                        <span class="info-label">Ghế</span>
                                                        <span class="info-value">{{ group.seats.join(", ") }}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div class="ticket-price">
                                                <div class="price-main">
                                                    <span class="price-label">Tổng tiền:</span>
                                                    <span class="price-value">{{
                                                        formatPrice(getGroupFinalPrice(group))
                                                    }}</span>
                                                </div>
                                                <div
                                                    v-if="group.bookings.some((b) => b.pointsUsed > 0)"
                                                    class="points-used"
                                                >
                                                    <i class="bi bi-gem"></i>
                                                    Đã sử dụng
                                                    {{
                                                        group.bookings.reduce((sum, b) => sum + (b.pointsUsed || 0), 0)
                                                    }}
                                                    điểm
                                                </div>
                                            </div>
                                        </div>

                                        <!-- CARD FOOTER -->
                                        <div class="ticket-footer">
                                            <button class="btn-details" @click="viewGroupDetails(group.txnRef)">
                                                <i class="bi bi-eye"></i>
                                                <span>Chi tiết</span>
                                            </button>
                                            <button
                                                class="btn-copy"
                                                @click="copyTxnRef(group.txnRef)"
                                                title="Sao chép mã"
                                            >
                                                <i class="bi bi-files"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </transition>
                    </div>

                    <!-- PAGINATION -->
                    <nav aria-label="Page navigation" class="mt-5">
                        <ul class="pagination justify-content-center">
                            <li class="page-item" :class="{ disabled: currentPage === 1 }">
                                <button class="page-link" @click="currentPage--" :disabled="currentPage === 1">
                                    <i class="bi bi-chevron-left"></i> Trước
                                </button>
                            </li>

                            <li
                                v-for="page in totalPages"
                                :key="page"
                                class="page-item"
                                :class="{ active: page === currentPage }"
                            >
                                <button class="page-link" @click="currentPage = page">{{ page }}</button>
                            </li>

                            <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                                <button class="page-link" @click="currentPage++" :disabled="currentPage === totalPages">
                                    Sau <i class="bi bi-chevron-right"></i>
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import AppHeader from "@/components/AppHeader.vue";
import api from "@/api";

const router = useRouter();
const bookings = ref([]);
const loading = ref(true);
const filterStatus = ref("ALL");
const currentPage = ref(1);
const itemsPerPage = ref(10); // Số lượng vé tối đa per trang

const goHome = () => router.push("/");

// Auto scroll to top khi chuyển trang
watch(currentPage, () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
});

onMounted(async () => {
    try {
        const response = await api.get("/bookings/my-bookings");
        // Chỉ lấy những vé đã thanh toán (PAID)
        bookings.value = (response.data || []).filter((b) => b.status === "PAID");
    } catch (error) {
        console.error("Lỗi khi tải lịch sử vé:", error);
        alert("Không thể tải lịch sử vé");
    } finally {
        loading.value = false;
    }
});

// Vì chỉ hiển thị vé PAID, không cần filter
const filteredBookings = computed(() => {
    return bookings.value;
});

// Gộp vé theo txnRef
const bookingGroups = computed(() => {
    const groups = {};

    bookings.value.forEach((booking) => {
        const key = booking.txnRef || booking.bookingId;
        if (!groups[key]) {
            groups[key] = {
                txnRef: key,
                movieTitle: booking.movieTitle || "N/A",
                roomName: booking.roomName || "N/A",
                startTime: booking.startTime,
                createdAt: booking.createdAt,
                seats: [],
                bookings: [],
                totalPrice: 0,
            };
        }
        groups[key].seats.push(booking.seatNumber || "?");
        groups[key].bookings.push(booking);
        // Lấy giá từ booking.total (đã là giá cuối cùng sau trừ điểm)
        const finalPrice = booking.total || 0;
        groups[key].totalPrice += finalPrice;
    });

    // Chuyển object thành array và sắp xếp theo ngày chiếu (mới nhất lên đầu), rồi ngày đặt (mới nhất lên đầu)
    return Object.values(groups).sort((a, b) => {
        const dateCompare = new Date(b.startTime) - new Date(a.startTime);
        if (dateCompare !== 0) return dateCompare; // Sắp xếp theo ngày chiếu (mới nhất lên đầu)
        return new Date(b.createdAt) - new Date(a.createdAt); // Cùng ngày thì sắp xếp theo ngày đặt (mới nhất lên đầu)
    });
});

const paidCount = computed(() => bookings.value.length);

// Helper function: Tính giá cuối cùng của group (total đã là giá cuối)
const getGroupFinalPrice = (group) => {
    return group.bookings.reduce((sum, booking) => {
        return sum + (booking.total || 0);
    }, 0);
};

// Gộp vé theo ngày đặt
const dateGroups = computed(() => {
    const groups = {};
    bookingGroups.value.forEach((group) => {
        const dateKey = formatDate(group.createdAt);
        if (!groups[dateKey]) {
            groups[dateKey] = {
                date: dateKey,
                groups: [],
                totalTickets: 0,
                expanded: true, // Mặc định mở rộng
            };
        }
        groups[dateKey].groups.push(group);
        groups[dateKey].totalTickets += group.bookings.length;
    });
    return Object.values(groups);
});

// PAGINATION - Dựa trên số lượng vé, không phải số ngày
const totalTicketsInAllGroups = computed(() => {
    return dateGroups.value.reduce((sum, group) => sum + group.totalTickets, 0);
});

const totalPages = computed(() => {
    return Math.ceil(totalTicketsInAllGroups.value / itemsPerPage.value);
});

const paginatedDateGroups = computed(() => {
    let ticketCount = 0;
    const paginatedGroups = [];
    let currentGroupsOnPage = [];

    dateGroups.value.forEach((dateGroup) => {
        // Nếu thêm group này vào mà vượt quá limit vé trên 1 trang
        if (ticketCount + dateGroup.totalTickets > itemsPerPage.value && currentGroupsOnPage.length > 0) {
            paginatedGroups.push(currentGroupsOnPage);
            currentGroupsOnPage = [];
            ticketCount = 0;
        }

        currentGroupsOnPage.push(dateGroup);
        ticketCount += dateGroup.totalTickets;
    });

    // Thêm nhóm cuối cùng
    if (currentGroupsOnPage.length > 0) {
        paginatedGroups.push(currentGroupsOnPage);
    }

    // Trả về trang hiện tại
    const start = currentPage.value - 1;
    return paginatedGroups[start] || [];
});

const getStatusText = (status) => {
    const statusMap = {
        PENDING: "Chưa thanh toán",
        PAID: "Đã thanh toán",
        CANCELLED: "Đã hủy",
    };
    return statusMap[status] || status;
};

const statusBadgeClass = (status) => {
    const classMap = {
        PENDING: "bg-warning",
        PAID: "bg-success",
        CANCELLED: "bg-danger",
    };
    return classMap[status] || "bg-secondary";
};

const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
};

const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
    });
};

const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
};

const goToPayment = (bookingId) => {
    router.push(`/payment/${bookingId}`);
};

const viewGroupDetails = (txnRef) => {
    router.push(`/my-bookings/txn/${txnRef}`);
};

const copyTxnRef = (txnRef) => {
    navigator.clipboard.writeText(txnRef).then(() => {
        alert("Đã sao chép mã giao dịch!");
    });
};

const cancelBooking = async (bookingId) => {
    if (!confirm("Bạn chắc chắn muốn hủy vé này?")) return;

    try {
        await api.delete(`/bookings/${bookingId}`);
        alert("Hủy vé thành công");
        // Reload lại danh sách
        const response = await api.get("/bookings/my-bookings");
        bookings.value = response.data || [];
    } catch (error) {
        console.error("Lỗi khi hủy vé:", error);
        alert(error.response?.data?.error || "Không thể hủy vé");
    }
};

const downloadTicket = async (bookingId) => {
    try {
        const response = await api.get(`/bookings/${bookingId}/ticket`, {
            responseType: "blob",
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `ticket_${bookingId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentChild.removeChild(link);
    } catch (error) {
        console.error("Lỗi khi tải vé:", error);
        alert("Không thể tải vé");
    }
};

// TRANSITION HELPERS
const enter = (el) => {
    el.style.height = "0";
    el.style.overflow = "hidden";
    el.offsetHeight; // Trigger reflow
    el.style.transition = "height 0.3s ease";
    el.style.height = el.scrollHeight + "px";
    setTimeout(() => {
        el.style.overflow = "visible";
    }, 300);
};

const leave = (el) => {
    el.style.height = el.scrollHeight + "px";
    el.offsetHeight; // Trigger reflow
    el.style.transition = "height 0.3s ease";
    el.style.height = "0";
    el.style.overflow = "hidden";
};
</script>

<style scoped>
/* Global Styles */
.booking-page {
    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
    min-height: 100vh;
    color: #ffffff;
    padding: 0 0 2rem 0;
}

.container {
    max-width: 1000px;
}

/* Back Button */
.back-button-container {
    display: flex;
    justify-content: flex-start;
    margin-top: 1rem;
}

.btn-back {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.8rem 1.5rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    color: #fff;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
}

.btn-back:hover {
    background: rgba(255, 215, 0, 0.2);
    border-color: rgba(255, 215, 0, 0.3);
    color: #ffd700;
    transform: translateX(-2px);
}

.btn-back i {
    font-size: 1.1rem;
}

/* Page Header */
.page-header {
    text-align: center;
    margin-bottom: 2rem;
}

.page-title {
    font-size: 2rem;
    font-weight: 700;
    color: #ffd700;
    margin-bottom: 0.5rem;
    text-shadow: 0 2px 4px rgba(255, 215, 0, 0.3);
}

.page-subtitle {
    color: #ccc;
    font-size: 1rem;
    margin: 0;
}

/* Stats Container */
.stats-container {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-bottom: 2rem;
}

.stat-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1rem 1.5rem;
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(255, 215, 0, 0.2);
    border-color: rgba(255, 215, 0, 0.3);
}

.stat-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: rgba(255, 215, 0, 0.2);
    border-radius: 10px;
    color: #ffd700;
    font-size: 1.2rem;
}

.stat-icon.success {
    background: rgba(40, 167, 69, 0.2);
    color: #28a745;
}

.stat-number {
    font-size: 1.5rem;
    font-weight: 700;
    color: #ffd700;
    line-height: 1;
}

.stat-label {
    font-size: 0.85rem;
    color: #ccc;
    margin-top: 0.25rem;
}

/* Date Group Header */
.date-group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 1rem 1.5rem;
    margin-bottom: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
}

.date-group-header:hover {
    background: rgba(255, 215, 0, 0.1);
    border-color: rgba(255, 215, 0, 0.3);
    box-shadow: 0 4px 15px rgba(255, 215, 0, 0.1);
}

.date-header-content {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.chevron-icon {
    color: #ffd700;
    font-size: 1rem;
    transition: transform 0.3s ease;
}

.date-icon {
    color: #ffd700;
    font-size: 1.1rem;
}

.date-text {
    color: #fff;
    font-size: 1.1rem;
    font-weight: 600;
}

.date-badge {
    background: rgba(255, 215, 0, 0.2);
    color: #ffd700;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 500;
    border: 1px solid rgba(255, 215, 0, 0.3);
}

.ticket-count {
    color: #ccc;
    font-size: 0.9rem;
}

/* Ticket Cards */
.ticket-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 15px;
    backdrop-filter: blur(20px);
    overflow: hidden;
    transition: all 0.3s ease;
}

.ticket-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(255, 215, 0, 0.15);
    border-color: rgba(255, 215, 0, 0.3);
}

.ticket-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1));
    border-bottom: 1px solid rgba(255, 215, 0, 0.2);
    padding: 1.25rem 1.5rem;
}

.ticket-title-section {
    flex: 1;
}

.ticket-movie-title {
    color: #fff;
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0 0 0.25rem 0;
    line-height: 1.3;
}

.ticket-txn-ref {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.8rem;
    margin: 0;
}

.ticket-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(40, 167, 69, 0.2);
    color: #28a745;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 500;
    border: 1px solid rgba(40, 167, 69, 0.3);
}

.ticket-body {
    padding: 1.5rem;
}

.ticket-info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.info-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.info-icon {
    color: #ffd700;
    font-size: 1rem;
    width: 20px;
    text-align: center;
}

.info-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.info-label {
    font-size: 0.75rem;
    color: #999;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0;
}

.info-value {
    font-size: 0.9rem;
    font-weight: 600;
    color: #fff;
    margin: 0;
}

.ticket-price {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    padding: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.price-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.price-label {
    color: #ccc;
    font-size: 0.9rem;
}

.price-value {
    color: #ffd700;
    font-size: 1.1rem;
    font-weight: 700;
}

.points-used {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #28a745;
    font-size: 0.8rem;
}

.points-used i {
    font-size: 0.9rem;
}

.ticket-footer {
    display: flex;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    background: rgba(255, 255, 255, 0.03);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-details {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: linear-gradient(45deg, #ffd700, #ffed4e);
    color: #000;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn-details:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
}

.btn-copy {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.1);
    color: #ccc;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.9rem;
}

.btn-copy:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
    transform: translateY(-1px);
}

/* Loading and Empty States */
.loading-state,
.empty-state {
    text-align: center;
    padding: 3rem 0;
}

/* Pagination */
.pagination {
    margin-top: 2rem;
}

.page-link {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #fff;
    padding: 0.75rem 1rem;
    transition: all 0.3s ease;
}

.page-link:hover {
    background: rgba(255, 215, 0, 0.2);
    border-color: rgba(255, 215, 0, 0.3);
    color: #ffd700;
}

.page-item.active .page-link {
    background: linear-gradient(45deg, #ffd700, #ffed4e);
    border-color: #ffd700;
    color: #000;
    font-weight: 600;
}

/* Responsive Design */
@media (max-width: 768px) {
    .booking-page {
        padding: 1rem 0;
    }

    .stats-container {
        flex-direction: column;
        align-items: center;
    }

    .ticket-info-grid {
        grid-template-columns: 1fr;
        gap: 0.75rem;
    }

    .ticket-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
        text-align: left;
    }

    .ticket-badge {
        align-self: flex-start;
    }

    .date-header-content {
        flex-wrap: wrap;
        gap: 0.75rem;
    }

    .page-title {
        font-size: 1.5rem;
    }
}

@media (max-width: 480px) {
    .ticket-footer {
        flex-direction: column;
        gap: 0.5rem;
    }

    .btn-copy {
        width: 100%;
        height: 40px;
    }
}
</style>
