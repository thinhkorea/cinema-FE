<template>
    <!-- Modal Overlay -->
    <div class="payment-modal-overlay" @click="closeModal">
        <div class="payment-modal" @click.stop>
            <!-- Close Button -->
            <button class="close-btn" @click="closeModal">
                <i class="bi bi-x-lg"></i>
            </button>

            <!-- Success State -->
            <div v-if="isSuccess" class="success-state">
                <div class="status-icon success-icon">
                    <i class="bi bi-check-circle-fill"></i>
                </div>

                <h1 class="status-title">Thanh toán thành công!</h1>
                <p class="status-subtitle">Cảm ơn bạn đã đặt vé. Vé của bạn đã được xác nhận.</p>

                <div class="booking-info">
                    <div v-if="bookingCount > 1" class="info-item">
                        <span class="info-label">Số lượng vé:</span>
                        <span class="info-value">{{ bookingCount }} vé</span>
                    </div>

                    <div class="info-item">
                        <span class="info-label">Mã giao dịch:</span>
                        <span class="info-value transaction-code">{{ txnRef }}</span>
                    </div>
                </div>

                <div class="countdown-info">
                    <i class="bi bi-clock"></i>
                    Tự động chuyển đến trang vé trong {{ countdown }} giây...
                </div>
            </div>

            <!-- Error State -->
            <div v-else class="error-state">
                <div class="status-icon error-icon">
                    <i class="bi bi-x-circle-fill"></i>
                </div>

                <h1 class="status-title">Thanh toán thất bại!</h1>
                <p class="status-subtitle">Đã có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.</p>

                <div class="error-info">
                    <div class="info-item">
                        <span class="info-label">Mã lỗi từ VNPay:</span>
                        <span class="info-value error-code">
                            {{ route.query.vnp_ResponseCode || "Không xác định" }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="action-buttons">
                <button v-if="isSuccess" class="btn btn-primary" @click="goToMyBookings">
                    <i class="bi bi-ticket-detailed"></i>
                    Xem vé của tôi
                </button>
                <button v-else class="btn btn-primary" @click="closeModal">
                    <i class="bi bi-x-circle"></i>
                    Đóng
                </button>
            </div>

            <!-- Cinema Branding -->
            <div class="cinema-branding">
                <div class="cinema-row">
                    <i class="bi bi-building cinema-icon"></i>
                    <span class="cinema-label">Rạp chiếu phim:</span>
                    <span class="cinema-name">CinemaAndJoy</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { onMounted, ref, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "@/api";

const route = useRoute();
const router = useRouter();

const isSuccess = route.query.vnp_ResponseCode === "00";
const txnRef = route.query.vnp_TxnRef;
const bookingCount = ref(0);
const firstBookingId = ref(null);
const countdown = ref(3);
let countdownInterval = null;

// Đóng modal
const closeModal = () => {
    router.push("/");
};

// Đếm ngược
const startCountdown = () => {
    countdownInterval = setInterval(() => {
        countdown.value--;
        if (countdown.value <= 0) {
            clearInterval(countdownInterval);
            // Tự động chuyển hướng
            if (isSuccess && txnRef) {
                router.push(`/my-bookings/txn/${txnRef}`);
            } else {
                router.push("/");
            }
        }
    }, 1000);
};

onMounted(async () => {
    try {
        // Nếu thanh toán thất bại
        if (!isSuccess && txnRef) {
            await api.post(`/bookings/cancel-by-txn/${txnRef}`);
            return;
        }

        // Nếu thanh toán thành công
        if (isSuccess) {
            console.log("Thanh toán thành công.");

            // BƯỚC 1: REDEEM POINTS trước (nếu có)
            let pointsToRedeem = null;

            // Ưu tiên sessionStorage (từ SeatMapView vừa rồi)
            const sessionRedeem = sessionStorage.getItem("pendingPointsRedeem");
            if (sessionRedeem) {
                pointsToRedeem = JSON.parse(sessionRedeem);
            } else {
                // Fallback vào localStorage
                const localRedeem = localStorage.getItem("pendingPointsRedeem");
                if (localRedeem) {
                    pointsToRedeem = JSON.parse(localRedeem);
                }
            }

            if (pointsToRedeem) {
                try {
                    await api.post(`/bookings/redeem-points`, {
                        txnRef: pointsToRedeem.txnRef,
                        pointsToUse: pointsToRedeem.pointsToUse,
                    });

                    sessionStorage.removeItem("pendingPointsRedeem");
                    localStorage.removeItem("pendingPointsRedeem");
                } catch (err) {
                    console.error("Lỗi khi redeem points:", err);
                }
            }

            // BƯỚC 2: CONFIRM PAYMENT (sau khi redeem)
            const res = await api.post(`/bookings/confirm-payment/${txnRef}`);

            if (Array.isArray(res.data)) {
                bookingCount.value = res.data.length;
                firstBookingId.value = res.data[0]?.bookingId || null;
            } else if (res.data && res.data.bookingId) {
                bookingCount.value = 1;
                firstBookingId.value = res.data.bookingId;
            }

            // Bắt đầu đếm ngược
            startCountdown();
        }
    } catch (error) {
        console.error("Thanh toán thất bại:", error);
        setTimeout(() => router.push("/"), 3000);
    }
});

// Cleanup khi component bị destroy
onBeforeUnmount(() => {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
});

const goToMyBookings = () => {
    if (countdownInterval) clearInterval(countdownInterval);
    if (txnRef) router.push(`/my-bookings/txn/${txnRef}`);
    else router.push("/");
};
</script>

<style scoped>
/* Modal Overlay */
.payment-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 1rem;
    animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

/* Modal Content */
.payment-modal {
    background: rgba(26, 26, 26, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 24px;
    padding: 2.5rem 2rem;
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #ffffff;
    position: relative;
    animation: slideUp 0.4s ease-out;
}

@keyframes slideUp {
    from {
        transform: translateY(30px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

/* Close Button */
.close-btn {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 1.2rem;
}

.close-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
}

.status-icon {
    font-size: 4rem;
    margin-bottom: 1.5rem;
}

.success-icon {
    color: #28a745;
}

.error-icon {
    color: #dc3545;
}

.status-title {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 1rem;
    color: #ffffff;
}

.status-subtitle {
    font-size: 1.1rem;
    color: #cccccc;
    margin-bottom: 2rem;
    line-height: 1.6;
}

.booking-info,
.error-info {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding: 0.5rem 0;
}

.info-item:last-child {
    margin-bottom: 0;
}

.info-label {
    font-weight: 600;
    color: #cccccc;
    font-size: 0.95rem;
}

.info-value {
    font-weight: 700;
    color: #ffffff;
    font-size: 1rem;
}

.transaction-code {
    background: linear-gradient(45deg, #ffd700, #ffed4e);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-family: "Courier New", monospace;
    letter-spacing: 1px;
}

.error-code {
    color: #dc3545;
    font-family: "Courier New", monospace;
    letter-spacing: 1px;
}

.countdown-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    color: #cccccc;
    font-size: 0.9rem;
    margin-bottom: 1rem;
    padding: 0.75rem 1rem;
    background: rgba(255, 215, 0, 0.1);
    border-radius: 12px;
    border: 1px solid rgba(255, 215, 0, 0.2);
}

.countdown-info i {
    color: #ffd700;
}

.action-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
}

.btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.875rem 2rem;
    border-radius: 12px;
    font-weight: 600;
    font-size: 1rem;
    transition: all 0.3s ease;
    border: none;
    text-decoration: none;
    min-width: 160px;
    justify-content: center;
}

.btn-primary {
    background: linear-gradient(45deg, #ffd700, #ffed4e);
    color: #000000;
    box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
    font-weight: 700;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(255, 215, 0, 0.4);
    background: linear-gradient(45deg, #ffed4e, #ffd700);
}

.btn-secondary {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    border: 2px solid rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #ffffff;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
}

.cinema-branding {
    margin-top: 2rem;
    text-align: center;
    color: rgba(255, 255, 255, 0.9);
}

.cinema-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem 2rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.cinema-icon {
    font-size: 1.2rem;
    color: #ffd700;
}

.cinema-label {
    font-size: 0.9rem;
    font-weight: 500;
}

.cinema-name {
    font-size: 1rem;
    font-weight: 700;
    background: linear-gradient(45deg, #ffd700, #ffed4e);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

/* Responsive Design */
@media (max-width: 768px) {
    .payment-modal {
        margin: 0.5rem;
        padding: 2rem 1.5rem;
        max-height: 95vh;
    }

    .status-title {
        font-size: 1.5rem;
    }

    .status-icon {
        font-size: 3rem;
    }

    .action-buttons {
        flex-direction: column;
        align-items: center;
    }

    .btn {
        width: 100%;
        max-width: 250px;
    }

    .cinema-row {
        flex-wrap: wrap;
        padding: 0.75rem 1.5rem;
    }
}

@media (max-width: 480px) {
    .payment-modal-overlay {
        padding: 0.5rem;
    }

    .payment-modal {
        padding: 1.5rem 1rem;
    }

    .info-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
    }

    .countdown-info {
        font-size: 0.8rem;
        padding: 0.5rem 0.75rem;
    }

    .close-btn {
        width: 35px;
        height: 35px;
        font-size: 1rem;
    }
}

/* Print Styles */
@media print {
    .payment-modal-overlay {
        background: white;
        position: static;
    }

    .payment-modal {
        background: white;
        box-shadow: none;
        border: 1px solid #ddd;
        color: #000;
    }

    .close-btn,
    .action-buttons,
    .countdown-info {
        display: none;
    }
}

/* Accessibility */
.payment-modal-overlay {
    scroll-behavior: smooth;
}

.payment-modal:focus {
    outline: 2px solid #ffd700;
    outline-offset: 2px;
}

/* Prevent body scroll when modal is open */
body:has(.payment-modal-overlay) {
    overflow: hidden;
}
</style>
