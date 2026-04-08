<template>
    <div class="seat-map-page">
        <AppHeader />

        <div class="container py-5">
            <!-- Loading -->
            <div v-if="loading" class="text-center mt-5 py-5">
                <div class="spinner"></div>
                <p class="loading-text mt-3">Đang tải sơ đồ ghế...</p>
            </div>

            <!-- Nội dung chính -->
            <div v-else-if="movie && showtime">
                <!-- Thông tin phim -->
                <div class="movie-info-card">
                    <h2 class="movie-title">{{ movie.title }}</h2>
                    <div class="movie-details">
                        <div class="detail-item">
                            <span class="detail-icon">📅</span>
                            <span>{{ formatDate(showtime.startTime) }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-icon">🕐</span>
                            <span>{{ formatTime(showtime.startTime) }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-icon">🏠</span>
                            <span>{{ showtime.room?.roomName }}</span>
                        </div>
                    </div>
                </div>

                <!-- Màn hình -->
                <div class="screen">MÀN HÌNH</div>

                <!-- Sơ đồ ghế -->
                <div class="seat-grid mb-4">
                    <div
                        v-for="(row, rowIndex) in seatLayout"
                        :key="rowIndex"
                        class="seat-row d-flex justify-content-center mb-2"
                    >
                        <div
                            v-for="seat in row"
                            :key="seat.seatId"
                            class="seat text-center"
                            :class="{
                                'seat-selected': selectedSeats.includes(seat.seatId),
                                'seat-booked': seat.booked,
                                'seat-vip': seat.seatType === 'VIP' || seat.type === 'VIP',
                                'seat-sweetbox': seat.seatType === 'SWEETBOX' || seat.type === 'SWEETBOX',
                                'seat-sweetbox-row': isInSweetboxRow(seat),
                            }"
                            @click="toggleSeat(seat)"
                        >
                            {{ seat.seatNumber }}
                        </div>
                    </div>
                </div>

                <!-- Ghi chú -->
                <div class="seat-legend">
                    <div class="legend-item">
                        <span class="legend-dot seat-regular"></span>
                        <span>Thường</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-dot seat-vip"></span>
                        <span>VIP</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-dot seat-sweetbox"></span>
                        <span>Sweetbox</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-dot seat-selected"></span>
                        <span>Đang chọn</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-dot seat-booked"></span>
                        <span>Đã đặt</span>
                    </div>
                </div>

                <!-- Tổng tiền -->
                <div class="booking-summary">
                    <div class="price-info">
                        <p class="total-price">
                            Tổng: <span class="price">{{ totalPrice.toLocaleString() }}</span
                            >đ
                        </p>
                    </div>
                    <button
                        class="btn-confirm"
                        :class="{ disabled: selectedSeats.length === 0 }"
                        :disabled="selectedSeats.length === 0"
                        @click="openPhoneModal"
                    >
                        Xác nhận đặt vé
                    </button>
                </div>
            </div>

            <!-- Nếu không tải được -->
            <div v-else class="error-state">
                <p>Không thể tải dữ liệu ghế. Vui lòng thử lại sau.</p>
            </div>
        </div>

        <!-- Modal nhập SĐT để tích điểm -->
        <div v-if="showPhoneModal" class="modal-overlay" @click="closePhoneModal">
            <div class="modal-content" @click.stop>
                <div class="modal-header">
                    <h5 class="modal-title">Sử dụng điểm tích lũy</h5>
                    <button type="button" class="btn-close" @click="closePhoneModal">×</button>
                </div>
                <div class="modal-body">
                    <!-- Dùng điểm giảm giá -->
                    <div class="form-section">
                        <h6 class="section-title">Sử dụng điểm tích lũy</h6>
                        <p class="section-desc">
                            Số điểm hiện có: <strong>{{ customerLoyaltyPoints }}</strong> điểm ({{
                                (customerLoyaltyPoints * 1000).toLocaleString()
                            }}đ)
                        </p>

                        <div class="input-group">
                            <input
                                v-model.number="pointsToUse"
                                type="number"
                                class="form-input"
                                min="0"
                                :max="Math.min(customerLoyaltyPoints, Math.floor(totalPrice / 1000))"
                                placeholder="Nhập số điểm (1 điểm = 1.000đ)"
                            />
                            <span class="input-suffix">điểm</span>
                        </div>

                        <div v-if="pointsToUse > 0" class="success-box">
                            Giảm: {{ (pointsToUse * 1000).toLocaleString() }}đ
                            <br />
                            <strong>Tổng thanh toán: {{ (totalPrice - pointsToUse * 1000).toLocaleString() }}đ</strong>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" @click="closePhoneModal">Hủy</button>
                    <button type="button" class="btn-primary" @click="proceedToPayment">Tiếp tục thanh toán</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import AppHeader from "@/components/AppHeader.vue";
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "@/api";
import { useAuthStore } from "@/stores/auth.store";

const route = useRoute();
const router = useRouter();

const auth = useAuthStore();
const movieId = route.params.movieId;
const showtimeId = route.params.showtimeId;

// State cho modal SĐT
const showPhoneModal = ref(false);
const customerPhone = ref("");
const customerLoyaltyPoints = ref(0);
const pointsToUse = ref(0);
const pointsRedeemed = ref(0);

const openPhoneModal = async () => {
    if (selectedSeats.value.length === 0) {
        alert("Vui lòng chọn ghế!");
        return;
    }

    try {
        // Save booking data to sessionStorage with seat details and expiry time
        const selectedSeatDetails = selectedSeats.value
            .map((seatId) => {
                const seat = seats.value.find((s) => s.seatId === seatId);
                if (!seat) {
                    console.error(`Không tìm thấy ghế với ID: ${seatId}`);
                    return null;
                }
                return {
                    seatId: seat.seatId,
                    seatNumber: seat.seatNumber,
                    seatType: seat.seatType || seat.type,
                    price: getSeatPrice(seat),
                };
            })
            .filter(Boolean); // Remove any null entries

        if (selectedSeatDetails.length === 0) {
            alert("Lỗi: Không thể lấy thông tin ghế. Vui lòng thử lại!");
            return;
        }

        const bookingData = {
            selectedSeats: selectedSeatDetails,
            totalPrice: totalPrice.value,
            showtimeId: showtimeId,
            movieId: movieId,
            expiryTime: new Date().getTime() + 10 * 60 * 1000, // Backend giữ ghế 10 phút (600 seconds)
        };
        sessionStorage.setItem("tempBookingData", JSON.stringify(bookingData));

        // Navigate to snack selection page
        router.push(`/booking/${movieId}/seats/${showtimeId}/snacks`);
    } catch (error) {
        console.error("Lỗi khi xác nhận đặt vé:", error);
        alert("Có lỗi xảy ra. Vui lòng thử lại!");
    }
};
const closePhoneModal = () => {
    showPhoneModal.value = false;
    // KHÔNG reset pointsToUse ở đây, nó sẽ được dùng trong confirmBooking()
};

const proceedToPayment = async () => {
    // Đóng modal và tiếp tục thanh toán
    showPhoneModal.value = false;

    console.log(`[DEBUG] proceedToPayment - pointsToUse: ${pointsToUse.value}`);

    // Tiếp tục thanh toán
    await confirmBooking();
};

const loading = ref(true);
const movie = ref(null);
const showtime = ref(null);
const seats = ref([]);
const selectedSeats = ref([]);

// Tải dữ liệu phim, suất chiếu, ghế
onMounted(async () => {
    try {
        const [resMovie, resShowtime, resSeats] = await Promise.all([
            api.get(`/movies/${movieId}`),
            api.get(`/showtimes/${showtimeId}`),
            api.get(`/seats/showtime/${showtimeId}`), // Endpoint công khai để lấy ghế
        ]);

        movie.value = resMovie.data;
        showtime.value = resShowtime.data;

        // Xử lý dữ liệu ghế - tách ghế Sweetbox thành 2 ghế riêng biệt
        const rawSeats = resSeats.data || [];
        const processedSeats = [];

        rawSeats.forEach((seat) => {
            // Kiểm tra nếu là ghế Sweetbox có dạng F1-2, F3-4, etc.
            if ((seat.type === "SWEETBOX" || seat.seatType === "SWEETBOX") && seat.seatNumber.includes("-")) {
                const [start, end] = seat.seatNumber.split("-");
                const rowLetter = start.charAt(0);
                const startNum = parseInt(start.substring(1));
                const endNum = parseInt(end);

                // Tạo 2 ghế riêng biệt
                for (let i = startNum; i <= endNum; i++) {
                    processedSeats.push({
                        ...seat,
                        seatId: `${seat.seatId}_${i}`, // Tạo ID duy nhất cho mỗi ghế
                        seatNumber: `${rowLetter}${i}`,
                        originalSweetboxId: seat.seatId, // Lưu ID gốc để xử lý booking
                    });
                }
            } else {
                // Ghế thường, giữ nguyên
                processedSeats.push(seat);
            }
        });

        seats.value = processedSeats;
    } catch (err) {
        console.error("Lỗi khi tải dữ liệu ghế:", err);
    } finally {
        loading.value = false;
    }
});

// Tạo lưới ghế (theo hàng A–F)
const seatLayout = computed(() => {
    const grouped = {};
    seats.value.forEach((s) => {
        const row = s.rowLabel || s.seatNumber.charAt(0);
        if (!grouped[row]) grouped[row] = [];
        grouped[row].push(s);
    });
    return Object.values(grouped);
});

// Tổng tiền
const totalPrice = computed(() => {
    const basePrice = showtime.value?.price || 0;
    if (basePrice === 0) return 0;

    // Định nghĩa các mức phụ thu
    const VIP_SURCHARGE = 20000; // Phụ thu cho ghế VIP

    return selectedSeats.value
        .map((id) => seats.value.find((s) => s.seatId === id))
        .filter(Boolean)
        .reduce((sum, seat) => {
            let seatPrice = basePrice;
            if (seat.type === "VIP") {
                seatPrice += VIP_SURCHARGE;
            } else if (seat.type === "SWEETBOX") {
                // Ghế đôi thường có giá gấp đôi
                seatPrice = basePrice * 2;
            }
            return sum + seatPrice;
        }, 0);
});

// Helper function to calculate individual seat price
const getSeatPrice = (seat) => {
    const basePrice = showtime.value?.price || 0;
    const VIP_SURCHARGE = 20000;

    let seatPrice = basePrice;
    if (seat.type === "VIP" || seat.seatType === "VIP") {
        seatPrice += VIP_SURCHARGE;
    } else if (seat.type === "SWEETBOX" || seat.seatType === "SWEETBOX") {
        seatPrice = basePrice * 2;
    }
    return seatPrice;
};

// Chọn / bỏ chọn ghế
const toggleSeat = (seat) => {
    if (seat.booked) return;

    // Logic đặc biệt cho ghế Sweetbox
    if (seat.type === "SWEETBOX" || seat.seatType === "SWEETBOX") {
        const index = selectedSeats.value.indexOf(seat.seatId);

        if (index !== -1) {
            // Bỏ chọn ghế Sweetbox - bỏ chọn cả cặp
            selectedSeats.value.splice(index, 1);

            // Tìm ghế cặp (cùng originalSweetboxId) và bỏ chọn luôn
            const pairSeat = seats.value.find(
                (s) => s.originalSweetboxId === seat.originalSweetboxId && s.seatId !== seat.seatId,
            );

            if (pairSeat) {
                const pairIndex = selectedSeats.value.indexOf(pairSeat.seatId);
                if (pairIndex !== -1) {
                    selectedSeats.value.splice(pairIndex, 1);
                }
            }

            console.log(`Bỏ chọn ghế Sweetbox: ${seat.seatNumber} và ghế cặp`);
        } else {
            // Chọn ghế Sweetbox - chọn cả cặp
            selectedSeats.value.push(seat.seatId);

            // Tìm ghế cặp (cùng originalSweetboxId) và chọn luôn
            const pairSeat = seats.value.find(
                (s) => s.originalSweetboxId === seat.originalSweetboxId && s.seatId !== seat.seatId && !s.booked,
            );

            if (pairSeat && !selectedSeats.value.includes(pairSeat.seatId)) {
                selectedSeats.value.push(pairSeat.seatId);
            }

            console.log(`Chọn ghế Sweetbox: ${seat.seatNumber} và ghế cặp`);
        }
    } else {
        // Logic thường cho ghế Regular và VIP
        const index = selectedSeats.value.indexOf(seat.seatId);
        if (index !== -1) selectedSeats.value.splice(index, 1);
        else selectedSeats.value.push(seat.seatId);
    }
};

// Format ngày & giờ
const formatDate = (d) =>
    new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

const formatTime = (time) => (time ? time.split("T")[1].substring(0, 5) : "");

// Check if seat is in sweetbox row (usually row M)
const isInSweetboxRow = (seat) => {
    const rowLetter = seat.seatNumber.charAt(0);
    return rowLetter === "M" || seat.seatType === "SWEETBOX" || seat.type === "SWEETBOX";
};

// Xác nhận đặt vé + thanh toán VNPay
const confirmBooking = async () => {
    if (selectedSeats.value.length === 0) {
        alert("Vui lòng chọn ghế!");
        return;
    }

    // Kiểm tra xem người dùng đã đăng nhập chưa
    if (!auth.isAuthenticated) {
        alert("Bạn cần đăng nhập để có thể đặt vé!");
        router.push("/login"); // Chuyển hướng đến trang đăng nhập
        return;
    }

    try {
        // Chuyển đổi seatIds về dạng gốc cho backend
        const seatIdsForBooking = selectedSeats.value.map((seatId) => {
            const seat = seats.value.find((s) => s.seatId === seatId);
            // Nếu là ghế Sweetbox đã được tách, dùng originalSweetboxId
            return seat.originalSweetboxId || seatId;
        });

        // Loại bỏ ID trùng lặp (vì Sweetbox được tách thành 2 ghế nhưng chỉ cần 1 booking)
        const uniqueSeatIds = [...new Set(seatIdsForBooking)];

        // Tạo booking giữ ghế (PENDING)
        const res = await api.post(`/bookings`, {
            showtimeId,
            seatIds: uniqueSeatIds,
        });

        const txnRef = res.data.txnRef;
        let finalAmount = totalPrice.value;
        let discountFromPoints = 0;

        // Nếu dùng điểm, tính toán giảm giá
        if (pointsToUse.value > 0) {
            discountFromPoints = pointsToUse.value * 1000;
            finalAmount = totalPrice.value - discountFromPoints;
        }

        // Gọi BE tạo link VNPay
        const payRes = await api.post(`/payments/create-payment`, {
            txnRef,
            amount: finalAmount,
            orderDescription: `Thanh toán vé xem phim ${movie.value.title}`,
        });

        const paymentUrl = payRes.data.paymentUrl;

        // Lưu pointsToUse vào sessionStorage (sẽ được xóa khi đóng tab)
        if (pointsToUse.value > 0) {
            sessionStorage.setItem(
                "pendingPointsRedeem",
                JSON.stringify({
                    txnRef: txnRef,
                    pointsToUse: pointsToUse.value,
                }),
            );
        }

        // Redirect đến VNPay thật (sandbox) - URL nguyên bản, không thêm params
        window.location.href = paymentUrl;
    } catch (err) {
        console.error("Lỗi thanh toán:", err);
        alert("Không thể khởi tạo thanh toán!");
    }
};
</script>

<style scoped>
/* Global styling */
.seat-map-page {
    background: #f5f5f5;
    color: #333;
    min-height: 100vh;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
}

/* Loading */
.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255, 107, 53, 0.2);
    border-top-color: #ff6b35;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.loading-text {
    color: #666;
    font-size: 1rem;
}

/* Movie info card */
.movie-info-card {
    background: #fff;
    border: 1px solid #e6e6e6;
    border-radius: 16px;
    padding: 2rem;
    margin-bottom: 2rem;
    text-align: center;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.movie-title {
    font-size: 2rem;
    font-weight: 700;
    color: #2f2f2f;
    margin-bottom: 1.5rem;
}

.movie-details {
    display: flex;
    justify-content: center;
    gap: 2rem;
    flex-wrap: wrap;
}

.detail-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #666;
    font-size: 1rem;
}

.detail-icon {
    font-size: 1.2rem;
}

/* Screen */
.screen {
    background: linear-gradient(135deg, #ff6b35, #ff8a5f);
    color: #fff;
    text-align: center;
    padding: 1rem;
    margin: 2rem auto;
    border-radius: 12px;
    font-size: 1.2rem;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.25);
    max-width: 400px;
}

/* Seat grid */
.seat-grid {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 2rem;
}

.seat-row {
    display: flex;
    gap: 4px;
    margin-bottom: 8px;
    justify-content: center;
    max-width: 600px;
}

/* Sweetbox row - wider and closer spacing */
.seat-row:has(.seat-sweetbox-row) {
    gap: 2px;
    max-width: 700px;
}

.seat {
    width: 40px;
    height: 40px;
    line-height: 40px;
    text-align: center;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    background: #fff;
    color: #444;
    border: 1px solid #d7d7d7;
}

.seat:hover:not(.seat-booked) {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.25);
}

.seat-vip {
    background: linear-gradient(135deg, #9c27b0, #e91e63);
    border-color: #9c27b0;
}

.seat-sweetbox {
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-color: #667eea;
    box-shadow: 0 0 8px rgba(102, 126, 234, 0.3);
}

/* Sweetbox row styling - make them look connected like CGV */
.seat-sweetbox-row {
    border-radius: 6px;
    margin: 0 1px;
    position: relative;
    overflow: hidden;
}

.seat-sweetbox-row::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent);
    pointer-events: none;
}

/* First seat in sweetbox row */
.seat-sweetbox-row:first-of-type {
    border-radius: 8px 6px 6px 8px;
    margin-left: 0;
}

/* Last seat in sweetbox row */
.seat-sweetbox-row:last-of-type {
    border-radius: 6px 8px 8px 6px;
    margin-right: 0;
}

.seat-selected {
    background: linear-gradient(135deg, #ff6b35, #ff8a5f);
    color: #fff;
    border-color: #ff6b35;
    box-shadow: 0 0 16px rgba(255, 107, 53, 0.35);
}

.seat-booked {
    background: #666;
    color: #d0d0d0;
    cursor: not-allowed;
    opacity: 0.5;
}

/* Legend */
.seat-legend {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #555;
    font-size: 0.9rem;
}

.legend-dot {
    width: 16px;
    height: 16px;
    border-radius: 4px;
    display: inline-block;
}

.legend-dot.seat-regular {
    background: #fff;
    border: 1px solid #d7d7d7;
}
.legend-dot.seat-vip {
    background: linear-gradient(135deg, #9c27b0, #e91e63);
}
.legend-dot.seat-sweetbox {
    background: linear-gradient(135deg, #667eea, #764ba2);
}
.legend-dot.seat-selected {
    background: linear-gradient(135deg, #ff6b35, #ff8a5f);
}
.legend-dot.seat-booked {
    background: #666;
}

/* Booking summary */
.booking-summary {
    background: #fff;
    border: 1px solid #e6e6e6;
    border-radius: 16px;
    padding: 2rem;
    text-align: center;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.price-info {
    margin-bottom: 1.5rem;
}

.total-price {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
}

.price {
    color: #ff6b35;
}

.loyalty-info {
    color: #666;
    font-size: 0.9rem;
}

.btn-confirm {
    background: linear-gradient(135deg, #ff6b35, #ff8a5f);
    color: #fff;
    border: none;
    padding: 1rem 2rem;
    border-radius: 12px;
    font-size: 1.1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.25);
}

.btn-confirm:hover:not(.disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(255, 107, 53, 0.35);
}

.btn-confirm.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Error state */
.error-state {
    text-align: center;
    color: #ff6b6b;
    font-size: 1.2rem;
    padding: 3rem;
}

/* Modal */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background: #fff;
    border-radius: 16px;
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal-header {
    padding: 1.5rem;
    border-bottom: 1px solid #ececec;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-title {
    font-size: 1.3rem;
    font-weight: 700;
    color: #ff6b35;
    margin: 0;
}

.btn-close {
    background: none;
    border: none;
    color: #666;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background 0.2s;
}

.btn-close:hover {
    background: #f4f4f4;
}

.modal-body {
    padding: 1.5rem;
}

.form-section {
    margin-bottom: 1.5rem;
}

.section-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #ff6b35;
    margin-bottom: 0.5rem;
}

.section-desc {
    color: #666;
    font-size: 0.9rem;
    margin-bottom: 1rem;
}

.form-input {
    width: 100%;
    padding: 0.75rem;
    background: #fff;
    border: 1px solid #d8d8d8;
    border-radius: 8px;
    color: #333;
    font-size: 1rem;
    transition: border-color 0.3s;
}

.form-input:focus {
    outline: none;
    border-color: #ff6b35;
}

.input-group {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.input-suffix {
    color: #666;
    font-size: 0.9rem;
}

.divider {
    height: 1px;
    background: #333;
    margin: 1.5rem 0;
}

.info-box,
.success-box {
    padding: 0.75rem;
    border-radius: 8px;
    font-size: 0.9rem;
    margin-top: 0.5rem;
}

.info-box {
    background: rgba(0, 123, 255, 0.1);
    color: #4dabf7;
    border: 1px solid rgba(0, 123, 255, 0.2);
}

.success-box {
    background: rgba(40, 167, 69, 0.1);
    color: #51cf66;
    border: 1px solid rgba(40, 167, 69, 0.2);
}

.modal-footer {
    padding: 1.5rem;
    border-top: 1px solid #ececec;
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
}

.btn-secondary,
.btn-primary {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn-secondary {
    background: #e9ecef;
    color: #fff;
}

.btn-secondary:hover {
    background: #dbe1e6;
}

.btn-primary {
    background: linear-gradient(135deg, #ff6b35, #ff8a5f);
    color: #fff;
}

.btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
}

/* Responsive */
@media (max-width: 768px) {
    .container {
        padding: 0 1rem;
    }

    .movie-details {
        gap: 1rem;
    }

    .seat-legend {
        gap: 1rem;
    }

    .seat {
        width: 35px;
        height: 35px;
        line-height: 35px;
    }
}
</style>
