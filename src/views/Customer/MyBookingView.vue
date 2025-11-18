<template>
    <div
        class="container-fluid py-5"
        style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); min-height: 100vh"
    >
        <div class="container">
            <!-- HEADER -->
            <div class="mb-5">
                <h1 class="fw-bold mb-2" style="color: #ffc107; font-size: 2.5rem">
                    <i class="bi bi-ticket-perforated me-3"></i>Lịch sử vé của tôi
                </h1>
                <p class="text-light fs-6">Quản lý và xem chi tiết các vé đã đặt</p>
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
                <div class="row mb-4">
                    <div class="col-md-4">
                        <div class="stat-card bg-warning bg-opacity-10 border border-warning rounded-3 p-4">
                            <div class="d-flex align-items-center">
                                <i class="bi bi-ticket-fill fs-3 text-warning"></i>
                                <div class="ms-3">
                                    <p class="text-light-emphasis mb-0 small">Tổng vé</p>
                                    <h4 class="text-warning mb-0 fw-bold">{{ paidCount }}</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="stat-card bg-success bg-opacity-10 border border-success rounded-3 p-4">
                            <div class="d-flex align-items-center">
                                <i class="bi bi-calendar-check-fill fs-3 text-success"></i>
                                <div class="ms-3">
                                    <p class="text-light-emphasis mb-0 small">Đã thanh toán</p>
                                    <h4 class="text-success mb-0 fw-bold">{{ paidCount }}</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- TICKET LIST -->
                <div>
                    <div v-for="dateGroup in paginatedDateGroups" :key="dateGroup.date" class="mb-4">
                        <!-- DATE GROUP HEADER -->
                        <div
                            class="date-group-header mb-3 p-3 bg-secondary bg-opacity-10 border border-secondary rounded-2 cursor-pointer d-flex align-items-center justify-content-between"
                            @click="dateGroup.expanded = !dateGroup.expanded"
                        >
                            <div class="d-flex align-items-center gap-3">
                                <i class="bi" :class="dateGroup.expanded ? 'bi-chevron-down' : 'bi-chevron-right'"></i>
                                <i class="bi bi-calendar-event text-warning"></i>
                                <strong class="text-light">{{ dateGroup.date }}</strong>
                                <span class="badge bg-warning text-dark">{{ dateGroup.groups.length }} lịch chiếu</span>
                            </div>
                            <span class="text-light-50 small">{{ dateGroup.totalTickets }} vé</span>
                        </div>

                        <!-- TICKETS IN THIS DATE -->
                        <transition name="collapse" @enter="enter" @leave="leave">
                            <div v-show="dateGroup.expanded" class="date-group-tickets">
                                <div v-for="group in dateGroup.groups" :key="group.txnRef" class="mb-4">
                                    <div class="ticket-card h-100">
                                        <!-- CARD HEADER -->
                                        <div class="ticket-card-header position-relative overflow-hidden">
                                            <div class="position-absolute top-0 end-0 p-3">
                                                <span class="badge bg-success rounded-pill">
                                                    <i class="bi bi-check-circle me-1"></i
                                                    >{{ group.bookings.length }} vé
                                                </span>
                                            </div>
                                            <div class="p-4">
                                                <h5 class="text-white fw-bold mb-1" style="font-size: 1.3rem">
                                                    {{ group.movieTitle }}
                                                </h5>
                                                <p class="text-white-50 mb-0 small">Mã giao dịch: {{ group.txnRef }}</p>
                                            </div>
                                        </div>

                                        <!-- CARD DIVIDER -->
                                        <div class="ticket-divider"></div>

                                        <!-- CARD BODY -->
                                        <div class="ticket-card-body p-4">
                                            <!-- INFO GRID -->
                                            <div class="info-grid mb-4">
                                                <div class="info-item">
                                                    <div class="info-icon">
                                                        <i class="bi bi-door-closed"></i>
                                                    </div>
                                                    <div>
                                                        <p class="info-label">Phòng chiếu</p>
                                                        <p class="info-value">{{ group.roomName }}</p>
                                                    </div>
                                                </div>

                                                <div class="info-item">
                                                    <div class="info-icon">
                                                        <i class="bi bi-calendar"></i>
                                                    </div>
                                                    <div>
                                                        <p class="info-label">Ngày chiếu</p>
                                                        <p class="info-value">{{ formatDate(group.startTime) }}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div class="info-grid mb-4">
                                                <div class="info-item">
                                                    <div class="info-icon">
                                                        <i class="bi bi-clock"></i>
                                                    </div>
                                                    <div>
                                                        <p class="info-label">Giờ chiếu</p>
                                                        <p class="info-value">{{ formatTime(group.startTime) }}</p>
                                                    </div>
                                                </div>

                                                <div class="info-item">
                                                    <div class="info-icon">
                                                        <i class="fa-solid fa-couch"></i>
                                                    </div>
                                                    <div>
                                                        <p class="info-label">Ghế</p>
                                                        <p class="info-value">{{ group.seats.join(", ") }}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div class="info-grid mb-4">
                                                <div class="info-item">
                                                    <div class="info-icon">
                                                        <i class="bi bi-calendar-event"></i>
                                                    </div>
                                                    <div>
                                                        <p class="info-label">Ngày đặt vé</p>
                                                        <p class="info-value">{{ formatDate(group.createdAt) }}</p>
                                                    </div>
                                                </div>

                                                <div class="info-item">
                                                    <div class="info-icon">
                                                        <i class="bi bi-hourglass-split"></i>
                                                    </div>
                                                    <div>
                                                        <p class="info-label">Giờ đặt</p>
                                                        <p class="info-value">{{ formatTime(group.createdAt) }}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- SEPARATOR -->
                                            <hr class="my-3 border-light-subtle" />

                                            <!-- PRICE -->
                                            <div class="price-section mb-3">
                                                <div class="d-flex justify-content-between align-items-center">
                                                    <span class="text-light">Tổng tiền:</span>
                                                    <span class="text-warning fw-bold fs-5">{{
                                                        formatPrice(getGroupFinalPrice(group))
                                                    }}</span>
                                                </div>
                                                <div
                                                    v-if="group.bookings.some((b) => b.pointsUsed > 0)"
                                                    class="small text-muted mt-2"
                                                >
                                                    <i class="bi bi-info-circle me-1"></i>
                                                    Đã sử dụng
                                                    {{
                                                        group.bookings.reduce((sum, b) => sum + (b.pointsUsed || 0), 0)
                                                    }}
                                                    điểm tích lũy
                                                </div>
                                            </div>
                                        </div>

                                        <!-- CARD FOOTER -->
                                        <div class="ticket-card-footer p-3 d-flex gap-2">
                                            <button
                                                class="btn btn-sm btn-primary flex-grow-1"
                                                @click="viewGroupDetails(group.txnRef)"
                                            >
                                                <i class="bi bi-eye me-1"></i> Xem chi tiết
                                            </button>
                                            <button
                                                class="btn btn-sm btn-outline-secondary"
                                                @click="copyTxnRef(group.txnRef)"
                                                title="Sao chép mã giao dịch"
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
import api from "@/api";

const router = useRouter();
const bookings = ref([]);
const loading = ref(true);
const filterStatus = ref("ALL");
const currentPage = ref(1);
const itemsPerPage = ref(10); // Số lượng vé tối đa per trang

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
.booking-details {
    font-size: 0.95rem;
    color: #666;
}

.card {
    transition: transform 0.2s, box-shadow 0.2s;
}

.card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

code {
    background: #f5f5f5;
    padding: 2px 6px;
    border-radius: 3px;
}

/* STAT CARD */
.stat-card {
    transition: all 0.3s ease;
}

.stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

/* TICKET CARD */
.ticket-card {
    background: #fff;
    border: none;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
}

.ticket-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.ticket-card-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.ticket-divider {
    height: 2px;
    background: linear-gradient(90deg, transparent, #e0e0e0, transparent);
}

.ticket-card-body {
    background: #fff;
}

.ticket-card-footer {
    background: #f8f9fa;
    border-top: 1px solid #e0e0e0;
}

/* INFO GRID */
.info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

.info-item {
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
}

.info-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: #f0f0f0;
    border-radius: 8px;
    color: #667eea;
    font-size: 1.2rem;
    flex-shrink: 0;
}

.info-label {
    font-size: 0.75rem;
    color: #999;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 4px 0;
}

.info-value {
    font-size: 1rem;
    font-weight: 600;
    color: #333;
    margin: 0;
}

/* PRICE SECTION */
.price-section {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 8px;
}

/* DATE GROUP HEADER */
.date-group-header {
    cursor: pointer;
    transition: all 0.3s ease;
    user-select: none;
}

.date-group-header:hover {
    background-color: rgba(255, 193, 7, 0.1) !important;
    border-color: #ffc107 !important;
    box-shadow: 0 2px 8px rgba(255, 193, 7, 0.1);
}

.date-group-tickets {
    overflow: hidden;
}

/* RESPONSIVE */
@media (max-width: 768px) {
    .info-grid {
        grid-template-columns: 1fr;
    }

    .ticket-card-header {
        padding: 1.5rem 1rem !important;
    }

    .ticket-card-body {
        padding: 1rem !important;
    }
}
</style>
