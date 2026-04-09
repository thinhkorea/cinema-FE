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
                <div class="auditorium-panel" :style="seatAreaStyle">
                    <div class="seat-map-header">
                        <h2 class="seat-map-title">CHỌN GHẾ - {{ roomDisplayName }}</h2>
                        <p class="seat-map-subtitle">
                            {{ movie.title }} • {{ formatDate(showtime.startTime) }} •
                            {{ formatTime(showtime.startTime) }}
                        </p>
                    </div>

                    <div class="screen-curve-wrap">
                        <div class="screen-curve"></div>
                        <p class="screen-label">Màn hình</p>
                    </div>

                    <div class="seat-grid mb-4">
                        <div
                            v-for="row in seatLayout"
                            :key="row.rowLabel"
                            class="seat-row"
                            :class="{ 'seat-row-sweetbox': row.hasSweetbox }"
                        >
                            <div class="row-label">{{ row.rowLabel }}</div>
                            <div class="row-seats" :class="{ 'row-seats-sweetbox': row.hasSweetbox }">
                                <div
                                    v-for="seat in row.seatsDisplay"
                                    :key="seat.seatId || seat.placeholderId"
                                    class="seat text-center"
                                    :class="{
                                        'seat-placeholder': seat.isPlaceholder,
                                        'seat-selected': selectedSeats.includes(seat.seatId),
                                        'seat-booked': seat.booked,
                                        'seat-vip': seat.seatType === 'VIP' || seat.type === 'VIP',
                                        'seat-sweetbox': seat.seatType === 'SWEETBOX' || seat.type === 'SWEETBOX',
                                    }"
                                    @click="!seat.isPlaceholder && toggleSeat(seat)"
                                >
                                    {{ seat.seatNumber }}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="seat-legend">
                        <div class="legend-item">
                            <span class="legend-dot seat-regular"></span>
                            <span>Ghế thường</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-dot seat-vip"></span>
                            <span>Ghế VIP</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-dot seat-sweetbox"></span>
                            <span>Ghế đôi (2 người)</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-dot seat-selected"></span>
                            <span>Ghế chọn</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-dot seat-booked"></span>
                            <span>Ghế đã đặt</span>
                        </div>
                    </div>

                    <div class="booking-summary">
                        <div class="price-info">
                            <p class="total-price">
                                Tổng thanh toán: <span class="price">{{ totalPrice.toLocaleString() }}đ</span>
                            </p>
                        </div>
                        <div class="selected-count">
                            Đang chọn: <strong>{{ selectedSeats.length }}</strong> ghế
                        </div>
                        <button
                            class="btn-confirm"
                            :class="{ disabled: selectedSeats.length === 0 }"
                            :disabled="selectedSeats.length === 0"
                            @click="openPhoneModal"
                        >
                            Tiếp tục
                        </button>
                    </div>
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
const roomDisplayName = computed(() => String(showtime.value?.room?.roomName || "Rạp").toUpperCase());
const TARGET_SEATS_PER_ROW = 16;

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
    return Object.keys(grouped)
        .sort((a, b) => a.localeCompare(b))
        .map((rowLabel) => {
            const rowSeats = grouped[rowLabel].sort((a, b) => extractSeatOrder(a) - extractSeatOrder(b));
            const hasSweetbox = rowSeats.some((seat) => seat.seatType === "SWEETBOX" || seat.type === "SWEETBOX");

            // Chuẩn hóa UI thành 16 vị trí/hàng cho rạp thường.
            let seatsDisplay = rowSeats;
            if (!hasSweetbox) {
                const seatMapByOrder = new Map();
                rowSeats.forEach((seat) => seatMapByOrder.set(extractSeatOrder(seat), seat));

                seatsDisplay = Array.from({ length: TARGET_SEATS_PER_ROW }, (_, idx) => {
                    const order = idx + 1;
                    return (
                        seatMapByOrder.get(order) || {
                            isPlaceholder: true,
                            placeholderId: `${rowLabel}-placeholder-${order}`,
                            seatNumber: `${rowLabel}${order}`,
                        }
                    );
                });
            }

            return {
                rowLabel,
                seats: rowSeats,
                seatsDisplay,
                hasSweetbox,
            };
        });
});

const seatAreaStyle = computed(() => {
    const maxRowWidth = seatLayout.value.reduce((maxWidth, row) => {
        const seatsWidth = row.seatsDisplay.reduce((sum, seat) => {
            if (seat.isPlaceholder) {
                return sum + 42;
            }
            const isSweetbox = seat.seatType === "SWEETBOX" || seat.type === "SWEETBOX";
            return sum + (isSweetbox ? 92 : 42);
        }, 0);
        const gapsWidth = Math.max(row.seatsDisplay.length - 1, 0) * 9;
        const rowWidth = 24 + seatsWidth + gapsWidth + 10;
        return Math.max(maxWidth, rowWidth);
    }, 620);

    const clampedWidth = Math.min(Math.max(maxRowWidth, 620), 1120);
    return {
        "--seat-area-width": `${clampedWidth}px`,
    };
});

const extractSeatOrder = (seat) => {
    const match = String(seat.seatNumber || "").match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
};

// Tổng tiền
const totalPrice = computed(() => {
    const basePrice = showtime.value?.price || 0;
    if (basePrice === 0) return 0;

    // Định nghĩa các mức phụ thu
    const VIP_SURCHARGE = 10000; // Phụ thu cho ghế VIP

    return selectedSeats.value
        .map((id) => seats.value.find((s) => s.seatId === id))
        .filter(Boolean)
        .reduce((sum, seat) => {
            let seatPrice = basePrice;
            if (seat.type === "VIP" || seat.seatType === "VIP") {
                seatPrice += VIP_SURCHARGE;
            } else if (seat.type === "SWEETBOX" || seat.seatType === "SWEETBOX") {
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
    min-height: 100vh;
    background: var(--bg-page);
    color: var(--text-primary);
}

.container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 1.2rem;
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
    color: var(--text-secondary);
    font-size: 1rem;
}

/* Auditorium panel */
.auditorium-panel {
    background: #fff7f3;
    border: 1px solid #f1ddd5;
    border-radius: 20px;
    padding: 2rem 1rem 1.5rem;
    box-shadow: 0 16px 36px rgba(17, 22, 45, 0.12);
}

.seat-map-header {
    text-align: center;
    margin-bottom: 1.2rem;
}

.seat-map-title {
    font-size: clamp(1.5rem, 2.3vw, 2.25rem);
    margin: 0;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #2f2f2f;
    font-weight: 900;
}

.seat-map-subtitle {
    margin-top: 0.65rem;
    color: #6f6f6f;
    font-size: 0.95rem;
}

/* Screen */
.screen-curve-wrap {
    margin: 0 auto 1.2rem;
    width: min(var(--seat-area-width), 100%);
    text-align: center;
}

.screen-curve {
    height: 52px;
    border-top: 7px solid #e7eaef;
    border-radius: 50% / 100% 100% 0 0;
    opacity: 0.96;
    box-shadow: 0 -6px 18px rgba(101, 115, 139, 0.22);
}

.screen-label {
    margin-top: -18px;
    font-size: 1.7rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    color: #2f2f2f;
}

/* Seat grid */
.seat-grid {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 0 auto 1rem;
    width: min(var(--seat-area-width), 100%);
}

.seat-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    width: 100%;
    margin-bottom: 0.55rem;
}

.row-label {
    width: 24px;
    text-align: center;
    color: #333333;
    font-weight: 800;
    font-size: 1.05rem;
    flex-shrink: 0;
}

.row-seats {
    display: grid;
    grid-template-columns: repeat(16, 52px);
    gap: 0.55rem;
    justify-content: center;
}

.row-seats.row-seats-sweetbox {
    grid-template-columns: repeat(8, 110px);
}

.seat {
    width: 52px;
    min-width: 52px;
    height: 30px;
    padding: 0;
    line-height: 30px;
    text-align: center;
    border-radius: 7px;
    font-size: 0.9rem;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.22s ease;
    background: #ffffff;
    color: #30405f;
    border: 1.5px solid #cfd8ea;
    letter-spacing: 0.01em;
}

.seat-placeholder {
    background: #f4f6fb;
    border: 1px dashed #cfd6e4;
    color: #9aa8bf;
    box-shadow: none;
    cursor: default;
    pointer-events: none;
    opacity: 0.85;
}

.seat:hover:not(.seat-booked) {
    transform: translateY(-2px);
    box-shadow: 0 7px 14px rgba(255, 107, 53, 0.24);
}

.seat-vip {
    background: linear-gradient(135deg, #f5edff 0%, #ece0ff 100%);
    border: 2px solid #8e66ff;
    color: #4b2acb;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.55);
}

.seat-sweetbox {
    width: 110px;
    min-width: 110px;
    background: linear-gradient(135deg, #ffe8f2 0%, #ffd7e8 100%);
    border: 2px solid #ff5f98;
    border-radius: 12px;
    color: #972857;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.5);
}

.seat-selected {
    background: #f0e721;
    color: #2f2f2f;
    border-color: #f0e721;
    box-shadow: 0 0 0 2px rgba(240, 231, 33, 0.18);
}

.seat-booked {
    background: #8fa2bf;
    border-color: #8fa2bf;
    color: #eaf0ff;
    cursor: not-allowed;
    opacity: 0.82;
}

/* Legend */
.seat-legend {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin: 1.4rem auto 0.9rem;
    width: min(var(--seat-area-width), 100%);
    flex-wrap: nowrap;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    color: #3c3c3c;
    font-size: 1.05rem;
    font-weight: 700;
    white-space: nowrap;
}

.legend-dot {
    width: 28px;
    height: 20px;
    border-radius: 6px;
    display: inline-block;
}

.legend-dot.seat-regular {
    background: #ffffff;
    border: 1.5px solid #cfd8ea;
}
.legend-dot.seat-vip {
    background: linear-gradient(135deg, #f5edff 0%, #ece0ff 100%);
    border: 2px solid #8e66ff;
}
.legend-dot.seat-sweetbox {
    background: linear-gradient(135deg, #ffe8f2 0%, #ffd7e8 100%);
    border: 2px solid #ff5f98;
}
.legend-dot.seat-selected {
    background: #f0e721;
}
.legend-dot.seat-booked {
    background: #8fa2bf;
}

/* Booking summary */
.booking-summary {
    width: min(calc(var(--seat-area-width) + 120px), 100%);
    margin: 0.4rem auto 0;
    background: #1b2448;
    border: 1px solid #303b6b;
    border-radius: 14px;
    padding: 1.15rem 1.2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
}

.price-info {
    margin-bottom: 0;
}

.total-price {
    font-size: 1.12rem;
    font-weight: 700;
    margin: 0;
    color: #e9eeff;
}

.price {
    color: #f0e721;
}

.selected-count {
    color: #eef2ff;
    font-size: 0.95rem;
    margin-left: auto;
}

.btn-confirm {
    background: #ff6b35;
    color: #ffffff;
    border: none;
    padding: 0.78rem 1.4rem;
    border-radius: 10px;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-confirm:hover:not(.disabled) {
    transform: translateY(-1px);
    background: #ff5722;
}

.btn-confirm.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Error state */
.error-state {
    text-align: center;
    color: #ffb8b8;
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
        padding: 0 0.6rem;
    }

    .auditorium-panel {
        padding: 1.15rem 0.75rem 1rem;
        border-radius: 14px;
    }

    .seat-map-title {
        font-size: 1.35rem;
    }

    .screen-curve {
        height: 42px;
        border-top-width: 5px;
    }

    .screen-label {
        font-size: 1.3rem;
        margin-top: -14px;
    }

    .seat {
        width: 34px;
        min-width: 34px;
        height: 28px;
        line-height: 28px;
        font-size: 0.78rem;
        padding: 0;
    }

    .seat-sweetbox {
        width: 76px;
        min-width: 76px;
    }

    .row-seats {
        grid-template-columns: repeat(8, 34px);
        gap: 0.32rem;
    }

    .row-seats.row-seats-sweetbox {
        grid-template-columns: repeat(4, 76px);
    }

    .seat-legend {
        justify-content: center;
        flex-wrap: wrap;
        gap: 0.75rem;
    }

    .legend-item {
        font-size: 0.86rem;
    }

    .legend-dot {
        width: 22px;
        height: 16px;
    }

    .booking-summary {
        flex-direction: column;
        align-items: stretch;
        text-align: center;
    }

    .selected-count {
        margin-left: 0;
    }
}
</style>
