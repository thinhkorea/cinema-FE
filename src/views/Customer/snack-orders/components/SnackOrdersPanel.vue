<template>
    <section class="snack-orders-panel">
        <div v-if="loading" class="state-box">Đang tải đơn bắp nước...</div>
        <div v-else-if="errorMessage" class="state-box error-box">{{ errorMessage }}</div>
        <div v-else-if="visibleStandalonePaidOrders.length === 0" class="state-box">
            Bạn chưa có đơn bắp nước đã thanh toán.
        </div>

        <div v-else class="orders-list">
            <article
                v-for="order in visibleStandalonePaidOrders"
                :key="order.snackOrderId || order.orderCode"
                class="order-card"
                :class="{ pending: isPickupPending(order), expired: isPickupExpired(order) }"
            >
                <div class="order-top">
                    <div class="order-code-block">
                        <span>{{ orderCodeLabel(order) }}</span>
                        <strong>{{ order.orderCode }}</strong>
                    </div>
                    <button
                        class="copy-btn"
                        type="button"
                        :disabled="!canRedeemOrder(order)"
                        @click="copyOrderCode(order)"
                    >
                        <i class="bi bi-clipboard"></i>
                        {{ copyButtonLabel(order) }}
                    </button>
                </div>

                <div class="order-summary">
                    <div>
                        <span>Trạng thái</span>
                        <strong
                            class="status-chip"
                            :class="{ pending: isPickupPending(order), expired: isPickupExpired(order) }"
                        >
                            {{ pickupStatusLabel(order) }}
                        </strong>
                    </div>
                    <div>
                        <span>Thanh toán</span>
                        <strong>{{ order.paymentMethod || "VNPAY" }}</strong>
                    </div>
                    <div>
                        <span>Thanh toán lúc</span>
                        <strong>{{ formatDateTime(order.paidAt || order.createdAt) }}</strong>
                    </div>
                    <div>
                        <span>Ngày nhận</span>
                        <strong>{{ formatPickupDate(order.pickupDate) }}</strong>
                    </div>
                    <div>
                        <span>Hạn nhận</span>
                        <strong>{{ formatDateTime(order.pickupExpiresAt || fallbackPickupExpiresAt(order)) }}</strong>
                    </div>
                    <div>
                        <span>Tổng tiền</span>
                        <strong class="total-amount">{{ formatCurrency(order.totalAmount) }}</strong>
                    </div>
                    <div v-if="Number(order.voucherDiscount || 0) > 0">
                        <span>Voucher</span>
                        <strong class="discount-amount">-{{ formatCurrency(order.voucherDiscount) }}</strong>
                    </div>
                </div>

                <div class="order-body-row">
                    <div class="order-qr-panel" :class="{ muted: !canRedeemOrder(order) }">
                        <div class="qr-frame">
                            <QrcodeVue :value="snackOrderQrPayload(order)" :size="126" level="M" />
                        </div>
                        <div class="qr-copy">
                            <span>Mã QR nhận bắp nước</span>
                            <strong>{{ qrStatusLabel(order) }}</strong>
                            <p>Đưa mã này cho nhân viên quầy để quét và kiểm tra đơn.</p>
                        </div>
                    </div>

                    <div class="items-list">
                        <div
                            v-for="item in order.items || []"
                            :key="`${order.orderCode}-${item.snackId}`"
                            class="snack-line"
                        >
                            <img :src="resolveSnackImage(item.imageUrl)" :alt="item.snackName" />
                            <div class="snack-info">
                                <strong>{{ item.snackName }}</strong>
                                <span>{{ item.quantity }} x {{ formatCurrency(item.priceAtPurchase) }}</span>
                            </div>
                            <strong>{{ formatCurrency(item.subtotal) }}</strong>
                        </div>
                    </div>
                </div>

                <p v-if="copiedCode === order.orderCode" class="copy-note">Đã sao chép mã đơn.</p>
                <p v-else-if="isOrderFulfilled(order)" class="fulfilled-note">
                    Đơn này đã được nhân viên xác nhận giao bắp nước.
                </p>
                <p v-else-if="isPickupPending(order)" class="pending-note">
                    Đơn này sẽ dùng được vào đúng ngày nhận đã chọn.
                </p>
                <p v-else-if="isPickupExpired(order)" class="expired-note">
                    Đơn này đã quá hạn nhận bắp nước, nhân viên sẽ không dùng mã này để giao món.
                </p>
            </article>
        </div>
    </section>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import QrcodeVue from "qrcode.vue";
import api from "@/api";
import { resolveMediaUrl } from "@/utils/mediaUrl";

const loading = ref(true);
const errorMessage = ref("");
const orders = ref([]);
const copiedCode = ref("");

const PICKUP_VALID_HOURS = 24;
const HIDE_EXPIRED_AFTER_DAYS = 3;

const standalonePaidOrders = computed(() =>
    orders.value.filter((order) => order.status === "PAID" && (!order.orderType || order.orderType === "STANDALONE"))
);

const visibleStandalonePaidOrders = computed(() =>
    standalonePaidOrders.value.filter((order) => !isHiddenAfterExpiredGrace(order))
);

function fallbackPickupExpiresAt(order) {
    const baseValue = order.paidAt || order.createdAt;
    if (!baseValue) return null;
    const baseDate = new Date(baseValue);
    if (!Number.isFinite(baseDate.getTime())) return null;
    return new Date(baseDate.getTime() + PICKUP_VALID_HOURS * 60 * 60 * 1000).toISOString();
}

function isPickupPending(order) {
    if (!order.pickupDate) return false;
    return new Date(`${order.pickupDate}T00:00:00`).getTime() > startOfToday().getTime();
}

function isPickupExpired(order) {
    if (typeof order.pickupExpired === "boolean") return order.pickupExpired;
    const expiresAt = order.pickupExpiresAt || fallbackPickupExpiresAt(order);
    if (!expiresAt) return false;
    return new Date(expiresAt).getTime() <= Date.now();
}

function isHiddenAfterExpiredGrace(order) {
    if (!isPickupExpired(order)) return false;
    const expiresAt = order.pickupExpiresAt || fallbackPickupExpiresAt(order);
    if (!expiresAt) return false;
    const hiddenAt = new Date(expiresAt).getTime() + HIDE_EXPIRED_AFTER_DAYS * 24 * 60 * 60 * 1000;
    return hiddenAt <= Date.now();
}

function canRedeemOrder(order) {
    if (typeof order.canRedeem === "boolean") return order.canRedeem;
    return order.status === "PAID" && !isOrderFulfilled(order) && !isPickupPending(order) && !isPickupExpired(order);
}

function snackOrderQrPayload(order) {
    return `SNACK_ORDER|CODE=${order.orderCode || ""}`;
}

function isOrderFulfilled(order) {
    return Boolean(order?.fulfilled || order?.fulfilledAt);
}

function qrStatusLabel(order) {
    if (isOrderFulfilled(order)) return "Đã nhận bắp nước";
    if (isPickupPending(order)) return "Chưa tới ngày nhận";
    if (isPickupExpired(order)) return "Đã quá hạn";
    return "Sẵn sàng quét tại quầy";
}

function startOfToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

function resolveSnackImage(imageUrl) {
    return resolveMediaUrl(imageUrl, "https://via.placeholder.com/120x120?text=Snack");
}

function formatCurrency(amount) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(amount || 0);
}

function formatDateTime(value) {
    if (!value) return "Đang cập nhật";
    return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(new Date(value));
}

function formatPickupDate(value) {
    if (!value) return "Đang cập nhật";
    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(new Date(`${value}T00:00:00`));
}

function pickupStatusLabel(order) {
    if (isOrderFulfilled(order)) return "Đã nhận";
    if (isPickupPending(order)) return "Chưa tới ngày nhận";
    if (isPickupExpired(order)) return "Đã quá hạn";
    if (!canRedeemOrder(order)) return "Đã quá hạn";
    return "Còn hạn nhận";
}

function orderCodeLabel(order) {
    if (isOrderFulfilled(order)) return "Mã đơn đã nhận";
    if (isPickupPending(order)) return "Mã đơn chưa tới ngày nhận";
    if (isPickupExpired(order)) return "Mã đơn đã quá hạn";
    return "Mã nhận tại quầy";
}

function copyButtonLabel(order) {
    if (isOrderFulfilled(order)) return "Đã nhận";
    if (isPickupPending(order)) return "Chưa tới ngày";
    if (isPickupExpired(order)) return "Quá hạn";
    return "Sao chép";
}

async function copyOrderCode(order) {
    if (!canRedeemOrder(order)) return;
    const code = order.orderCode;
    if (!code) return;
    try {
        await navigator.clipboard.writeText(code);
        copiedCode.value = code;
        window.setTimeout(() => {
            if (copiedCode.value === code) copiedCode.value = "";
        }, 1800);
    } catch {
        copiedCode.value = "";
    }
}

onMounted(async () => {
    try {
        const { data } = await api.get("/snack-orders/my-orders");
        orders.value = Array.isArray(data) ? data : [];
    } catch (error) {
        errorMessage.value = error?.response?.data?.error || "Không thể tải đơn bắp nước của bạn.";
    } finally {
        loading.value = false;
    }
});
</script>

<style scoped>
.snack-orders-panel {
    display: grid;
    gap: 18px;
}

.state-box {
    padding: 24px;
    border: 1px solid #eadfd6;
    border-radius: 16px;
    background: #fff;
    color: #6f6159;
    font-weight: 700;
}

.error-box {
    border-color: #ffc8b2;
    color: #b6461a;
    background: #fff4ee;
}

.orders-list {
    display: grid;
    gap: 18px;
}

.order-card {
    padding: 22px;
    border: 1px solid #e6e6e6;
    border-radius: 15px;
    background: #fff;
    box-shadow: 0 10px 24px rgba(255, 107, 53, 0.08);
}

.order-card.expired {
    background: #fbfbfb;
    border-color: #e1e1e1;
    box-shadow: none;
}

.order-card.pending {
    border-color: #f0d8a7;
    box-shadow: 0 10px 24px rgba(184, 121, 0, 0.08);
}

.order-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
}

.order-code-block {
    display: grid;
    gap: 6px;
}

.order-code-block span,
.order-summary span,
.snack-info span {
    color: #777;
    font-size: 0.92rem;
}

.order-code-block strong {
    color: #ff6b35;
    font-size: 1.8rem;
    letter-spacing: 0;
}

.copy-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: 1px solid #ffd2c4;
    border-radius: 10px;
    padding: 10px 14px;
    background: #fff5f1;
    color: #ff6b35;
    font-weight: 700;
}

.copy-btn:disabled {
    background: #f1f1f1;
    border-color: #ddd;
    color: #999;
    cursor: not-allowed;
}

.order-summary {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 12px;
    margin: 18px 0;
}

.order-summary > div {
    display: grid;
    gap: 6px;
    padding: 12px;
    border-radius: 12px;
    background: #fafafa;
}

.order-summary strong,
.snack-info strong,
.snack-line > strong {
    color: #333;
}

.status-chip {
    color: #198754 !important;
}

.status-chip.pending {
    color: #b87900 !important;
}

.status-chip.expired {
    color: #dc3545 !important;
}

.total-amount {
    color: #ff6b35 !important;
}

.discount-amount {
    color: #198754 !important;
}

.order-body-row {
    display: grid;
    grid-template-columns: minmax(260px, 330px) minmax(0, 1fr);
    align-items: stretch;
    gap: 14px;
}

.order-qr-panel {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 12px;
    padding: 14px;
    border: 1px solid #ffd8ca;
    border-radius: 14px;
    background: #fff8f4;
}

.order-qr-panel.muted {
    border-color: #e3e3e3;
    background: #fafafa;
}

.order-qr-panel.muted .qr-frame {
    opacity: 0.58;
}

.qr-frame {
    display: grid;
    place-items: center;
    width: 142px;
    height: 142px;
    border: 1px solid #f0e4dc;
    border-radius: 12px;
    background: #fff;
}

.qr-copy {
    display: grid;
    gap: 5px;
}

.qr-copy span {
    color: #777;
    font-size: 0.9rem;
    font-weight: 700;
}

.qr-copy strong {
    color: #ff6b35;
    font-size: 1rem;
}

.qr-copy p {
    margin: 0;
    color: #6f6159;
    font-size: 0.92rem;
    line-height: 1.45;
}

.items-list {
    display: grid;
    gap: 12px;
    align-content: start;
    max-height: 210px;
    overflow-y: auto;
    padding-right: 4px;
}

.snack-line {
    display: grid;
    grid-template-columns: 58px 1fr auto;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border: 1px solid #f0e4dc;
    border-radius: 14px;
    background: #fffdfb;
}

.snack-line:last-child {
    margin-bottom: 0;
}

.snack-line img {
    width: 58px;
    height: 58px;
    border-radius: 12px;
    object-fit: cover;
    background: #f3ece6;
}

.snack-info {
    display: grid;
    gap: 4px;
}

.copy-note {
    margin: 14px 0 0;
    color: #198754;
    font-weight: 700;
}

.pending-note {
    margin: 14px 0 0;
    color: #8a5d12;
    font-weight: 700;
}

.expired-note {
    margin: 14px 0 0;
    color: #8c4b2f;
    font-weight: 700;
}

.fulfilled-note {
    margin: 14px 0 0;
    color: #198754;
    font-weight: 700;
}

@media (max-width: 760px) {
    .order-top {
        align-items: flex-start;
        flex-direction: column;
    }

    .order-summary {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .order-body-row {
        grid-template-columns: 1fr;
    }

    .items-list {
        max-height: none;
        overflow: visible;
        padding-right: 0;
    }
}

@media (max-width: 520px) {
    .order-summary {
        grid-template-columns: 1fr;
    }

    .order-qr-panel {
        grid-template-columns: auto 1fr;
    }

    .snack-line {
        grid-template-columns: 52px 1fr;
    }

    .snack-line > strong {
        grid-column: 2;
    }
}
</style>
