<template>
    <div class="container py-4">
        <!-- Back Button -->
        <button class="btn btn-outline-secondary mb-3" @click="$emit('back')">← Quay lại chọn suất chiếu</button>

        <!-- Title -->
        <h4 class="mb-3 text-center">Chọn ghế ngồi</h4>

        <!-- Showtime Information -->
        <div class="text-center mb-4 text-muted">
            <div>
                <strong>{{ showtime.movie.title }}</strong>
            </div>
            <div>{{ showtime.room.roomName }} • {{ formatTime(showtime.startTime) }}</div>
        </div>

        <!-- Legend -->
        <div class="legend mb-3 d-flex justify-content-center flex-wrap gap-3 small">
            <span class="badge bg-secondary">Ghế thường</span>
            <span class="badge bg-warning text-dark">VIP</span>
            <span class="badge sweetbox">Sweetbox</span>
            <span class="badge bg-danger">Đã đặt</span>
            <span class="badge bg-success">Đang chọn</span>
        </div>

        <!-- Screen -->
        <div class="screen mb-4 text-center">MÀN HÌNH</div>

        <!-- Seat Map -->
        <div v-if="seats.length > 0" class="seat-map">
            <div v-for="(rowSeats, rowLetter) in groupedSeats" :key="rowLetter" class="mb-2 text-center">
                <strong class="me-2">{{ rowLetter }}</strong>
                <div class="seat-row d-inline-grid">
                    <div
                        v-for="seat in rowSeats"
                        :key="seat.seatId"
                        class="seat"
                        :class="[
                            seat.seatType?.toLowerCase(),
                            { booked: seat.booked, selected: selectedSeats.includes(seat.seatId) },
                        ]"
                        @click="toggleSeat(seat)"
                    >
                        {{ seat.seatNumber }}
                    </div>
                </div>
            </div>
        </div>

        <!-- Summary & Button -->
        <div class="mt-4 d-flex justify-content-between align-items-center border-top pt-3">
            <div><strong>Đã chọn:</strong> {{ selectedSeats.length }} ghế</div>
            <button
                class="btn btn-success px-4"
                :disabled="selectedSeats.length === 0 || submitting"
                @click="openPaymentModal"
            >
                <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
                {{ submitting ? "Đang xử lý..." : "Xác nhận bán vé" }}
            </button>
        </div>

        <!-- Enhanced Luxury Payment Modal -->
        <div v-if="showPaymentModal" class="payment-modal-backdrop">
            <div class="payment-modal-box">
                <!-- Header -->
                <div class="payment-header text-center mb-4">
                    <h5 class="payment-title mb-2">Chọn Phương Thức Thanh Toán</h5>
                    <p class="text-muted small mb-0">Hoàn thành giao dịch của bạn một cách an toàn</p>
                </div>

                <!-- Payment Summary -->
                <div class="payment-summary mb-4 p-3 rounded-3">
                    <div class="row g-3 text-center">
                        <div class="col-6">
                            <small class="text-muted d-block mb-1">Số lượng vé</small>
                            <h6 class="mb-0 fw-bold">{{ getTotalTickets() }} vé</h6>
                        </div>
                        <div class="col-6">
                            <small class="text-muted d-block mb-1">Tổng tiền</small>
                            <h6 class="mb-0 fw-bold text-success">
                                {{ getTotalAmount().toLocaleString("vi-VN") }}₫
                            </h6>
                        </div>
                    </div>
                </div>

                <!-- Payment Methods -->
                <div class="payment-methods mb-4">
                    <!-- Cash Payment -->
                    <div
                        class="payment-card mb-3 p-4 rounded-3 cursor-pointer transition-all"
                        :class="{ 'payment-card-active': selectedPaymentMethod === 'cash' }"
                        @click="selectedPaymentMethod = 'cash'"
                    >
                        <div class="d-flex align-items-center">
                            <div class="payment-icon cash-icon me-3">💵</div>
                            <div class="flex-grow-1">
                                <h6 class="mb-1 fw-bold">Tiền Mặt</h6>
                                <small class="text-muted">Thanh toán trực tiếp tại quầy</small>
                            </div>
                            <div class="form-check">
                                <input
                                    class="form-check-input"
                                    type="radio"
                                    name="payment"
                                    :value="'cash'"
                                    v-model="selectedPaymentMethod"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- VNPay Payment -->
                    <div
                        class="payment-card p-4 rounded-3 cursor-pointer transition-all"
                        :class="{ 'payment-card-active': selectedPaymentMethod === 'vnpay' }"
                        @click="selectedPaymentMethod = 'vnpay'"
                    >
                        <div class="d-flex align-items-center">
                            <div class="payment-icon vnpay-icon me-3">🏦</div>
                            <div class="flex-grow-1">
                                <h6 class="mb-1 fw-bold">VNPay</h6>
                                <small class="text-muted">Quét mã QR hoặc chuyển khoản</small>
                            </div>
                            <div class="form-check">
                                <input
                                    class="form-check-input"
                                    type="radio"
                                    name="payment"
                                    :value="'vnpay'"
                                    v-model="selectedPaymentMethod"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="d-flex gap-2 justify-content-center">
                    <button class="btn btn-outline-secondary px-4" @click="closePaymentModal" :disabled="submitting">
                        Hủy
                    </button>
                    <button
                        class="btn btn-success px-5 fw-bold"
                        @click="processPayment"
                        :disabled="!selectedPaymentMethod || submitting"
                    >
                        <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
                        {{
                            submitting
                                ? "Đang xử lý..."
                                : selectedPaymentMethod === "cash"
                                ? "Thanh toán tiền mặt"
                                : "Tạo mã thanh toán"
                        }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import api from "@/api";
import { useAuthStore } from "@/stores/auth.store";

const props = defineProps({
    showtime: { type: Object, required: true },
});

const authStore = useAuthStore();
const seats = ref([]);
const selectedSeats = ref([]);
const submitting = ref(false);
const showPaymentModal = ref(false);
const selectedPaymentMethod = ref("");
const VIP_SURCHARGE = 10000;
const SWEETBOX_SURCHARGE = 15000;

onMounted(async () => {
    const res = await api.get(`/seats/showtime/${props.showtime.showtimeId}`);
    seats.value = res.data;
});

const groupedSeats = computed(() => {
    const groups = {};
    seats.value.forEach((seat) => {
        const row = seat.seatNumber.charAt(0);
        if (!groups[row]) groups[row] = [];
        groups[row].push(seat);
    });
    for (const key in groups) {
        groups[key].sort((a, b) => {
            const numA = parseInt(a.seatNumber.match(/\d+/)?.[0] || "0");
            const numB = parseInt(b.seatNumber.match(/\d+/)?.[0] || "0");
            return numA - numB;
        });
    }
    return groups;
});

function toggleSeat(seat) {
    if (seat.booked) return;
    const index = selectedSeats.value.indexOf(seat.seatId);
    if (index >= 0) selectedSeats.value.splice(index, 1);
    else selectedSeats.value.push(seat.seatId);
}

function getTotalTickets() {
    let totalTickets = 0;
    selectedSeats.value.forEach((seatId) => {
        const seat = seats.value.find((s) => s.seatId === seatId);
        if (seat) {
            // Sweetbox counts as 2 tickets, others count as 1
            totalTickets += seat.seatType?.toLowerCase() === "sweetbox" ? 2 : 1;
        }
    });
    return totalTickets;
}

function getTotalAmount() {
    const basePrice = props.showtime?.price || 0;
    if (basePrice === 0) return 0;
    return selectedSeats.value
        .map((seatId) => seats.value.find((s) => s.seatId === seatId))
        .filter(Boolean)
        .reduce((sum, seat) => {
            const seatType = (seat.seatType || seat.type || "").toUpperCase();
            if (seatType === "SWEETBOX") return sum + basePrice * 2 + SWEETBOX_SURCHARGE;
            if (seatType === "VIP") return sum + basePrice + VIP_SURCHARGE;
            return sum + basePrice;
        }, 0);
}

function openPaymentModal() {
    if (selectedSeats.value.length === 0) return;
    showPaymentModal.value = true;
    selectedPaymentMethod.value = "";
}

function closePaymentModal() {
    showPaymentModal.value = false;
    selectedPaymentMethod.value = "";
}

async function processPayment() {
    if (selectedPaymentMethod.value === "cash") {
        await handleCashPayment();
    } else if (selectedPaymentMethod.value === "vnpay") {
        await handleVnPay();
    }
}

async function handleCashPayment() {
    try {
        submitting.value = true;
        const totalAmount = getTotalAmount();

        const res = await api.post("/bookings/staff/create-multi", {
            showtimeId: props.showtime.showtimeId,
            seatIds: selectedSeats.value,
            staffUsername: authStore.username,
            total: totalAmount,
            paymentMethod: selectedPaymentMethod.value.toUpperCase(),
        });

        const txnRef = res.data.txnRef;
        await api.post(`/bookings/pay-cash/${txnRef}`);

        localStorage.setItem("txnRef", txnRef);

        // Sửa đường dẫn thành /staff/payment-result
        window.location.href = `/staff/payment-result?vnp_ResponseCode=00&vnp_TxnRef=${txnRef}`;
    } catch (err) {
        console.error("Lỗi thanh toán tiền mặt:", err);
        alert(err.response?.data?.error || "Có lỗi xảy ra!");
    } finally {
        submitting.value = false;
    }
}

async function handleVnPay() {
    try {
        submitting.value = true;
        const totalAmount = getTotalAmount();

        const bookingRes = await api.post("/bookings/staff/create-multi", {
            showtimeId: props.showtime.showtimeId,
            seatIds: selectedSeats.value,
            staffUsername: authStore.username,
            total: totalAmount,
            paymentMethod: selectedPaymentMethod.value.toUpperCase(),
        });
        const txnRef = bookingRes.data.txnRef;
        localStorage.setItem("txnRef", txnRef);

        const paymentRes = await api.post("/payments/create-payment", {
            txnRef,
            amount: totalAmount,
            orderDescription: `Thanh toán ${getTotalTickets()} vé xem phim`,
            role: "staff",
        });

        // Redirect trực tiếp tới VNPay, giữ nguyên URL đã ký từ backend
        const paymentUrl = paymentRes?.data?.paymentUrl;
        if (paymentUrl) {
            console.log("VNPay redirect URL:", paymentUrl);
            window.location.assign(paymentUrl);
        } else {
            throw new Error("Không nhận được payment URL từ server");
        }
    } catch (err) {
        console.error("Lỗi tạo VNPay:", err);
        alert(err.response?.data?.error || "Không thể tạo thanh toán VNPay!");
        submitting.value = false;
    }
}
function formatTime(t) {
    if (!t) return "";
    const timePart = t.split("T")[1];
    return timePart ? timePart.substring(0, 5) : "";
}
</script>

<style scoped>
/* Screen Display */
.screen {
    background: linear-gradient(90deg, #ccc, #eee, #ccc);
    padding: 8px;
    border-radius: 6px;
    font-weight: bold;
    letter-spacing: 1px;
}

/* Seat Map */
.seat-map {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.seat-row {
    display: grid;
    grid-template-columns: repeat(10, 42px);
    gap: 8px;
    justify-content: center;
}

.seat {
    background: #e5e7eb;
    color: #111;
    padding: 10px;
    text-align: center;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.2s;
    cursor: pointer;
    user-select: none;
}

.seat:hover:not(.booked) {
    background: #d1d5db;
    transform: scale(1.05);
}

.seat.selected {
    background: #ff6b35;
    color: #fff;
}

.seat.booked {
    background: #ef4444;
    color: #fff;
    cursor: not-allowed;
    opacity: 0.7;
}

.seat.vip {
    background: #facc15;
}

.seat.sweetbox {
    background: #f472b6;
    color: white;
    grid-column: span 2;
}

.seat.sweetbox.selected {
    background: linear-gradient(135deg, #ec4899, #be185d);
    color: white;
    box-shadow: 0 0 15px rgba(236, 72, 153, 0.6);
    transform: scale(1.05);
}

.legend .badge.sweetbox {
    background-color: #f472b6;
    color: white;
}

/* Enhanced Luxury Payment Modal Styles */
.payment-modal-backdrop {
    position: fixed;
    inset: 0;
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.4));
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    backdrop-filter: blur(4px);
    animation: fadeIn 0.3s ease;
}

.payment-modal-box {
    background: linear-gradient(135deg, #ffffff 0%, #f8fafb 100%);
    padding: 40px;
    border-radius: 20px;
    width: 90%;
    max-width: 480px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0, 0, 0, 0.1);
    animation: slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    border: 1px solid rgba(255, 255, 255, 0.8);
}

.payment-header {
    border-bottom: 2px solid rgba(0, 0, 0, 0.06);
    padding-bottom: 20px;
}

.payment-title {
    color: #1a1a1a;
    font-weight: 700;
    font-size: 1.4rem;
}

/* Payment Summary Card */
.payment-summary {
    background: linear-gradient(135deg, #fff6f1 0%, #ffe8dd 100%);
    border: 1px solid #ffd1bd;
    backdrop-filter: blur(10px);
}

.payment-summary h6 {
    color: #c9491b;
    font-size: 1.2rem;
}

.payment-summary .text-success {
    color: #ff6b35 !important;
}

/* Payment Method Cards */
.payment-card {
    border: 2px solid #e5e7eb;
    background: #fff;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    cursor: pointer;
    position: relative;
    overflow: hidden;
}

.payment-card::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.5s;
}

.payment-card:hover {
    border-color: #d1d5db;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
}

.payment-card:hover::before {
    left: 100%;
}

.payment-card-active {
    border-color: #ff6b35;
    background: linear-gradient(135deg, #fff6f1 0%, #ffe5d8 100%);
    box-shadow: 0 12px 32px rgba(255, 107, 53, 0.24);
}

.payment-card-active .payment-icon {
    transform: scale(1.1);
}

/* Payment Icons */
.payment-icon {
    width: 50px;
    height: 50px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    transition: transform 0.3s ease;
}

.cash-icon {
    background: linear-gradient(135deg, #fef3c7, #fde047);
}

.vnpay-icon {
    background: linear-gradient(135deg, #dbeafe, #93c5fd);
}

/* VNPay QR Section */
.vnpay-section {
    background: linear-gradient(135deg, #fff7f2 0%, #ffe9de 100%);
    border: 2px dashed #ff8a5c;
}

.qr-container {
    display: inline-block;
    padding: 16px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
}

.qr-container img {
    display: block;
    max-width: 100%;
    height: auto;
}

/* Form Check Override */
.form-check-input {
    width: 1.5rem;
    height: 1.5rem;
    border: 2px solid #d1d5db;
    cursor: pointer;
    transition: all 0.2s;
}

.form-check-input:checked {
    background-color: #ff6b35;
    border-color: #ff6b35;
    box-shadow: 0 0 0 0.25rem rgba(255, 107, 53, 0.25);
}

/* Button Enhancements */
.btn-success {
    background: linear-gradient(135deg, #ff6b35 0%, #ff8a5c 100%);
    border: none;
    transition: all 0.3s ease;
    box-shadow: 0 8px 16px rgba(255, 107, 53, 0.3);
}

.btn-success:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 12px 24px rgba(255, 107, 53, 0.4);
}

.btn-success:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.btn-outline-secondary {
    transition: all 0.3s ease;
}

.btn-outline-secondary:hover:not(:disabled) {
    transform: translateY(-2px);
}

/* Animations */
@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.transition-all {
    transition: all 0.3s ease;
}

.cursor-pointer {
    cursor: pointer;
}

/* Responsive */
@media (max-width: 576px) {
    .payment-modal-box {
        width: 95%;
        padding: 24px;
        margin: 16px;
    }

    .payment-title {
        font-size: 1.2rem;
    }

    .payment-icon {
        width: 45px;
        height: 45px;
        font-size: 24px;
    }

    .seat-row {
        grid-template-columns: repeat(8, 36px);
    }
}
</style>
