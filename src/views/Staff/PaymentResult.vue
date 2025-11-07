<template>
  <div class="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
    <div class="text-muted mt-3">Đang xử lý giao dịch, vui lòng chờ...</div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "@/api";
import Swal from "sweetalert2";

const route = useRoute();
const router = useRouter();
const success = ref(false);
const txnRef = ref(null);

onMounted(async () => {
  const responseCode = route.query.vnp_ResponseCode?.toString();
  txnRef.value = route.query.vnp_TxnRef || localStorage.getItem("txnRef");

  console.log("VNPay Response Code:", responseCode);
  console.log("VNPay TxnRef:", txnRef.value);

  if (responseCode === "00" && txnRef.value) {
    try {
      await api.post(`/bookings/pay-by-txn/${txnRef.value}`);
      success.value = true;
      console.log("Cập nhật thanh toán thành công!");
      localStorage.removeItem("txnRef");
    } catch (err) {
      console.error("Lỗi khi cập nhật thanh toán:", err);
      success.value = false;
    }
  } else {
    success.value = false;
  }

  // Hiển thị popup đẹp SweetAlert
  Swal.fire({
    icon: success.value ? "success" : "error",
    title: success.value ? "Thanh toán thành công!" : "Thanh toán thất bại!",
    text: success.value
      ? `Mã giao dịch: ${txnRef.value}`
      : "Giao dịch không hợp lệ hoặc đã bị hủy.",
    timer: 2000,
    timerProgressBar: true,
    showConfirmButton: false,
    background: "#fff",
    color: "#333",
    didOpen: () => {
      Swal.showLoading();
    },
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
