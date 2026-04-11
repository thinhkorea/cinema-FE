<template>
    <div class="payment-page">
        <!-- Progress Tabs -->
        <div class="progress-tabs">
            <div class="tab completed">Chọn ghế</div>
            <div class="tab completed">Chọn thức ăn</div>
            <div class="tab active">Thanh toán</div>
            <div class="tab">Xác nhận</div>
        </div>

        <!-- Main Content -->
        <div class="main-content">
            <!-- Left Side: Payment Details -->
            <div class="left-panel">
                <h2 class="section-title">Thông tin thanh toán</h2>

                <div v-if="loading" class="loading-section">
                    <div class="spinner"></div>
                    <p>Đang tải thông tin...</p>
                </div>

                <div v-else>
                    <!-- Loyalty Points Section -->
                    <div class="loyalty-section">
                        <h3 class="subsection-title">
                            <i class="bi bi-star-fill"></i>
                            Điểm tích lũy
                        </h3>
                        <div class="loyalty-balance-box">
                            <div class="points-display">
                                <span class="points-label">Điểm khả dụng:</span>
                                <span class="points-value">{{ loyaltyPoints }} điểm</span>
                            </div>
                            <p class="points-note">(1 điểm = 1.000đ)</p>
                        </div>

                        <div class="points-input-section">
                            <label for="pointsInput">Sử dụng điểm:</label>
                            <div class="input-with-button">
                                <input
                                    id="pointsInput"
                                    v-model.number="pointsToUse"
                                    type="number"
                                    min="0"
                                    :max="maxPointsCanUse"
                                    placeholder="0"
                                    class="points-input"
                                />
                                <button @click="useMaxPoints" class="btn-max">Dùng tối đa</button>
                            </div>
                            <p v-if="pointsToUse > 0" class="discount-preview">
                                Giảm giá: <strong>{{ formatCurrency(pointsToUse * 1000) }}</strong>
                            </p>
                        </div>
                    </div>

                    <!-- Payment Method Section -->
                    <div class="payment-method-section">
                        <h3 class="subsection-title">
                            <i class="bi bi-credit-card"></i>
                            Phương thức thanh toán
                        </h3>
                        <div class="payment-method-box">
                            <img :src="vnpayLogo" alt="VNPay" class="payment-logo" />
                            <div class="payment-info">
                                <h4>VNPay</h4>
                                <p>Thanh toán qua cổng VNPay</p>
                            </div>
                            <i class="bi bi-check-circle-fill payment-selected"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Side: Order Summary -->
            <div class="right-panel">
                <!-- Timer -->
                <div class="timer-box">
                    <span>Thời gian còn lại:</span>
                    <span class="countdown">{{ timeRemaining }}</span>
                </div>

                <!-- Movie Info -->
                <div class="movie-info" v-if="movie">
                    <img :src="movie.posterUrl" :alt="movie.title" class="movie-poster" />
                    <h3 class="movie-title">{{ movie.title }}</h3>
                    <p class="theater-info">{{ showtime?.room?.roomName || showtime?.screen?.name }}</p>
                    <p class="showtime-info">
                        Suất: <strong>{{ formatTime(showtime?.startTime) }}</strong> -
                        {{ formatShortDate(showtime?.startTime) }}
                    </p>
                </div>

                <!-- Order Details -->
                <div class="order-details">
                    <h4 class="details-title">Chi tiết đơn hàng</h4>

                    <div class="detail-row">
                        <span class="label">{{ selectedSeats.length }}x Vé</span>
                        <span class="value">{{ formatCurrency(ticketPrice) }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label small">Ghế: {{ selectedSeatsText }}</span>
                    </div>

                    <!-- Snacks -->
                    <div v-if="selectedSnacks.length > 0" class="snacks-section">
                        <div v-for="snack in selectedSnacks" :key="snack.id" class="detail-row">
                            <span class="label">{{ snack.quantity }}x {{ snack.name }}</span>
                            <span class="value">{{ formatCurrency(snack.price * snack.quantity) }}</span>
                        </div>
                    </div>

                    <!-- Discount -->
                    <div v-if="pointsToUse > 0" class="detail-row discount-row">
                        <span class="label">Giảm từ điểm ({{ pointsToUse }}đ)</span>
                        <span class="value discount">-{{ formatCurrency(pointsToUse * 1000) }}</span>
                    </div>

                    <!-- Total -->
                    <div class="detail-row total-row">
                        <span class="label"><strong>Tổng thanh toán</strong></span>
                        <span class="value total-value">{{ formatCurrency(finalAmount) }}</span>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="action-buttons">
                    <button @click="goBack" class="btn-back-action">Quay lại</button>
                    <button @click="confirmPayment" class="btn-pay" :disabled="processing">
                        <span v-if="!processing">Thanh toán</span>
                        <span v-else>Đang xử lý...</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";
import Swal from "sweetalert2";
import api from "@/api";
import vnpayLogo from "@/assets/vnpay-logo.png";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const movieId = route.params.movieId;
const showtimeId = route.params.showtimeId;
const DEBUG_HOLD_DURATION_MS = 10 * 60 * 1000; // Default 10 minutes

const loading = ref(true);
const processing = ref(false);
const movie = ref(null);
const showtime = ref(null);
const selectedSeats = ref([]);
const ticketPrice = ref(0);
const selectedSnacks = ref([]);
const snackTotal = ref(0);
const loyaltyPoints = ref(0);
const pointsToUse = ref(0);

// Timer
const timeRemaining = ref("10:00");
let timerInterval = null;

onMounted(async () => {
    try {
        // Get booking data from sessionStorage
        const bookingData = JSON.parse(sessionStorage.getItem("tempBookingData") || "{}");
        const bookingFlowKey = bookingData.bookingFlowKey || `${movieId}_${showtimeId}_${bookingData.expiryTime || ""}`;

        if (!bookingData.selectedSeats || bookingData.selectedSeats.length === 0) {
            alert("Không tìm thấy thông tin đặt vé.");
            router.push(`/booking/${movieId}/seats/${showtimeId}`);
            return;
        }

        selectedSeats.value = bookingData.selectedSeats;
        ticketPrice.value = bookingData.totalPrice;

        // Get snacks if any
        const snacksData = sessionStorage.getItem("selectedSnacks");
        const savedSnacksFlowKey = sessionStorage.getItem("selectedSnacksFlowKey");
        if (snacksData && savedSnacksFlowKey === bookingFlowKey) {
            selectedSnacks.value = JSON.parse(snacksData);
            snackTotal.value = selectedSnacks.value.reduce((total, snack) => total + snack.price * snack.quantity, 0);
        } else {
            selectedSnacks.value = [];
            snackTotal.value = 0;
            sessionStorage.removeItem("selectedSnacks");
            sessionStorage.removeItem("selectedSnacksFlowKey");
        }

        // Load movie and showtime info
        const [resMovie, resShowtime] = await Promise.all([
            api.get(`/movies/${movieId}`),
            api.get(`/showtimes/${showtimeId}`),
        ]);

        movie.value = resMovie.data;
        showtime.value = resShowtime.data;

        // Get user loyalty points
        const userId = auth.userId;
        if (userId) {
            const profileRes = await api.get(`/auth/profile/${userId}`);
            loyaltyPoints.value = profileRes.data.loyaltyPoints || 0;
        }

        loading.value = false;

        // Start timer
        const expiryTime = bookingData.expiryTime || new Date().getTime() + DEBUG_HOLD_DURATION_MS;
        const remainingSeconds = Math.max(0, Math.floor((expiryTime - new Date().getTime()) / 1000));
        startTimer(remainingSeconds);
    } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
        alert("Không thể tải thông tin thanh toán!");
    }
});

onUnmounted(() => {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
});

// Computed
const selectedSeatsText = computed(() => {
    return selectedSeats.value.map((s) => s.seatNumber).join(", ");
});

const maxPointsCanUse = computed(() => {
    const maxByPoints = loyaltyPoints.value;
    const maxByTotal = Math.floor((ticketPrice.value + snackTotal.value) / 1000);
    return Math.min(maxByPoints, maxByTotal);
});

const finalAmount = computed(() => {
    const total = ticketPrice.value + snackTotal.value;
    const discount = pointsToUse.value * 1000;
    return Math.max(0, total - discount);
});

// Methods
const showSeatHoldExpiredAlert = async () => {
    await Swal.fire({
        icon: "warning",
        title: "Hết thời gian giữ ghế",
        text: "Thời gian giữ ghế đã kết thúc. Vui lòng đặt vé lại.",
        confirmButtonText: "Quay về trang chủ",
        allowOutsideClick: false,
        allowEscapeKey: false,
        customClass: {
            confirmButton: "btn btn-warning px-4",
        },
        buttonsStyling: false,
    });
};

const startTimer = (seconds) => {
    let remaining = seconds;
    updateTimerDisplay(remaining);

    timerInterval = setInterval(async () => {
        remaining--;
        if (remaining <= 0) {
            clearInterval(timerInterval);
            await showSeatHoldExpiredAlert();
            router.push("/");
        } else {
            updateTimerDisplay(remaining);
        }
    }, 1000);
};

const updateTimerDisplay = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    timeRemaining.value = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const useMaxPoints = () => {
    pointsToUse.value = maxPointsCanUse.value;
};

const goBack = () => {
    router.push(`/booking/${movieId}/seats/${showtimeId}/snacks`);
};

const normalizeSeatId = (seat) => {
    const rawId = seat?.originalSweetboxId ?? seat?.seatId;
    if (rawId === null || rawId === undefined) return null;

    if (typeof rawId === "number") return rawId;

    const matched = String(rawId).match(/^\d+/);
    if (!matched) return null;

    return Number(matched[0]);
};

const confirmPayment = async () => {
    if (processing.value) return;

    try {
        processing.value = true;

        // Step 1: Create booking
        const seatIds = [...new Set(selectedSeats.value.map((s) => normalizeSeatId(s)).filter((id) => id !== null))];
        if (seatIds.length === 0) {
            throw new Error("Không xác định được ghế hợp lệ để đặt vé");
        }
        const bookingRes = await api.post("/bookings", {
            showtimeId: parseInt(showtimeId),
            seatIds: seatIds,
        });

        const txnRef = bookingRes.data.txnRef;
        console.log("Booking created with txnRef:", txnRef);

        // Step 2: Create payment
        let finalAmountToPay = finalAmount.value;

        // Calculate discount from points
        let discountFromPoints = 0;
        if (pointsToUse.value > 0) {
            discountFromPoints = pointsToUse.value * 1000;
            finalAmountToPay = ticketPrice.value + snackTotal.value - discountFromPoints;
        }

        const payRes = await api.post(`/payments/create-payment`, {
            txnRef,
            amount: finalAmountToPay,
            orderDescription: `Thanh toán vé xem phim ${movie.value.title}`,
        });

        const paymentUrl = payRes.data.paymentUrl;

        // Save points to use in sessionStorage
        if (pointsToUse.value > 0) {
            sessionStorage.setItem(
                "pendingPointsRedeem",
                JSON.stringify({
                    txnRef: txnRef,
                    pointsToUse: pointsToUse.value,
                }),
            );
        }

        // Step 3: Save snacks to backend
        if (selectedSnacks.value.length > 0) {
            try {
                // Format snacks data for backend
                const snacksData = selectedSnacks.value.map((snack) => ({
                    snackId: snack.id,
                    quantity: snack.quantity,
                }));

                await api.post(`/snacks/add-to-booking`, {
                    txnRef: txnRef,
                    snacks: snacksData,
                });

                console.log("Snacks saved successfully");
            } catch (snackErr) {
                console.error("Error saving snacks:", snackErr);
                // Continue even if snacks fail - don't block payment
            }
        }

        // Step 4: Redirect to VNPay
        window.location.href = paymentUrl;
    } catch (err) {
        console.error("Lỗi thanh toán:", err);
        const backendMessage = err?.response?.data?.error;
        alert(backendMessage || "Không thể khởi tạo thanh toán!");
        processing.value = false;
    }
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(amount);
};

const formatTime = (dateTime) => {
    if (!dateTime) return "";
    const date = new Date(dateTime);
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

const formatShortDate = (dateTime) => {
    if (!dateTime) return "";
    const date = new Date(dateTime);
    const days = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    return `${days[date.getDay()]}, ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};
</script>

<style scoped>
.payment-page {
    background: #f5f5f5;
    min-height: 100vh;
    padding-bottom: 2rem;
}

.progress-tabs {
    background: white;
    display: flex;
    justify-content: space-between;
    padding: 1rem 0;
    border-bottom: 1px solid #e0e0e0;
    position: relative;
}

.progress-tabs::before {
    content: "";
    position: absolute;
    left: 2rem;
    right: 2rem;
    bottom: 0;
    height: 3px;
    background: #d8e4f1;
    border-radius: 2px;
}

.tab {
    flex: 1;
    text-align: center;
    padding: 0.75rem 1.5rem;
    color: #999;
    font-weight: 500;
    position: relative;
}

.tab::after {
    content: "";
    position: absolute;
    left: 0;
    bottom: -1rem;
    width: 100%;
    height: 3px;
    background: transparent;
    border-radius: 2px;
    transition: background-color 0.2s ease;
    z-index: 1;
}

.tab:first-child::after {
    left: 1rem;
    width: calc(100% - 1rem);
}

.tab.completed {
    color: #1f4f8a;
    font-weight: 600;
}

.tab.completed::after {
    background: #7aa9dd;
}

.tab.active {
    color: #0056b3;
    font-weight: 700;
}

.tab.active::after {
    background: #0056b3;
}

.main-content {
    max-width: 1400px;
    margin: 2rem auto;
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 2rem;
    padding: 0 2rem;
}

.left-panel {
    background: white;
    border-radius: 8px;
    padding: 2rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-title {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
    color: #333;
}

.subsection-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.1rem;
    margin-bottom: 1rem;
    color: #333;
}

.loading-section {
    text-align: center;
    padding: 3rem;
    color: #666;
}

.spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #f3f3f3;
    border-top-color: #ff6b35;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.loyalty-section,
.payment-method-section {
    border: 1px solid #e7e7e7;
    border-radius: 8px;
    padding: 1.25rem;
    margin-bottom: 1.25rem;
}

.loyalty-balance-box {
    background: #fff8f4;
    border: 1px solid #ffd7c8;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
}

.points-display {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
}

.points-label {
    color: #666;
}

.points-value {
    font-weight: 700;
    color: #ff6b35;
}

.points-note {
    margin: 0.35rem 0 0;
    color: #888;
    font-size: 0.9rem;
}

.points-input-section label {
    display: block;
    margin-bottom: 0.5rem;
    color: #444;
    font-weight: 500;
}

.input-with-button {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.75rem;
}

.points-input {
    width: 100%;
    padding: 0.7rem 0.8rem;
    border: 1px solid #d8d8d8;
    border-radius: 8px;
    font-size: 1rem;
}

.points-input:focus {
    outline: none;
    border-color: #ff6b35;
    box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.12);
}

.btn-max {
    padding: 0 1rem;
    border: 1px solid #ff6b35;
    background: white;
    color: #ff6b35;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn-max:hover {
    background: #fff5f2;
}

.discount-preview {
    margin-top: 0.75rem;
    color: #198754;
}

.payment-method-box {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 1rem;
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 1rem;
    background: #fafafa;
}

.payment-logo {
    width: 88px;
    height: 32px;
    border-radius: 8px;
    object-fit: contain;
    background: #fff;
    border: 1px solid #ececec;
    padding: 0.15rem 0.35rem;
}

.payment-info h4 {
    margin: 0;
    color: #333;
}

.payment-info p {
    margin: 0.2rem 0 0;
    color: #666;
    font-size: 0.9rem;
}

.payment-selected {
    color: #ff6b35;
    font-size: 1.2rem;
}

.right-panel {
    position: sticky;
    top: 2rem;
    height: fit-content;
}

.timer-box {
    background: #fff3cd;
    border: 1px solid #ffc107;
    border-radius: 8px;
    padding: 1rem;
    text-align: center;
    margin-bottom: 1.5rem;
    font-weight: 500;
    color: #6b4e00;
}

.countdown {
    color: #ff6b35;
    font-size: 1.3rem;
    font-weight: 700;
    margin-left: 0.5rem;
}

.movie-info {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin-bottom: 1.5rem;
    text-align: center;
}

.movie-poster {
    width: 100%;
    max-width: 200px;
    border-radius: 8px;
    margin-bottom: 1rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.movie-title {
    font-size: 1.2rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    color: #333;
}

.theater-info {
    color: #666;
    margin-bottom: 0.25rem;
}

.showtime-info {
    color: #666;
    font-size: 0.9rem;
}

.order-details {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin-bottom: 1.5rem;
}

.details-title {
    margin: 0 0 0.75rem;
    color: #333;
    font-size: 1rem;
    font-weight: 700;
}

.detail-row {
    display: flex;
    justify-content: space-between;
    padding: 0.75rem 0;
    border-bottom: 1px solid #f0f0f0;
}

.detail-row:last-child {
    border-bottom: none;
}

.detail-row.total-row {
    margin-top: 0.5rem;
    padding-top: 1rem;
    border-top: 2px solid #333;
}

.label {
    color: #666;
}

.label.small {
    font-size: 0.92rem;
}

.value {
    font-weight: 600;
    color: #333;
}

.discount-row .label,
.discount-row .value,
.discount {
    color: #198754;
}

.total-value {
    color: #ff6b35;
    font-size: 1.2rem;
}

.action-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

.btn-back-action,
.btn-pay {
    padding: 1rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn-back-action {
    background: white;
    border: 2px solid #ff6b35;
    color: #ff6b35;
}

.btn-back-action:hover {
    background: #fff5f2;
}

.btn-pay {
    background: #ff6b35;
    color: white;
}

.btn-pay:hover:not(:disabled) {
    background: #ff5722;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
}

.btn-pay:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

@media (max-width: 1024px) {
    .main-content {
        grid-template-columns: 1fr;
    }

    .right-panel {
        position: static;
    }
}

@media (max-width: 768px) {
    .progress-tabs {
        font-size: 0.85rem;
        gap: 0;
        overflow-x: auto;
        justify-content: flex-start;
        padding: 1rem;
    }

    .tab {
        padding: 0.5rem 0.75rem;
        white-space: nowrap;
    }

    .main-content {
        margin: 1rem auto;
        padding: 0 1rem;
        gap: 1rem;
    }

    .left-panel,
    .movie-info,
    .order-details {
        padding: 1.2rem;
    }

    .input-with-button,
    .action-buttons {
        grid-template-columns: 1fr;
    }

    .points-display {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.35rem;
    }
}
</style>
