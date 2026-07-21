<template>
    <div class="snack-store-page">
        <AppHeader />

        <div class="hero">
            <div class="container">
                <h1>Bắp nước và combo</h1>
                <p>Xem trước và đặt riêng bắp nước mà không cần chọn vé trước.</p>
            </div>
        </div>

        <div class="container store-layout">
            <section class="catalog">
                <div class="section-head">
                    <h2>Danh sách sản phẩm</h2>
                    <p v-if="!auth.isAuthenticated" class="guest-note">
                        Bạn có thể xem và chọn món trước. Đăng nhập ở bước thanh toán để hoàn tất đơn hàng.
                    </p>
                </div>

                <div v-if="loading" class="loading-box">Đang tải danh sách bắp nước...</div>
                <div v-else-if="snacks.length === 0" class="loading-box">Chưa có sản phẩm nào đang bán.</div>

                <div v-else class="snack-grid">
                    <article v-for="snack in snacks" :key="snack.snackId" class="snack-card">
                        <img :src="resolveSnackImage(snack.imageUrl)" :alt="snack.snackName" class="snack-image" />
                        <div class="snack-body">
                            <h3>{{ snack.snackName }}</h3>
                            <p>{{ snack.description || "Đang cập nhật mô tả sản phẩm." }}</p>
                            <div class="snack-footer">
                                <strong>{{ formatCurrency(snack.price) }}</strong>
                                <div class="qty-controls">
                                    <button @click="decrease(snack)">-</button>
                                    <span>{{ getQuantity(snack.snackId) }}</span>
                                    <button @click="increase(snack)">+</button>
                                </div>
                            </div>
                        </div>
                    </article>
                </div>
            </section>

            <aside class="cart-panel">
                <h2>Giỏ bắp nước</h2>
                <div v-if="cartItems.length === 0" class="empty-cart">Bạn chưa chọn món nào.</div>
                <div v-else class="cart-list">
                    <div v-for="item in cartItems" :key="item.snackId" class="cart-item">
                        <div>
                            <div class="cart-name">{{ item.snackName }}</div>
                            <div class="cart-meta">{{ item.quantity }} x {{ formatCurrency(item.price) }}</div>
                        </div>
                        <strong>{{ formatCurrency(item.quantity * item.price) }}</strong>
                    </div>
                </div>

                <div class="cart-total">
                    <span>Tổng cộng</span>
                    <strong>{{ formatCurrency(cartTotal) }}</strong>
                </div>

                <button class="checkout-btn" :disabled="cartItems.length === 0" @click="goToCheckout">
                    Tiếp tục thanh toán
                </button>
            </aside>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import AppHeader from "@/components/AppHeader.vue";
import api from "@/api";
import { useAuthStore } from "@/stores/auth.store";
import { loadStandaloneSnackCart, saveStandaloneSnackCart } from "@/utils/standaloneSnackCart";

const router = useRouter();
const auth = useAuthStore();

const loading = ref(true);
const snacks = ref([]);
const cart = ref(loadStandaloneSnackCart());

function saveCart() {
    saveStandaloneSnackCart(cart.value);
}

function resolveSnackImage(imageUrl) {
    if (!imageUrl) return "https://via.placeholder.com/300x220?text=Snack";
    if (/^https?:\/\//i.test(imageUrl) || imageUrl.startsWith("data:")) return imageUrl;
    const apiBaseUrl = api.defaults.baseURL || "";
    const origin = apiBaseUrl.replace(/\/api\/?$/, "");
    return `${origin}${imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}`;
}

const cartItems = computed(() => cart.value);
const cartTotal = computed(() => cart.value.reduce((sum, item) => sum + item.price * item.quantity, 0));

function getQuantity(snackId) {
    return cart.value.find((item) => item.snackId === snackId)?.quantity || 0;
}

function increase(snack) {
    const existing = cart.value.find((item) => item.snackId === snack.snackId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.value.push({
            snackId: snack.snackId,
            snackName: snack.snackName,
            imageUrl: snack.imageUrl,
            price: snack.price,
            quantity: 1,
        });
    }
    saveCart();
}

function decrease(snack) {
    const index = cart.value.findIndex((item) => item.snackId === snack.snackId);
    if (index === -1) return;
    if (cart.value[index].quantity <= 1) {
        cart.value.splice(index, 1);
    } else {
        cart.value[index].quantity -= 1;
    }
    saveCart();
}

function goToCheckout() {
    cart.value = loadStandaloneSnackCart();
    if (cart.value.length === 0) return;

    if (!auth.isAuthenticated) {
        router.push({
            path: "/login",
            query: {
                redirect: "/snack-store/payment",
            },
        });
        return;
    }
    router.push("/snack-store/payment");
}

function formatCurrency(amount) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(amount || 0);
}

onMounted(async () => {
    try {
        const { data } = await api.get("/snacks");
        snacks.value = Array.isArray(data) ? data : [];
    } finally {
        loading.value = false;
    }
});
</script>

<style scoped>
.snack-store-page { background: #f6f3ef; min-height: 100vh; }
.hero { padding: 40px 0 24px; background: linear-gradient(135deg, #fff7f0, #ffe2d0); border-bottom: 1px solid #f1d6c8; }
.hero h1 { margin: 0 0 8px; color: #2c2c2c; font-size: 2.3rem; font-weight: 800; }
.hero p { margin: 0; color: #6a5b52; }
.container { max-width: 1280px; margin: 0 auto; padding: 0 20px; }
.store-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; padding: 28px 20px 48px; }
.catalog, .cart-panel { background: #fff; border: 1px solid #eadfd6; border-radius: 18px; box-shadow: 0 12px 24px rgba(40, 24, 16, 0.06); }
.catalog { padding: 22px; }
.cart-panel { padding: 22px; position: sticky; top: 96px; height: fit-content; }
.section-head h2, .cart-panel h2 { margin: 0 0 8px; color: #2f2f2f; font-size: 1.35rem; font-weight: 800; }
.guest-note { margin: 0 0 8px; color: #9a5f2d; background: #fff3e7; border: 1px solid #ffd9b8; padding: 10px 12px; border-radius: 12px; }
.loading-box, .empty-cart { padding: 20px; color: #7a6a62; background: #faf6f2; border-radius: 14px; }
.snack-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
.snack-card { overflow: hidden; border: 1px solid #eee2d9; border-radius: 16px; background: #fffdfb; }
.snack-image { width: 100%; height: 220px; object-fit: cover; display: block; }
.snack-body { padding: 16px; }
.snack-body h3 { margin: 0 0 8px; font-size: 1.1rem; color: #2f2f2f; }
.snack-body p { margin: 0 0 16px; color: #6f625a; min-height: 40px; }
.snack-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.snack-footer strong { color: #ff6b35; font-size: 1.05rem; }
.qty-controls { display: flex; align-items: center; gap: 10px; }
.qty-controls button { width: 34px; height: 34px; border: 1px solid #ffb08d; background: #fff4ee; color: #ff6b35; border-radius: 10px; font-weight: 700; }
.cart-list { display: grid; gap: 12px; }
.cart-item { display: flex; justify-content: space-between; gap: 12px; padding: 12px 0; border-bottom: 1px solid #f2e8e0; }
.cart-name { font-weight: 700; color: #2e2e2e; }
.cart-meta { color: #7b6b62; font-size: 0.92rem; margin-top: 4px; }
.cart-total { display: flex; justify-content: space-between; align-items: center; padding: 18px 0; font-size: 1.05rem; }
.cart-total strong { color: #ff6b35; font-size: 1.15rem; }
.checkout-btn { width: 100%; border: none; border-radius: 12px; background: #ff6b35; color: #fff; padding: 14px 16px; font-weight: 700; }
.checkout-btn:disabled { opacity: 0.5; cursor: not-allowed; }
@media (max-width: 960px) {
  .store-layout { grid-template-columns: 1fr; }
  .cart-panel { position: static; }
}
@media (max-width: 640px) {
  .snack-grid { grid-template-columns: 1fr; }
}
</style>
