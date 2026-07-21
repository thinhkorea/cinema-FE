<template>
    <div class="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
        <div class="text-muted mt-3">Đang xử lý giao dịch, vui lòng chờ...</div>
    </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "@/api";
import { showCinemaAlert } from "@/utils/cinemaAlert";

const route = useRoute();
const router = useRouter();
const success = ref(false);
const txnRef = ref(null);

onMounted(async () => {
    const responseCode = route.query.vnp_ResponseCode?.toString();
    txnRef.value = route.query.vnp_TxnRef || localStorage.getItem("txnRef");

    if (responseCode === "00" && txnRef.value) {
        try {
            await api.post("/payments/confirm-vnpay", {
                txnRef: txnRef.value,
                responseCode,
                flow: route.query.flow || "booking",
                paymentToken: route.query.paymentToken,
            });
            success.value = true;
        } catch {
            success.value = false;
        }
    }

    if (success.value) {
        localStorage.removeItem("txnRef");
    }

    showCinemaAlert({
        icon: success.value ? "success" : "error",
        title: success.value ? "Thanh toán thành công!" : "Thanh toán thất bại!",
        text: success.value ? `Mã giao dịch: ${txnRef.value}` : "Giao dịch không hợp lệ hoặc đã bị hủy.",
        timer: 2000,
    }).then(() => {
        router.push("/staff/sold-tickets");
    });
});
</script>

<style scoped>
.vh-100 {
    height: 100vh;
}
</style>
