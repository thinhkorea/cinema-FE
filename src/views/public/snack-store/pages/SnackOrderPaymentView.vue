<template>
    <div class="snack-checkout-page">
        <AppHeader />
        <div class="container checkout-layout">
            <section class="checkout-main">
                <h1>Thanh toán đơn bắp nước</h1>
                <p class="checkout-desc">Xác nhận lại các món đã chọn trước khi chuyển sang VNPay.</p>

                <div class="item-list">
                    <article v-for="item in cartItems" :key="item.snackId" class="checkout-item">
                        <img :src="resolveSnackImage(item.imageUrl)" :alt="item.snackName" />
                        <div class="item-info">
                            <h3>{{ item.snackName }}</h3>
                            <p>{{ item.quantity }} x {{ formatCurrency(item.price) }}</p>
                        </div>
                        <strong>{{ formatCurrency(item.quantity * item.price) }}</strong>
                    </article>
                </div>

                <label class="note-block">
                    <span>Ghi chú cho đơn hàng</span>
                    <textarea v-model.trim="note" rows="3" placeholder="Ví dụ: ít đá, nhận sau 19:00..."></textarea>
                </label>
            </section>

            <aside class="checkout-side">
                <div class="summary-card">
                    <h2>Tóm tắt đơn hàng</h2>
                    <div class="summary-row">
                        <span>Tổng số món</span>
                        <strong>{{ totalQuantity }}</strong>
                    </div>
                    <div class="summary-row total">
                        <span>Tổng thanh toán</span>
                        <strong>{{ formatCurrency(totalAmount) }}</strong>
                    </div>
                    <button class="pay-btn" :disabled="processing || cartItems.length === 0" @click="confirmPayment">
                        {{ processing ? "Đang xử lý..." : "Thanh toán qua VNPay" }}
                    </button>
                    <button class="back-btn" @click="goBack">Quay lại chọn món</button>
                </div>
            </aside>
        </div>
    </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import AppHeader from "@/components/AppHeader.vue";
import api from "@/api";
import { showCinemaAlert, getApiErrorMessage } from "@/utils/cinemaAlert";

const router = useRouter();
const note = ref("");
const processing = ref(false);

const cartItems = ref(loadCart());

function loadCart() {
    try {
        const raw = localStorage.getItem("standaloneSnackCart");
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

const totalQuantity = computed(() => cartItems.value.reduce((sum, item) => sum + item.quantity, 0));
const totalAmount = computed(() => cartItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0));

if (cartItems.value.length === 0) {
    router.replace("/snack-store");
}

function resolveSnackImage(imageUrl) {
    if (!imageUrl) return "https://via.placeholder.com/200x140?text=Snack";
    if (/^https?:\/\//i.test(imageUrl) || imageUrl.startsWith("data:")) return imageUrl;
    const apiBaseUrl = api.defaults.baseURL || "";
    const origin = apiBaseUrl.replace(/\/api\/?$/, "");
    return `${origin}${imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}`;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(amount || 0);
}

function goBack() {
    router.push("/snack-store");
}

async function confirmPayment() {
    if (cartItems.value.length === 0 || processing.value) return;

    try {
        processing.value = true;
        const orderPayload = {
            items: cartItems.value.map((item) => ({
                snackId: item.snackId,
                quantity: item.quantity,
            })),
            note: note.value,
        };

        const { data: order } = await api.post("/snack-orders", orderPayload);
        sessionStorage.setItem("pendingSnackOrderCode", order.orderCode);

        const { data: payment } = await api.post("/payments/create-payment", {
            txnRef: order.orderCode,
            amount: order.totalAmount,
            orderDescription: `Thanh toan don bap nuoc ${order.orderCode}`,
            role: "customer",
            flow: "snack-order",
        });

        window.location.href = payment.paymentUrl;
    } catch (error) {
        await showCinemaAlert({
            icon: "error",
            title: "Không thể tạo đơn bắp nước",
            text: getApiErrorMessage(error, "Vui lòng thử lại sau ít phút."),
        });
        processing.value = false;
    }
}
</script>

<style scoped>
.snack-checkout-page { min-height: 100vh; background: #f6f3ef; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
.checkout-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; padding: 32px 20px 48px; }
.checkout-main, .summary-card { background: #fff; border: 1px solid #eadfd6; border-radius: 18px; box-shadow: 0 12px 24px rgba(40, 24, 16, 0.06); }
.checkout-main { padding: 24px; }
.checkout-main h1 { margin: 0 0 8px; font-size: 2rem; color: #2d2d2d; }
.checkout-desc { margin: 0 0 20px; color: #76675f; }
.item-list { display: grid; gap: 14px; }
.checkout-item { display: grid; grid-template-columns: 100px 1fr auto; gap: 16px; align-items: center; border: 1px solid #f0e6de; background: #fffdfa; border-radius: 14px; padding: 12px; }
.checkout-item img { width: 100px; height: 76px; object-fit: cover; border-radius: 10px; }
.item-info h3 { margin: 0 0 6px; color: #2d2d2d; }
.item-info p { margin: 0; color: #74655d; }
.note-block { display: block; margin-top: 20px; }
.note-block span { display: block; margin-bottom: 8px; font-weight: 700; color: #3a332f; }
.note-block textarea { width: 100%; border: 1px solid #ddcfc6; border-radius: 12px; padding: 12px; resize: vertical; min-height: 96px; }
.summary-card { padding: 22px; position: sticky; top: 96px; height: fit-content; }
.summary-card h2 { margin: 0 0 18px; color: #2d2d2d; }
.summary-row { display: flex; justify-content: space-between; padding: 10px 0; color: #6a5e56; }
.summary-row.total { border-top: 1px solid #efe5de; margin-top: 8px; padding-top: 16px; }
.summary-row.total strong { color: #ff6b35; font-size: 1.2rem; }
.pay-btn, .back-btn { width: 100%; border: none; border-radius: 12px; padding: 14px; font-weight: 700; margin-top: 12px; }
.pay-btn { background: #ff6b35; color: #fff; }
.back-btn { background: #fff4ee; color: #ff6b35; border: 1px solid #ffb896; }
@media (max-width: 960px) {
  .checkout-layout { grid-template-columns: 1fr; }
  .summary-card { position: static; }
}
@media (max-width: 640px) {
  .checkout-item { grid-template-columns: 1fr; }
  .checkout-item img { width: 100%; height: 180px; }
}
</style>
