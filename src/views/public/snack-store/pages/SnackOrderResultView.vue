<template>
    <div class="result-page">
        <AppHeader />
        <div class="result-card">
            <div class="result-icon">{{ success ? "✓" : "!" }}</div>
            <h1>{{ success ? "Thanh toán đơn bắp nước thành công" : "Thanh toán chưa thành công" }}</h1>
            <p v-if="orderCode">Mã đơn: <strong>{{ orderCode }}</strong></p>
            <p>{{ message }}</p>
            <div class="result-actions">
                <router-link to="/snack-store" class="primary-link">Tiếp tục xem bắp nước</router-link>
            </div>
        </div>
    </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import AppHeader from "@/components/AppHeader.vue";
import api from "@/api";

const route = useRoute();
const success = ref(false);
const orderCode = ref("");
const message = ref("Đang xử lý kết quả thanh toán...");

onMounted(async () => {
    const responseCode = route.query.vnp_ResponseCode;
    const txnRef = route.query.vnp_TxnRef;
    orderCode.value = typeof txnRef === "string" ? txnRef : "";

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
        await api.post(`/snack-orders/pay-by-code/${txnRef}`);
        localStorage.removeItem("standaloneSnackCart");
        sessionStorage.removeItem("pendingSnackOrderCode");
        success.value = true;
        message.value = "Đơn bắp nước của bạn đã được ghi nhận thành công.";
    } catch (error) {
        success.value = false;
        message.value = error?.response?.data?.error || "Không thể xác nhận thanh toán đơn bắp nước.";
    }
});
</script>

<style scoped>
.result-page { min-height: 100vh; background: linear-gradient(135deg, #fff7f0, #f8f3ee); }
.result-card { max-width: 720px; margin: 60px auto; background: #fff; border: 1px solid #eadfd6; border-radius: 20px; box-shadow: 0 16px 32px rgba(40, 24, 16, 0.08); padding: 40px 28px; text-align: center; }
.result-icon { width: 72px; height: 72px; margin: 0 auto 18px; border-radius: 50%; background: #fff1ea; color: #ff6b35; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 800; }
.result-card h1 { margin: 0 0 12px; color: #2e2e2e; font-size: 2rem; }
.result-card p { color: #6f6159; font-size: 1.02rem; }
.primary-link { display: inline-block; margin-top: 18px; padding: 12px 18px; border-radius: 12px; background: #ff6b35; color: #fff; text-decoration: none; font-weight: 700; }
</style>
