<template>
    <div class="container mt-4">
        <div class="row">
            <div class="col-md-12">
                <h2 class="mb-4">Lịch sử vé của tôi</h2>

                <div v-if="loading" class="text-center">
                    <div class="spinner-border" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>

                <div v-else-if="bookings.length === 0" class="alert alert-info">Bạn chưa có vé nào</div>

                <div v-else>
                    <!-- Tiêu đề -->
                    <div class="mb-4">
                        <h4 class="text-muted">
                            Tổng số vé: <span class="text-primary fw-bold">{{ paidCount }}</span>
                        </h4>
                    </div>

                    <!-- Danh sách nhóm vé (gộp theo txnRef) -->
                    <div class="row">
                        <div v-for="group in bookingGroups" :key="group.txnRef" class="col-md-6 mb-4">
                            <div class="card h-100">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between align-items-start mb-3">
                                        <h5 class="card-title">{{ group.movieTitle }}</h5>
                                        <span class="badge bg-success"> {{ group.bookings.length }} vé </span>
                                    </div>

                                    <div class="booking-details">
                                        <p class="mb-2"><strong>Phòng:</strong> {{ group.roomName }}</p>
                                        <p class="mb-2"><strong>Ghế:</strong> {{ group.seats }}</p>
                                        <p class="mb-2">
                                            <strong>Ngày chiếu:</strong> {{ formatDate(group.startTime) }}
                                        </p>
                                        <p class="mb-2">
                                            <strong>Giờ chiếu:</strong> {{ formatTime(group.startTime) }}
                                        </p>
                                        <p class="mb-2">
                                            <strong>Tổng tiền:</strong> {{ formatPrice(group.totalPrice) }}
                                        </p>
                                        <p class="mb-2">
                                            <strong>Mã giao dịch:</strong> <code>{{ group.txnRef }}</code>
                                        </p>
                                    </div>

                                    <div class="mt-3 d-flex gap-2">
                                        <button class="btn btn-sm btn-primary" @click="viewGroupDetails(group.txnRef)">
                                            <i class="bi bi-eye me-1"></i> Xem chi tiết
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import api from "@/api";

const router = useRouter();
const bookings = ref([]);
const loading = ref(true);
const filterStatus = ref("ALL");

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
                movieTitle: booking.showtime.movie.title,
                roomName: booking.showtime.room.name,
                startTime: booking.showtime.startTime,
                seats: [],
                bookings: [],
                totalPrice: 0,
            };
        }
        groups[key].seats.push(booking.seat.seatNumber);
        groups[key].bookings.push(booking);
        // Lấy giá từ booking.total hoặc showtime.price
        const price = booking.total || booking.showtime.price || 0;
        groups[key].totalPrice += price;
    });

    // Chuyển object thành array và sắp xếp
    return Object.values(groups).sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
});

const paidCount = computed(() => bookings.value.length);

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
</style>
