<template>
    <div class="result-page">
        <AppHeader />
        <div class="result-card">
            <div class="result-icon">{{ success ? "✓" : "!" }}</div>
            <h1>{{ success ? "Thanh toán đơn bắp nước thành công" : "Thanh toán chưa thành công" }}</h1>
            <div v-if="success && orderCode" class="pickup-code">
                <span>Mã nhận bắp nước</span>
                <strong>{{ orderCode }}</strong>
            </div>
            <p v-else-if="orderCode">Mã đơn: <strong>{{ orderCode }}</strong></p>
            <p>{{ message }}</p>
            <div class="result-actions">
                <router-link v-if="success" to="/my-bookings?tab=snacks" class="primary-link">Xem đơn bắp nước</router-link>
                <router-link to="/snack-store" class="secondary-link">Tiếp tục xem bắp nước</router-link>
            </div>
        </div>
    </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import AppHeader from "@/components/AppHeader.vue";
import api from "@/api";
import { clearStandaloneSnackCart } from "@/utils/standaloneSnackCart";

const route = useRoute();
const success = ref(false);
const orderCode = ref("");
const message = ref("Đang xử lý kết quả thanh toán...");

onMounted(async () => {
    const responseCode = route.query.vnp_ResponseCode;
    const txnRef = route.query.vnp_TxnRef;
    orderCode.value = typeof txnRef === "string" ? txnRef : "";

    sessionStorage.removeItem("pendingSnackOrderCode");
    sessionStorage.removeItem("pendingSnackOrderCreatedAt");

    if (!txnRef) {
        success.value = false;
        message.value = "Không tìm thấy mã đơn bắp nước.";
        return;
    }

    if (responseCode !== "00") {
        success.value = false;
        message.value = "Giao dịch chưa hoàn tất hoặc đã bị hủy.";
        return;
    }

    try {
        await api.post("/payments/confirm-vnpay", {
            txnRef,
            responseCode,
            flow: route.query.flow || "snack-order",
            paymentToken: route.query.paymentToken,
        });
        clearStandaloneSnackCart();
        success.value = true;
        message.value = "Đơn bắp nước của bạn đã được ghi nhận thành công.";
    } catch (error) {
        success.value = false;
        message.value = error?.response?.data?.error || "Không thể xác nhận thanh toán đơn bắp nước.";
    }
});
</script>

<style scoped>
.result-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #fff7f0, #f8f3ee);
}

.result-card {
    max-width: 720px;
    margin: 60px auto;
    padding: 40px 28px;
    border: 1px solid #eadfd6;
    border-radius: 20px;
    background: #fff;
    box-shadow: 0 16px 32px rgba(40, 24, 16, 0.08);
    text-align: center;
}

.result-icon {
    width: 72px;
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 18px;
    border-radius: 50%;
    background: #fff1ea;
    color: #ff6b35;
    font-size: 2rem;
    font-weight: 800;
}

.result-card h1 {
    margin: 0 0 12px;
    color: #2e2e2e;
    font-size: 2rem;
}

.result-card p {
    color: #6f6159;
    font-size: 1.02rem;
}

.pickup-code {
    display: grid;
    gap: 8px;
    margin: 18px auto;
    max-width: 360px;
    padding: 16px;
    border: 1px dashed #ff9a6d;
    border-radius: 14px;
    background: #fff7f0;
}

.pickup-code span {
    color: #8a5d47;
    font-weight: 700;
}

.pickup-code strong {
    color: #ff6b35;
    font-size: 1.7rem;
    letter-spacing: 0;
}

.result-actions {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 12px;
}

.primary-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-top: 18px;
    padding: 12px 18px;
    border-radius: 12px;
    background: #ff6b35;
    color: #fff;
    font-weight: 700;
    text-decoration: none;
}

.secondary-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-top: 18px;
    padding: 12px 18px;
    border: 1px solid #ffb08d;
    border-radius: 12px;
    background: #fff;
    color: #ff6b35;
    font-weight: 700;
    text-decoration: none;
}
</style>
