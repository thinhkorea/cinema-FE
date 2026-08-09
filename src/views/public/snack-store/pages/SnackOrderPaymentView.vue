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

                <label class="pickup-block">
                    <span>Ngày nhận bắp nước</span>
                    <input v-model="pickupDate" type="date" :min="minPickupDate" :max="maxPickupDate" />
                    <small>Chỉ có thể chọn từ hôm nay đến 6 ngày tới.</small>
                </label>

                <div class="voucher-section" :class="{ disabled: !auth.isAuthenticated }">
                    <h2>Voucher giảm giá</h2>
                    <div class="voucher-box">
                        <input
                            v-model.trim="voucherCode"
                            type="text"
                            placeholder="Nhập mã voucher"
                            :disabled="voucherApplying || !auth.isAuthenticated"
                        />
                        <button
                            type="button"
                            :disabled="voucherApplying || !auth.isAuthenticated"
                            @click="applyVoucher()"
                        >
                            {{ voucherApplying ? "Đang áp dụng..." : "Áp dụng" }}
                        </button>
                    </div>

                    <div v-if="availableVouchers.length" class="voucher-list">
                        <button
                            v-for="voucher in availableVouchers"
                            :key="voucher.code"
                            type="button"
                            class="voucher-pill"
                            :class="{ selected: voucherApplied?.code === voucher.code }"
                            :disabled="voucherApplying || !auth.isAuthenticated"
                            @click="applyVoucher(voucher.code)"
                        >
                            <strong>{{ voucher.name || "Voucher phù hợp" }}</strong>
                            <span>Giảm {{ formatCurrency(voucher.discountAmount) }}</span>
                        </button>
                    </div>
                    <p v-else class="voucher-empty">Không có voucher phù hợp với đơn bắp nước này.</p>
                    <p v-if="voucherMessage" class="voucher-message" :class="voucherMessageTone">{{ voucherMessage }}</p>
                </div>
            </section>

            <aside class="checkout-side">
                <div class="summary-card">
                    <h2>Tóm tắt đơn hàng</h2>
                    <div class="summary-row">
                        <span>Tổng số món</span>
                        <strong>{{ totalQuantity }}</strong>
                    </div>
                    <div class="summary-row">
                        <span>Ngày nhận</span>
                        <strong>{{ formatDisplayDate(pickupDate) }}</strong>
                    </div>
                    <div class="summary-row">
                        <span>Tạm tính</span>
                        <strong>{{ formatCurrency(subtotalAmount) }}</strong>
                    </div>
                    <div v-if="voucherDiscount > 0" class="summary-row discount-row">
                        <span>Giảm voucher</span>
                        <strong>-{{ formatCurrency(voucherDiscount) }}</strong>
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
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";
import AppHeader from "@/components/AppHeader.vue";
import api from "@/api";
import { showCinemaAlert, getApiErrorMessage } from "@/utils/cinemaAlert";
import { loadStandaloneSnackCart } from "@/utils/standaloneSnackCart";

const router = useRouter();
const auth = useAuthStore();
const processing = ref(false);
const voucherCode = ref("");
const voucherApplying = ref(false);
const voucherApplied = ref(null);
const voucherDiscount = ref(0);
const availableVouchers = ref([]);
const voucherMessage = ref("");
const voucherMessageTone = ref("");

const cartItems = ref(loadStandaloneSnackCart());
const minPickupDate = toDateInputValue(new Date());
const maxPickupDate = toDateInputValue(addDays(new Date(), 6));
const pickupDate = ref(minPickupDate);

const totalQuantity = computed(() => cartItems.value.reduce((sum, item) => sum + item.quantity, 0));
const subtotalAmount = computed(() => cartItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0));
const totalAmount = computed(() => Math.max(0, subtotalAmount.value - voucherDiscount.value));

if (cartItems.value.length === 0) {
    router.replace("/snack-store");
}

onMounted(() => {
    fetchAvailableVouchers();
});

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

function addDays(date, days) {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate;
}

function toDateInputValue(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatDisplayDate(value) {
    if (!value) return "Chưa chọn";
    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(new Date(`${value}T00:00:00`));
}

function isPickupDateValid() {
    return pickupDate.value >= minPickupDate && pickupDate.value <= maxPickupDate;
}

function goBack() {
    router.push("/snack-store");
}

async function applyVoucher(code) {
    if (!auth.isAuthenticated) {
        voucherMessage.value = "Vui lòng đăng nhập để áp dụng voucher.";
        voucherMessageTone.value = "error";
        return;
    }
    if (code) {
        if (voucherApplied.value?.code === code) {
            clearVoucher();
            return;
        }
    }
    const codeToValidate = code || voucherCode.value;
    if (!codeToValidate) {
        voucherMessage.value = "Vui lòng nhập mã voucher.";
        voucherMessageTone.value = "error";
        return;
    }

    try {
        voucherApplying.value = true;
        const { data } = await api.post("/vouchers/validate", {
            code: codeToValidate,
            totalAmount: subtotalAmount.value,
        });
        voucherApplied.value = data;
        voucherDiscount.value = data.discountAmount || 0;
        voucherCode.value = "";
        voucherMessage.value = "";
        voucherMessageTone.value = "";
    } catch (err) {
        voucherMessage.value = getApiErrorMessage(err, "Voucher không hợp lệ hoặc chưa đủ điều kiện áp dụng.");
        voucherMessageTone.value = "error";
    } finally {
        voucherApplying.value = false;
    }
}

async function fetchAvailableVouchers() {
    if (!auth.isAuthenticated || subtotalAmount.value <= 0) {
        availableVouchers.value = [];
        return;
    }
    try {
        const { data } = await api.get("/vouchers/available", {
            params: { totalAmount: subtotalAmount.value },
        });
        availableVouchers.value = Array.isArray(data) ? data : [];
    } catch {
        availableVouchers.value = [];
    }
}

function clearVoucher() {
    voucherApplied.value = null;
    voucherDiscount.value = 0;
    voucherCode.value = "";
    voucherMessage.value = "";
    voucherMessageTone.value = "";
    sessionStorage.removeItem("pendingVoucher");
}

async function confirmPayment() {
    if (cartItems.value.length === 0 || processing.value) return;
    if (!isPickupDateValid()) {
        await showCinemaAlert({
            icon: "warning",
            title: "Ngày nhận không hợp lệ",
            text: "Vui lòng chọn ngày nhận trong 7 ngày tới.",
        });
        return;
    }

    try {
        processing.value = true;
        cartItems.value = loadStandaloneSnackCart();
        if (cartItems.value.length === 0) {
            processing.value = false;
            router.replace("/snack-store");
            return;
        }

        const orderPayload = {
            items: cartItems.value.map((item) => ({
                snackId: item.snackId,
                quantity: item.quantity,
            })),
            pickupDate: pickupDate.value,
        };

        const { data: order } = await api.post("/snack-orders", orderPayload);
        sessionStorage.setItem("pendingSnackOrderCode", order.orderCode);
        sessionStorage.setItem("pendingSnackOrderCreatedAt", String(Date.now()));
        if (voucherApplied.value?.code) {
            sessionStorage.setItem(
                "pendingVoucher",
                JSON.stringify({
                    code: voucherApplied.value.code,
                    totalAmount: subtotalAmount.value,
                    discountAmount: voucherDiscount.value,
                    flow: "snack-order",
                }),
            );
        } else {
            sessionStorage.removeItem("pendingVoucher");
        }

        const { data: payment } = await api.post("/payments/create-payment", {
            txnRef: order.orderCode,
            amount: totalAmount.value,
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
.pickup-block { display: block; margin-top: 16px; }
.pickup-block span { display: block; margin-bottom: 8px; font-weight: 700; color: #3a332f; }
.pickup-block input { width: 100%; border: 1px solid #ddcfc6; border-radius: 12px; padding: 12px; color: #3a332f; }
.pickup-block small { display: block; margin-top: 8px; color: #8b7061; }
.voucher-section { margin-top: 18px; border: 1px solid #f0e0d7; border-radius: 14px; background: #fffaf7; padding: 16px; }
.voucher-section.disabled { opacity: 0.68; }
.voucher-section h2 { margin: 0 0 12px; color: #2d2d2d; font-size: 1.05rem; }
.voucher-box { display: grid; grid-template-columns: 1fr auto; gap: 10px; }
.voucher-box input { min-width: 0; border: 1px solid #ddcfc6; border-radius: 12px; padding: 12px; color: #3a332f; text-transform: uppercase; }
.voucher-box button { border: none; border-radius: 10px; background: #ff6b35; color: #fff; padding: 0 14px; font-weight: 800; }
.voucher-box button:disabled { background: #d9d2ce; cursor: not-allowed; }
.voucher-list { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 12px; }
.voucher-pill { border: 1px solid #ffd2c4; border-radius: 12px; background: #fff; color: #5b4b43; padding: 10px 12px; text-align: left; }
.voucher-pill.selected { border-color: #ff6b35; background: #fff0e9; box-shadow: 0 8px 18px rgba(255, 107, 53, 0.12); }
.voucher-pill strong { display: block; color: #ff6b35; }
.voucher-pill span { color: #6f6159; font-size: 0.88rem; }
.voucher-empty,
.voucher-message { margin: 10px 0 0; font-weight: 700; }
.voucher-empty { color: #8b7061; }
.voucher-message.error { color: #c94c28; }
.summary-card { padding: 22px; position: sticky; top: 96px; height: fit-content; }
.summary-card h2 { margin: 0 0 18px; color: #2d2d2d; }
.summary-row { display: flex; justify-content: space-between; padding: 10px 0; color: #6a5e56; }
.summary-row.discount-row { color: #198754; }
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
  .voucher-box { grid-template-columns: 1fr; }
  .voucher-box button { min-height: 44px; }
}
</style>
