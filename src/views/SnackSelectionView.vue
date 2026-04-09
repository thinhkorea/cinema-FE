<template>
    <div class="snack-selection-page">
        <AppHeader />

        <!-- Progress Tabs -->
        <div class="progress-tabs">
            <div class="tab completed">Chọn ghế</div>
            <div class="tab active">Chọn thức ăn</div>
            <div class="tab">Thanh toán</div>
            <div class="tab">Xác nhận</div>
        </div>

        <!-- Main Content -->
        <div class="main-content">
            <!-- Left Side: Snacks List -->
            <div class="left-panel">
                <h2 class="section-title">Chọn Combo / Sản phẩm</h2>

                <div v-if="loading" class="loading-section">
                    <div class="spinner"></div>
                    <p>Đang tải danh sách snacks...</p>
                </div>

                <div v-else class="snacks-list">
                    <div v-for="snack in snackList" :key="snack.id" class="snack-item">
                        <div class="snack-image">
                            <img :src="snack.image" :alt="snack.name" @error="handleImageError" />
                        </div>
                        <div class="snack-details">
                            <h3 class="snack-name">{{ snack.name }}</h3>
                            <p class="snack-description">{{ snack.description }}</p>
                            <p class="snack-price">
                                Giá: <strong>{{ formatCurrency(snack.price) }}</strong>
                            </p>
                        </div>
                        <div class="quantity-controls">
                            <button
                                @click="decreaseQuantity(snack.id)"
                                class="btn-qty"
                                :disabled="getQuantity(snack.id) === 0"
                            >
                                <i class="bi bi-dash"></i>
                            </button>
                            <span class="quantity">{{ getQuantity(snack.id) }}</span>
                            <button @click="increaseQuantity(snack.id)" class="btn-qty">
                                <i class="bi bi-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Side: Booking Summary -->
            <div class="right-panel">
                <!-- Timer -->
                <div class="timer-box">
                    <span>Thời gian giữ ghế:</span>
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

                <!-- Booking Details -->
                <div class="booking-details">
                    <div class="detail-row">
                        <span class="label">{{ selectedSeats.length }}x {{ seatsText }}</span>
                        <span class="value">{{ formatCurrency(ticketPrice) }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Ghế: {{ selectedSeatsNumbers }}</span>
                    </div>

                    <!-- Selected Snacks -->
                    <div v-for="(snack, index) in selectedSnacksList" :key="index" class="detail-row">
                        <span class="label">{{ snack.quantity }}x {{ snack.name }}</span>
                        <span class="value">{{ formatCurrency(snack.price * snack.quantity) }}</span>
                    </div>

                    <!-- Total -->
                    <div class="detail-row total-row">
                        <span class="label"><strong>Tổng cộng</strong></span>
                        <span class="value total-value">{{ formatCurrency(grandTotal) }}</span>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="action-buttons">
                    <button @click="goBack" class="btn-back-action">Quay lại</button>
                    <button @click="proceedToPayment" class="btn-continue">Tiếp tục</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import AppHeader from "@/components/AppHeader.vue";
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import Swal from "sweetalert2";
import api from "../api.js";

const router = useRouter();
const route = useRoute();

const movieId = route.params.movieId;
const showtimeId = route.params.showtimeId;
const DEBUG_HOLD_DURATION_MS = 10 * 60 * 1000; // Default 10 minutes

const movie = ref(null);
const showtime = ref(null);
const selectedSeats = ref([]);
const ticketPrice = ref(0);
const loading = ref(true);
const snackList = ref([]);
const selectedSnacks = ref({});

// Timer
const timeRemaining = ref("06:47");
let timerInterval = null;

onMounted(async () => {
    try {
        const bookingData = JSON.parse(sessionStorage.getItem("tempBookingData") || "{}");
        const bookingFlowKey = bookingData.bookingFlowKey || `${movieId}_${showtimeId}_${bookingData.expiryTime || ""}`;

        if (!bookingData.selectedSeats || bookingData.selectedSeats.length === 0) {
            alert("Không tìm thấy thông tin đặt vé. Vui lòng chọn ghế lại.");
            router.push(`/booking/${movieId}/seats/${showtimeId}`);
            return;
        }

        selectedSeats.value = bookingData.selectedSeats;
        ticketPrice.value = bookingData.totalPrice;

        const [resMovie, resShowtime, resSnacks] = await Promise.all([
            api.get(`/movies/${movieId}`),
            api.get(`/showtimes/${showtimeId}`),
            api.get(`/snacks`),
        ]);

        movie.value = resMovie.data;
        showtime.value = resShowtime.data;

        snackList.value = resSnacks.data.map((snack) => ({
            id: snack.snackId,
            name: snack.snackName,
            description: snack.description,
            price: snack.price,
            image: snack.imageUrl || "https://via.placeholder.com/150?text=Snack",
        }));

        const savedSnacks = sessionStorage.getItem("selectedSnacks");
        const savedSnacksFlowKey = sessionStorage.getItem("selectedSnacksFlowKey");
        if (savedSnacks && savedSnacksFlowKey === bookingFlowKey) {
            const snacksArray = JSON.parse(savedSnacks);
            selectedSnacks.value = snacksArray.reduce((acc, snack) => {
                acc[snack.id] = snack.quantity;
                return acc;
            }, {});
        } else {
            selectedSnacks.value = {};
            sessionStorage.removeItem("selectedSnacks");
            sessionStorage.removeItem("selectedSnacksFlowKey");
        }

        loading.value = false;

        // Calculate remaining time based on expiryTime from backend
        const expiryTime = bookingData.expiryTime || new Date().getTime() + DEBUG_HOLD_DURATION_MS;
        const remainingSeconds = Math.max(0, Math.floor((expiryTime - new Date().getTime()) / 1000));

        startTimer(remainingSeconds);
    } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
        alert("Không thể tải thông tin đặt vé!");
        loading.value = false;
    }
});

onUnmounted(() => {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
});

// Computed
const selectedSeatsNumbers = computed(() => {
    return selectedSeats.value.map((s) => s.seatNumber).join(", ");
});

const seatsText = computed(() => {
    const firstSeat = selectedSeats.value[0];
    if (!firstSeat) return "GHẾ";
    return firstSeat.seatType || "GHẾ";
});

const selectedSnacksList = computed(() => {
    return Object.keys(selectedSnacks.value)
        .filter((id) => selectedSnacks.value[id] > 0)
        .map((id) => {
            const snack = snackList.value.find((s) => s.id === parseInt(id));
            return {
                id: snack.id,
                name: snack.name,
                price: snack.price,
                quantity: selectedSnacks.value[id],
            };
        });
});

const snackTotal = computed(() => {
    return Object.keys(selectedSnacks.value).reduce((total, snackId) => {
        const snack = snackList.value.find((s) => s.id === parseInt(snackId));
        const quantity = selectedSnacks.value[snackId] || 0;
        return total + (snack ? snack.price * quantity : 0);
    }, 0);
});

const grandTotal = computed(() => {
    return ticketPrice.value + snackTotal.value;
});

// Methods
const getQuantity = (snackId) => {
    return selectedSnacks.value[snackId] || 0;
};

const increaseQuantity = (snackId) => {
    if (!selectedSnacks.value[snackId]) {
        selectedSnacks.value[snackId] = 0;
    }
    selectedSnacks.value[snackId]++;
};

const decreaseQuantity = (snackId) => {
    if (selectedSnacks.value[snackId] && selectedSnacks.value[snackId] > 0) {
        selectedSnacks.value[snackId]--;
        if (selectedSnacks.value[snackId] === 0) {
            delete selectedSnacks.value[snackId];
        }
    }
};

const goBack = () => {
    router.push(`/booking/${movieId}/seats/${showtimeId}`);
};

const proceedToPayment = () => {
    const snacksForBooking = Object.keys(selectedSnacks.value)
        .filter((id) => selectedSnacks.value[id] > 0)
        .map((id) => {
            const snack = snackList.value.find((s) => s.id === parseInt(id));
            return {
                id: snack.id,
                name: snack.name,
                price: snack.price,
                quantity: selectedSnacks.value[id],
            };
        });

    sessionStorage.setItem("selectedSnacks", JSON.stringify(snacksForBooking));

    const bookingData = JSON.parse(sessionStorage.getItem("tempBookingData") || "{}");
    const bookingFlowKey = bookingData.bookingFlowKey || `${movieId}_${showtimeId}_${bookingData.expiryTime || ""}`;
    sessionStorage.setItem("selectedSnacksFlowKey", bookingFlowKey);
    bookingData.snackTotal = snackTotal.value;
    bookingData.grandTotal = grandTotal.value;
    sessionStorage.setItem("tempBookingData", JSON.stringify(bookingData));

    router.push(`/booking/${movieId}/seats/${showtimeId}/payment`);
};

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

const handleImageError = (e) => {
    e.target.src = "https://via.placeholder.com/150?text=Snack";
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
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

.snack-selection-page {
    background: #f5f5f5;
    min-height: 100vh;
    padding-bottom: 2rem;
}

/* Progress Tabs */
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

/* Main Content */
.main-content {
    max-width: 1400px;
    margin: 2rem auto;
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 2rem;
    padding: 0 2rem;
}

/* Left Panel */
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

.loading-section {
    text-align: center;
    padding: 3rem;
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

.snacks-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.snack-item {
    display: grid;
    grid-template-columns: 120px 1fr auto;
    gap: 1.5rem;
    padding: 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    align-items: center;
    transition: all 0.3s ease;
}

.snack-item:hover {
    border-color: #ff6b35;
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.1);
}

.snack-image {
    width: 120px;
    height: 120px;
    overflow: hidden;
    border-radius: 8px;
}

.snack-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.snack-details {
    flex: 1;
}

.snack-name {
    font-size: 1.1rem;
    font-weight: 600;
    color: #333;
    margin-bottom: 0.5rem;
}

.snack-description {
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 0.75rem;
    line-height: 1.4;
}

.snack-price {
    font-size: 1rem;
    color: #333;
}

.snack-price strong {
    color: #ff6b35;
    font-size: 1.1rem;
}

.quantity-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.btn-qty {
    width: 36px;
    height: 36px;
    border: 1px solid #ddd;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
}

.btn-qty:hover:not(:disabled) {
    background: #ff6b35;
    border-color: #ff6b35;
    color: white;
}

.btn-qty:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

.quantity {
    min-width: 30px;
    text-align: center;
    font-weight: 600;
    font-size: 1.1rem;
}

/* Right Panel */
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

.booking-details {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin-bottom: 1.5rem;
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

.value {
    font-weight: 600;
    color: #333;
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
.btn-continue {
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

.btn-continue {
    background: #ff6b35;
    color: white;
}

.btn-continue:hover {
    background: #ff5722;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
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
    }

    .tab {
        padding: 0.5rem 0.75rem;
    }

    .snack-item {
        grid-template-columns: 80px 1fr;
        grid-template-rows: auto auto;
    }

    .quantity-controls {
        grid-column: 1 / -1;
        justify-content: center;
        margin-top: 1rem;
    }
}
</style>
