<template>
    <div class="booking-page">
        <AppHeader />

        <div class="container py-5">
            <!-- Back Button -->
            <div class="back-button-container mb-4">
                <button @click="goBack" class="btn-back">
                    <i class="bi bi-arrow-left"></i>
                    <span>Quay lại</span>
                </button>
            </div>

            <!-- Page Header -->
            <div class="page-header text-center mb-5">
                <h1 class="page-title">
                    <i class="bi bi-ticket-perforated-fill me-3"></i>
                    Chi tiết vé xem phim
                </h1>
                <p class="page-subtitle">Thông tin chi tiết về vé đã đặt</p>
            </div>

            <!-- Loading state -->
            <div v-if="!bookings.length" class="loading-state">
                <div class="loading-spinner"></div>
                <p class="loading-text">Đang tải thông tin vé...</p>
            </div>

            <!-- Main ticket content -->
            <div v-else class="ticket-container">
                <!-- Movie Info Card -->
                <div class="movie-info-card">
                    <div class="movie-poster-wrapper">
                        <img
                            :src="moviePoster || '/placeholder.svg?height=400&width=300'"
                            :alt="movieTitle"
                            class="movie-poster"
                        />
                        <div class="poster-overlay"></div>
                    </div>

                    <div class="movie-details">
                        <h2 class="movie-title">{{ movieTitle }}</h2>

                        <div class="cinema-info">
                            <div class="cinema-row">
                                <i class="bi bi-building"></i>
                                <span class="label-text">Rạp chiếu phim: </span>
                                <span class="cinema-name">CinemaAndJoy</span>
                            </div>
                        </div>

                        <div class="movie-meta">
                            <div class="meta-item">
                                <i class="bi bi-calendar-event"></i>
                                <span>{{ formatDate(startTime) }}</span>
                            </div>
                            <div class="meta-item">
                                <i class="bi bi-clock"></i>
                                <span>{{ formatTime(startTime) }}</span>
                            </div>
                            <div class="meta-item">
                                <i class="bi bi-house-door"></i>
                                <span>{{ roomName }}</span>
                            </div>
                        </div>

                        <div class="seats-info">
                            <i class="bi bi-person-check"></i>
                            <span class="seats-label">Ghế đã chọn:</span>
                            <span class="seats-list">{{ seatList }}</span>
                        </div>
                    </div>
                </div>

                <!-- Digital Ticket -->
                <div class="digital-ticket">
                    <div class="ticket-header">
                        <h3 class="ticket-title">Vé điện tử</h3>
                    </div>

                    <div class="ticket-content">
                        <div class="qr-section">
                            <div class="qr-wrapper">
                                <qrcode-vue :value="`CINEMA-TXN-${txnRef}`" :size="160" level="M" />
                            </div>
                            <p class="qr-instruction">Quét mã QR này cho nhân viên khi vào rạp</p>
                        </div>

                        <div class="transaction-info">
                            <div class="transaction-id">
                                <span class="label">Mã giao dịch:</span>
                                <span class="value">{{ txnRef }}</span>
                            </div>

                            <div class="payment-details">
                                <div class="detail-row">
                                    <span class="label">Số lượng vé:</span>
                                    <span class="value">{{ bookings.length }} vé</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">Giá vé trung bình:</span>
                                    <span class="value">{{ formatCurrency(avgPrice) }}</span>
                                </div>
                                <div v-if="snacks.length" class="detail-row">
                                    <span class="label">Món bắp nước:</span>
                                    <span class="value">{{ snacks.length }} món</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">Phương thức:</span>
                                    <span class="value payment-method">{{ bookings[0].paymentMethod || "VNPAY" }}</span>
                                </div>
                                <div v-if="snacks.length" class="detail-row">
                                    <span class="label">Tiền bắp nước:</span>
                                    <span class="value">{{ formatCurrency(snacksTotal) }}</span>
                                </div>
                                <div class="detail-row total-row">
                                    <span class="label">Tổng thanh toán:</span>
                                    <span class="value total-amount">{{ formatCurrency(grandTotal) }}</span>
                                </div>
                            </div>

                            <div v-if="snacks.length" class="snacks-list">
                                <h6 class="snacks-title">
                                    <i class="bi bi-cup-straw"></i>
                                    Bắp nước đã mua
                                </h6>
                                <div v-for="snack in snacks" :key="snack.id || snack.snackId" class="snack-line">
                                    <span>{{ snack.snackName }} x{{ snack.quantity }}</span>
                                    <strong>{{ formatCurrency(snack.subtotal || 0) }}</strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="ticket-footer">
                        <div class="notice">
                            <i class="bi bi-info-circle"></i>
                            <p>Vui lòng đưa mã QR này cho nhân viên khi vào rạp. Vé có hiệu lực trong ngày chiếu.</p>
                        </div>
                    </div>
                </div>

                <!-- Print button only for staff -->
                <div v-if="auth.role === 'STAFF'" class="action-buttons">
                    <button @click="printTicket" class="btn-print">
                        <i class="bi bi-printer"></i>
                        <span>In vé</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import AppHeader from "@/components/AppHeader.vue";
import QrcodeVue from "qrcode.vue";
import { useRoute, useRouter } from "vue-router";
import { ref, onMounted, computed } from "vue";
import { useAuthStore } from "@/stores/auth.store";
import api from "@/api";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const txnRef = route.params.txnRef;
const bookings = ref([]);
const snacks = ref([]);

onMounted(async () => {
    try {
        const [ticketRes, snackRes] = await Promise.all([
            api.get(`/bookings/txn/${txnRef}`),
            api.get(`/snacks/txn/${txnRef}`).catch(() => ({ data: [] })),
        ]);

        console.log("Vé theo giao dịch:", ticketRes.data);
        bookings.value = ticketRes.data;
        snacks.value = snackRes.data || [];
    } catch (err) {
        console.error("Lỗi tải vé:", err);
    }
});

// Hàm quay lại trang chủ
const goBack = () => {
    router.push("/");
};

// Hàm in vé (chỉ dành cho nhân viên)
const printTicket = () => {
    window.print();
}; // ==== Các giá trị tính toán ====
const movieTitle = computed(() => bookings.value[0]?.movieTitle || "N/A");
const moviePoster = computed(() => bookings.value[0]?.moviePoster || "");
const roomName = computed(() => bookings.value[0]?.roomName || "N/A");
const startTime = computed(() => bookings.value[0]?.startTime || null);

const seatList = computed(() => bookings.value.map((b) => b.seatNumber).join(", "));

const totalAmount = computed(() => bookings.value.reduce((sum, b) => sum + (b.total || 0), 0));
const snacksTotal = computed(() => snacks.value.reduce((sum, item) => sum + (item.subtotal || 0), 0));
const grandTotal = computed(() => totalAmount.value + snacksTotal.value);

const avgPrice = computed(() => (bookings.value.length ? totalAmount.value / bookings.value.length : 0));

// ==== Formatters ====
const formatDate = (date) =>
    date
        ? new Date(date).toLocaleDateString("vi-VN", {
              weekday: "short",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
          })
        : "N/A";

const formatTime = (date) =>
    date
        ? new Date(date).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
          })
        : "N/A";

const formatCurrency = (temp) => (temp || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });
</script>

<style scoped>
/* Global Styling */
.booking-page {
    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
    min-height: 100vh;
    color: #ffffff;
}

.container {
    max-width: 1000px;
}

/* Back Button */
.back-button-container {
    display: flex;
    justify-content: flex-start;
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
    margin-bottom: 3rem;
}

.page-title {
    font-size: 2.5rem;
    font-weight: 700;
    color: #ffd700;
    margin-bottom: 1rem;
    text-shadow: 0 4px 8px rgba(255, 215, 0, 0.3);
}

.page-subtitle {
    font-size: 1.1rem;
    color: #ccc;
    margin: 0;
}

/* Loading State */
.loading-state {
    text-align: center;
    padding: 4rem 0;
}

.loading-spinner {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(255, 215, 0, 0.2);
    border-top-color: #ffd700;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1.5rem;
}

.loading-text {
    color: #ccc;
    font-size: 1.1rem;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* Ticket Container */
.ticket-container {
    max-width: 900px;
    margin: 0 auto;
}

/* Movie Info Card */
.movie-info-card {
    background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
    border-radius: 20px;
    padding: 2rem;
    margin-bottom: 2rem;
    display: flex;
    gap: 2rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 215, 0, 0.1);
}

.movie-poster-wrapper {
    position: relative;
    flex-shrink: 0;
}

.movie-poster {
    width: 200px;
    height: 280px;
    object-fit: cover;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.poster-overlay {
    position: absolute;
    inset: 0;
    border-radius: 12px;
    background: linear-gradient(45deg, rgba(255, 215, 0, 0.1), transparent);
    pointer-events: none;
}

.movie-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.movie-title {
    font-size: 2rem;
    font-weight: 700;
    color: #ffd700;
    margin-bottom: 1.5rem;
    line-height: 1.2;
}

.movie-meta {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    margin-bottom: 1.5rem;
}

.meta-item {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    color: #e0e0e0;
    font-size: 1rem;
}

.meta-item i {
    color: #ffd700;
    font-size: 1.1rem;
    width: 20px;
}

.seats-info {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 1rem;
    background: rgba(255, 215, 0, 0.1);
    border-radius: 10px;
    border: 1px solid rgba(255, 215, 0, 0.2);
}

.seats-info i {
    color: #ffd700;
    font-size: 1.2rem;
}

.seats-label {
    color: #ccc;
    font-weight: 500;
}

.seats-list {
    color: #ffd700;
    font-weight: 600;
    font-size: 1.1rem;
}

/* Digital Ticket */
.digital-ticket {
    background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 215, 0, 0.1);
    margin-bottom: 2rem;
}

.ticket-header {
    background: linear-gradient(135deg, #ffd700, #ffed4e);
    color: #000;
    padding: 1.5rem 2rem;
    text-align: center;
}

.cinema-info {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: rgba(255, 215, 0, 0.1);
    border-radius: 10px;
    border: 1px solid rgba(255, 215, 0, 0.2);
}

.cinema-row {
    display: flex;
    align-items: center;
    gap: 0.8rem;
}

.cinema-row i {
    color: #ffd700;
    font-size: 1.1rem;
}

.cinema-row .label-text {
    color: #ccc;
    font-size: 1rem;
    font-weight: 500;
}

.cinema-row .cinema-name {
    font-size: 1.2rem;
    font-weight: 600;
    color: #ffd700;
    letter-spacing: 1px;
    text-shadow: 0 2px 4px rgba(255, 215, 0, 0.3);
}

.ticket-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
}

.ticket-content {
    padding: 2rem;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    align-items: center;
}

.qr-section {
    text-align: center;
}

.qr-wrapper {
    display: inline-block;
    padding: 1rem;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    margin-bottom: 1rem;
}

.qr-instruction {
    color: #ccc;
    font-size: 0.9rem;
    margin: 0;
}

.transaction-info {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.transaction-id {
    text-align: center;
    padding: 1rem;
    background: rgba(255, 215, 0, 0.1);
    border-radius: 10px;
    border: 1px solid rgba(255, 215, 0, 0.2);
}

.transaction-id .label {
    display: block;
    color: #ccc;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
}

.transaction-id .value {
    color: #ffd700;
    font-weight: 600;
    font-size: 1.1rem;
    font-family: monospace;
}

.payment-details {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
}

.snacks-list {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px dashed rgba(255, 215, 0, 0.3);
}

.snacks-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 0 0.65rem;
    color: #ffd700;
    font-weight: 600;
}

.snack-line {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    color: #ddd;
    font-size: 0.9rem;
    margin-bottom: 0.4rem;
}

.snack-line strong {
    color: #ffd700;
}

.detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
}

.detail-row .label {
    color: #ccc;
    font-weight: 500;
}

.detail-row .value {
    color: #e0e0e0;
    font-weight: 600;
}

.payment-method {
    background: linear-gradient(135deg, #007bff, #0056b3);
    color: #fff !important;
    padding: 0.3rem 0.8rem;
    border-radius: 6px;
    font-size: 0.9rem;
}

.total-row {
    border-top: 2px solid rgba(255, 215, 0, 0.3);
    padding-top: 1rem;
    margin-top: 0.5rem;
}

.total-amount {
    color: #ffd700 !important;
    font-size: 1.3rem;
    font-weight: 700;
}

.ticket-footer {
    background: rgba(0, 0, 0, 0.3);
    padding: 1.5rem 2rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.notice {
    display: flex;
    align-items: flex-start;
    gap: 0.8rem;
    color: #ccc;
}

.notice i {
    color: #17a2b8;
    font-size: 1.2rem;
    margin-top: 0.2rem;
    flex-shrink: 0;
}

.notice p {
    margin: 0;
    line-height: 1.5;
    font-size: 0.95rem;
}

/* Action Buttons */
.action-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 2rem;
}

.btn-home,
.btn-print {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 1rem 2rem;
    border: none;
    border-radius: 12px;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    text-decoration: none;
}

.btn-home {
    background: linear-gradient(135deg, #6c757d, #5a6268);
    color: #fff;
}

.btn-home:hover {
    background: linear-gradient(135deg, #5a6268, #495057);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(108, 117, 125, 0.3);
}

.btn-print {
    background: linear-gradient(135deg, #ffd700, #ffed4e);
    color: #000;
}

.btn-print:hover {
    background: linear-gradient(135deg, #ffed4e, #fff176);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(255, 215, 0, 0.3);
}

/* Responsive Design */
@media (max-width: 768px) {
    .movie-info-card {
        flex-direction: column;
        text-align: center;
    }

    .movie-poster {
        width: 150px;
        height: 210px;
        margin: 0 auto;
    }

    .ticket-content {
        grid-template-columns: 1fr;
        gap: 2rem;
    }

    .action-buttons {
        flex-direction: column;
        align-items: center;
    }

    .btn-home,
    .btn-print {
        width: 100%;
        max-width: 300px;
        justify-content: center;
    }
}

/* Print Styles */
@media print {
    .booking-page {
        background: white !important;
        color: black !important;
    }

    .action-buttons {
        display: none;
    }

    .page-header {
        color: black !important;
    }
}

/* Redesign Theme: Light + Orange */
.booking-page {
    background: #f5f5f5;
    color: #333;
}

.btn-back {
    background: #fff;
    border: 1px solid #e1e1e1;
    color: #444;
    backdrop-filter: none;
}

.btn-back:hover {
    background: #fff3ed;
    border-color: #ffc4b1;
    color: #ff6b35;
}

.page-title {
    color: #2f2f2f;
    text-shadow: none;
}

.page-subtitle,
.loading-text {
    color: #666;
}

.loading-spinner {
    border-color: rgba(255, 107, 53, 0.2);
    border-top-color: #ff6b35;
}

.movie-info-card,
.digital-ticket {
    background: #fff;
    border: 1px solid #e6e6e6;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.poster-overlay {
    background: linear-gradient(45deg, rgba(255, 107, 53, 0.12), transparent);
}

.movie-title,
.cinema-row .cinema-name,
.seats-list,
.transaction-id .value,
.total-amount {
    color: #ff6b35 !important;
    text-shadow: none;
}

.meta-item,
.seats-label,
.qr-instruction,
.detail-row .label,
.notice,
.cinema-row .label-text,
.transaction-id .label,
.page-subtitle {
    color: #666;
}

.meta-item i,
.seats-info i,
.cinema-row i {
    color: #ff6b35;
}

.cinema-info,
.seats-info,
.transaction-id {
    background: #fff8f4;
    border-color: #f0ddd4;
}

.ticket-header {
    background: linear-gradient(135deg, #ff6b35, #ff8a5f);
    color: #fff;
}

.detail-row .value {
    color: #333;
}

.snacks-list {
    border-top-color: #f1e0d8;
}

.snacks-title {
    color: #ff6b35;
}

.snack-line {
    color: #555;
}

.snack-line strong {
    color: #ff6b35;
}

.payment-method {
    background: #fff5f1;
    color: #ff6b35 !important;
    border: 1px solid #ffc8b6;
}

.total-row {
    border-top-color: #f1e0d8;
}

.ticket-footer {
    background: #fff;
    border-top: 1px solid #ececec;
}

.notice i {
    color: #ff6b35;
}

.btn-print {
    background: linear-gradient(135deg, #ff6b35, #ff8a5f);
    color: #fff;
}

.btn-print:hover {
    background: linear-gradient(135deg, #ff8a5f, #ff6b35);
    box-shadow: 0 8px 20px rgba(255, 107, 53, 0.3);
}
</style>
