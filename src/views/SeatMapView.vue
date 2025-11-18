<template>
    <AppHeader />

    <div class="seat-map container py-5">
        <!-- Loading -->
        <div v-if="loading" class="text-center mt-5 py-5">
            <div class="spinner-border text-warning" role="status"></div>
            <p class="text-secondary mt-3">Đang tải sơ đồ ghế...</p>
        </div>

        <!-- Nội dung chính -->
        <div v-else-if="movie && showtime">
            <!-- Thông tin phim -->
            <div class="text-center mb-5">
                <h2 class="fw-bold">{{ movie.title }}</h2>
                <p class="text-muted mb-1">
                    <i class="bi bi-calendar-event me-2"></i>Ngày chiếu:
                    {{ formatDate(showtime.startTime) }}
                </p>
                <p class="text-muted mb-1">
                    <i class="bi bi-clock me-2"></i>Giờ chiếu:
                    {{ formatTime(showtime.startTime) }}
                </p>
                <p class="text-muted">
                    <i class="bi bi-house me-2"></i>Phòng:
                    {{ showtime.room?.roomName }}
                </p>
            </div>

            <!-- Màn hình -->
            <div class="screen text-center mb-4 py-2 text-dark fw-bold bg-warning rounded">MÀN HÌNH</div>

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
                            'seat-vip': seat.seatType === 'VIP',
                        }"
                        @click="toggleSeat(seat)"
                    >
                        {{ seat.seatNumber }}
                    </div>
                </div>
            </div>

            <!-- Ghi chú -->
            <div class="d-flex justify-content-center gap-4 mb-4 text-secondary small">
                <div><span class="legend seat-regular"></span> Thường</div>
                <div><span class="legend seat-vip"></span> VIP</div>
                <div><span class="legend seat-selected"></span> Đang chọn</div>
                <div><span class="legend seat-booked"></span> Đã đặt</div>
            </div>

            <!-- Tổng tiền & Điểm -->
            <div class="text-center mt-4 mb-3">
                <p class="fw-bold fs-5">
                    Tổng: <span class="text-warning">{{ totalPrice.toLocaleString() }}</span> đ
                </p>
                <p class="small text-muted">
                    💎 Bạn sẽ nhận được <strong>{{ Math.floor(totalPrice / 20000) }}</strong> điểm tích lũy
                </p>
                <button
                    class="btn btn-warning btn-lg px-5 fw-bold"
                    :disabled="selectedSeats.length === 0"
                    @click="openPhoneModal"
                >
                    Xác nhận đặt vé
                </button>
            </div>
        </div>

        <!-- Nếu không tải được -->
        <div v-else class="text-center text-danger py-5">
            <p>Không thể tải dữ liệu ghế. Vui lòng thử lại sau.</p>
        </div>

        <!-- Modal nhập SĐT để tích điểm -->
        <div v-if="showPhoneModal" class="modal d-block" tabindex="-1" style="background: rgba(0, 0, 0, 0.5)">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-warning">
                        <h5 class="modal-title fw-bold">Thông tin thanh toán</h5>
                        <button type="button" class="btn-close" @click="closePhoneModal"></button>
                    </div>
                    <div class="modal-body">
                        <!-- Phần 1: SĐT tích điểm -->
                        <div class="mb-4">
                            <h6 class="fw-semibold mb-3">Thông tin tích điểm</h6>
                            <p class="text-muted small mb-2">Nhập số điện thoại để tích điểm vào tài khoản:</p>
                            <input
                                v-model="customerPhone"
                                type="tel"
                                class="form-control"
                                placeholder="Nhập hoặc bỏ qua"
                            />
                            <div class="alert alert-info small mt-2 mb-0">
                                <i class="bi bi-info-circle me-2"></i>
                                Nếu nhập SĐT, {{ Math.floor(totalPrice / 20000) }} điểm sẽ được cộng vào tài khoản
                            </div>
                        </div>

                        <hr />

                        <!-- Phần 2: Dùng điểm giảm giá -->
                        <div>
                            <h6 class="fw-semibold mb-3">Dùng điểm giảm giá</h6>
                            <p class="text-muted small mb-2">
                                Số điểm hiện có: <strong>{{ customerLoyaltyPoints }}</strong> điểm ({{
                                    (customerLoyaltyPoints * 1000).toLocaleString()
                                }}đ)
                            </p>

                            <div class="input-group mb-2">
                                <input
                                    v-model.number="pointsToUse"
                                    type="number"
                                    class="form-control"
                                    min="0"
                                    :max="Math.min(customerLoyaltyPoints, Math.floor(totalPrice / 1000))"
                                    placeholder="Nhập số điểm (1 điểm = 1.000đ)"
                                    @input="
                                        console.log(
                                            `[INPUT] pointsToUse: ${pointsToUse}, max: ${Math.min(
                                                customerLoyaltyPoints,
                                                Math.floor(totalPrice / 1000)
                                            )}`
                                        )
                                    "
                                />
                                <span class="input-group-text">điểm</span>
                            </div>

                            <div v-if="pointsToUse > 0" class="alert alert-success small mb-0">
                                <i class="bi bi-check-circle me-2"></i>
                                Giảm: {{ (pointsToUse * 1000).toLocaleString() }}đ
                                <br />
                                <strong
                                    >Tổng thanh toán: {{ (totalPrice - pointsToUse * 1000).toLocaleString() }}đ</strong
                                >
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="closePhoneModal">Hủy</button>
                        <button type="button" class="btn btn-warning fw-bold" @click="proceedToPayment">
                            Tiếp tục thanh toán
                        </button>
                    </div>
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
const pointsRedeemed = ref(0); // Điểm đã dùng thành công

const openPhoneModal = async () => {
    if (selectedSeats.value.length === 0) {
        alert("Vui lòng chọn ghế!");
        return;
    }

    // Load điểm hiện tại của khách
    try {
        const userId = auth.userId || localStorage.getItem("userId");
        if (userId) {
            const res = await api.get(`/auth/profile/${userId}`);
            customerLoyaltyPoints.value = res.data.loyaltyPoints || 0;
            console.log(`[DEBUG] Điểm hiện có: ${customerLoyaltyPoints.value}`);
            console.log(`[DEBUG] Tổng tiền: ${totalPrice.value}đ`);
            const maxPoints = Math.min(customerLoyaltyPoints.value, Math.floor(totalPrice.value / 1000));
            console.log(`[DEBUG] Max điểm có thể dùng: ${maxPoints}`);
        }
    } catch (err) {
        console.error("Lỗi khi lấy điểm:", err);
        customerLoyaltyPoints.value = 0;
    }

    pointsToUse.value = 0;
    pointsRedeemed.value = 0;
    showPhoneModal.value = true;
    alert(`Debug: Bạn có ${customerLoyaltyPoints.value} điểm. Tổng tiền: ${totalPrice.value}đ`);
};
const closePhoneModal = () => {
    showPhoneModal.value = false;
    customerPhone.value = "";
    // KHÔNG reset pointsToUse ở đây, nó sẽ được dùng trong confirmBooking()
};

const proceedToPayment = async () => {
    // Lưu pointsToUse trước khi đóng modal
    const pointsToUseTemp = pointsToUse.value;

    showPhoneModal.value = false;

    // Nếu nhập SĐT, cập nhật vào profile
    if (customerPhone.value.trim()) {
        try {
            const userId = auth.userId || localStorage.getItem("userId");
            if (userId) {
                await api.put(`/auth/profile/${userId}`, {
                    phone: customerPhone.value,
                });
            }
        } catch (err) {
            console.error("Lỗi khi cập nhật SĐT:", err);
        }
    }

    console.log(`[DEBUG] proceedToPayment - pointsToUse: ${pointsToUseTemp}`);

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
        seats.value = resSeats.data || [];
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

// Chọn / bỏ chọn ghế
const toggleSeat = (seat) => {
    if (seat.booked) return;

    const index = selectedSeats.value.indexOf(seat.seatId);
    if (index !== -1) selectedSeats.value.splice(index, 1);
    else selectedSeats.value.push(seat.seatId);
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
        // Tạo booking giữ ghế (PENDING)
        const res = await api.post(`/bookings`, {
            showtimeId,
            seatIds: selectedSeats.value,
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
            sessionStorage.setItem('pendingPointsRedeem', JSON.stringify({
                txnRef: txnRef,
                pointsToUse: pointsToUse.value
            }));
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
/* Màn hình */
.screen {
    font-size: 18px;
    letter-spacing: 1px;
    text-transform: uppercase;
}

/* Ghế */
.seat-grid {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.seat-row {
    gap: 10px;
}

.seat {
    width: 36px;
    height: 36px;
    line-height: 36px;
    border-radius: 6px;
    font-size: 14px;
    background: #444;
    color: #fff;
    cursor: pointer;
    transition: all 0.2s ease;
}

.seat:hover {
    transform: scale(1.05);
}

.seat-vip {
    background: #9c27b0;
}

.seat-selected {
    background: #ffc107;
    color: #000;
    font-weight: bold;
}

.seat-booked {
    background: #777;
    cursor: not-allowed;
    text-decoration: line-through;
}

/* Ghi chú */
.legend {
    display: inline-block;
    width: 20px;
    height: 20px;
    border-radius: 4px;
    margin-right: 5px;
    vertical-align: middle;
}

.seat-regular {
    background: #444;
}

.seat-vip {
    background: #9c27b0;
}

.seat-selected {
    background: #ffc107;
}

.seat-booked {
    background: #777;
}
</style>
