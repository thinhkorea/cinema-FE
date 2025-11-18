<template>
    <div class="container text-center py-5">
        <AppHeader />
        <h2 class="fw-bold mb-4">Kết quả thanh toán</h2>

        <!-- Thành công -->
        <div v-if="isSuccess" class="alert alert-success" role="alert">
            <h4 class="alert-heading">Thanh toán thành công!</h4>
            <p>Cảm ơn bạn đã đặt vé. Vé của bạn đã được xác nhận.</p>
            <p v-if="bookingCount > 1" class="mt-2">
                Bạn đã đặt <strong>{{ bookingCount }}</strong> vé trong giao dịch này.
            </p>
            <hr />
            <p class="mb-0">
                Mã giao dịch của bạn là: <strong>{{ txnRef }}</strong>
            </p>
        </div>

        <!-- Thất bại -->
        <div v-else class="alert alert-danger" role="alert">
            <h4 class="alert-heading">Thanh toán thất bại!</h4>
            <p>Đã có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.</p>
            <hr />
            <p class="mb-0">
                Mã lỗi từ VNPay:
                <strong>{{ route.query.vnp_ResponseCode || "Không xác định" }}</strong>
            </p>
        </div>

        <!-- Nút điều hướng -->
        <div class="mt-4">
            <button class="btn btn-primary" @click="goHome">Về trang chủ</button>
            <button v-if="isSuccess" class="btn btn-outline-secondary ms-2" @click="goToMyBookings">
                Xem vé của tôi
            </button>
        </div>
    </div>
</template>

<script setup>
import AppHeader from "@/components/AppHeader.vue";
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "@/api";

const route = useRoute();
const router = useRouter();

const isSuccess = route.query.vnp_ResponseCode === "00";
const txnRef = route.query.vnp_TxnRef;
const bookingCount = ref(0);
const firstBookingId = ref(null);

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
                    
                    sessionStorage.removeItem('pendingPointsRedeem');
                    localStorage.removeItem('pendingPointsRedeem');
                } catch (err) {
                    console.error('Lỗi khi redeem points:', err);
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

            // Chuyển hướng sau 3 giây
            setTimeout(() => {
                if (txnRef) {
                    console.log(`Chuyển đến trang chi tiết giao dịch /my-bookings/txn/${txnRef}`);
                    router.push(`/my-bookings/txn/${txnRef}`);
                } else {
                    console.warn("Không tìm thấy mã giao dịch (txnRef), quay lại trang chủ.");
                    router.push("/");
                }
            }, 3000);
        }
    } catch (error) {
        console.error("Thanh toán thất bại:", error);
        setTimeout(() => router.push("/"), 3000);
    }
});

const goHome = () => router.push("/");
const goToMyBookings = () => {
    if (txnRef) router.push(`/my-bookings/txn/${txnRef}`);
    else router.push("/");
};
</script>

<style scoped>
.alert {
    border-radius: 12px;
    padding: 1.5rem;
    font-size: 1.1rem;
}

.btn {
    min-width: 150px;
    font-size: 1rem;
}

.btn-outline-secondary {
    transition: all 0.3s ease;
}

.btn-outline-secondary:hover {
    background-color: #6c757d;
    color: #fff;
}
</style>
