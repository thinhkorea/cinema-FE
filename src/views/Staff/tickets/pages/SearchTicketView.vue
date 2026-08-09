<template>
    <div class="ticket-lookup-page">
        <section class="lookup-hero">
            <div>
                <p class="section-kicker mb-1">Tra cứu tại quầy</p>
                <h5 class="mb-1">Nhận vé và đơn bắp nước</h5>
                <p class="section-subtitle mb-0">
                    Quét mã nhận vé online để in vé giấy, hoặc quét mã đơn bắp nước để giao món trực tiếp.
                </p>
            </div>
        </section>

        <div class="lookup-search">
            <div class="input-group">
                <span class="input-group-text"><i class="bi bi-upc-scan"></i></span>
                <input
                    v-model="txnRef"
                    type="text"
                    class="form-control"
                    placeholder="Nhập/quét mã nhận vé, mã vé giấy hoặc mã đơn bắp nước..."
                    @keyup.enter="searchTicket"
                />
                <button class="btn btn-primary" @click="searchTicket" :disabled="loading">
                    <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
                    <i v-else class="bi bi-search me-1"></i>
                    Tra cứu
                </button>
            </div>
        </div>

        <div v-if="tickets.length > 0" class="lookup-results">
            <div class="result-heading">
                <div>
                    <p class="section-kicker mb-1">Kết quả</p>
                    <h6 class="mb-0">
                        Mã giao dịch:
                        <span>{{ txnRef }}</span>
                    </h6>
                </div>
                <span class="result-count">{{ tickets.length }} vé</span>
            </div>

            <div class="table-responsive ticket-table">
                <table class="table align-middle">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Phim</th>
                            <th>Phòng</th>
                            <th>Ghế</th>
                            <th>Suất chiếu</th>
                            <th>Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(ticket, index) in tickets" :key="ticket.bookingId">
                            <td>{{ index + 1 }}</td>
                            <td class="fw-semibold">{{ ticket.movieTitle }}</td>
                            <td>{{ ticket.roomName }}</td>
                            <td>{{ ticket.seatNumber }}</td>
                            <td>{{ formatDateTime(ticket.startTime) }}</td>
                            <td>
                                <span
                                    class="badge status-badge"
                                    :class="ticket.status === 'PAID' ? 'is-paid' : 'is-pending'"
                                >
                                    {{ ticket.status }}
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <section class="snack-panel">
                <div class="snack-heading">
                    <div>
                        <p class="section-kicker mb-1">Bắp nước</p>
                        <h6 class="mb-0">Bắp nước đi kèm</h6>
                    </div>
                    <span v-if="snacksFulfilled" class="fulfilled-pill">
                        <i class="bi bi-check-circle-fill"></i>
                        Đã xuất
                    </span>
                    <span v-else-if="snacks.length > 0 && !ticketsPrinted" class="print-required-pill">
                        <i class="bi bi-printer"></i>
                        Chưa in vé
                    </span>
                </div>

                <div v-if="snacks.length > 0" class="table-responsive snack-table">
                    <table class="table table-sm align-middle mb-0">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Sản phẩm khách mua</th>
                                <th>Số lượng</th>
                                <th>Tạm tính</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(snack, index) in snacks" :key="`${snack.snackName}-${index}`">
                                <td>{{ index + 1 }}</td>
                                <td class="fw-semibold">{{ snack.snackName }}</td>
                                <td>{{ snack.quantity }}</td>
                                <td>{{ formatCurrency(snack.subtotal) }}</td>
                            </tr>
                            <tr class="snack-total-row">
                                <td colspan="3" class="text-end">Tổng bắp nước</td>
                                <td>{{ formatCurrency(snackTotal) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div v-else class="empty-snack">
                    <i class="bi bi-cup-straw"></i>
                    Không có bắp nước cho mã giao dịch này.
                </div>

                <div v-if="comboPopcornQuantity > 0" class="popcorn-choice">
                    <div>
                        <label class="form-label mb-1" for="popcornSnack">Loại bắp xuất cho combo</label>
                        <select
                            id="popcornSnack"
                            v-model="selectedPopcornSnackId"
                            class="form-select"
                            :disabled="snacksFulfilled || !ticketsPrinted || popcornSnacks.length === 0"
                        >
                            <option
                                v-for="popcorn in sortedPopcornSnacks"
                                :key="popcorn.snackId"
                                :value="popcorn.snackId"
                            >
                                {{ popcorn.snackName }} - {{ formatCurrency(popcorn.price) }}
                            </option>
                        </select>
                    </div>
                    <div class="surcharge-box" :class="{ active: popcornSurcharge > 0 }">
                        <span>Phụ thu cần thu thêm</span>
                        <strong>{{ formatCurrency(popcornSurcharge) }}</strong>
                    </div>
                </div>

                <div v-if="popcornSurcharge > 0" class="surcharge-payment">
                    <label class="form-label mb-2">Phương thức thu phụ phí</label>
                    <div class="payment-options">
                        <label
                            v-for="option in surchargePaymentOptions"
                            :key="option.value"
                            class="payment-option"
                            :class="{ active: surchargePaymentMethod === option.value }"
                        >
                            <input
                                v-model="surchargePaymentMethod"
                                type="radio"
                                name="surchargePaymentMethod"
                                :value="option.value"
                                :disabled="snacksFulfilled || !ticketsPrinted"
                            />
                            <i :class="option.icon"></i>
                            <span>{{ option.label }}</span>
                        </label>
                    </div>
                </div>

                <div v-if="fulfillmentRows.length > 0" class="fulfillment-preview">
                    <div class="preview-title">
                        <i class="bi bi-box-seam"></i>
                        Thành phần sẽ trừ khi xác nhận
                    </div>
                    <div class="preview-grid">
                        <div v-for="row in fulfillmentRows" :key="row.name" class="preview-item">
                            <span>{{ row.name }}</span>
                            <strong>x{{ row.quantity }}</strong>
                        </div>
                    </div>
                </div>

                <div v-if="snacks.length > 0 && !ticketsPrinted" class="print-required-note">
                    <i class="bi bi-info-circle-fill"></i>
                    <span>Vui lòng in vé giấy trước. Sau đó nhân viên có thể quét vé giấy để xuất bắp nước đi kèm.</span>
                </div>

                <div v-if="snacks.length > 0" class="snack-actions">
                    <button
                        class="btn btn-primary"
                        @click="fulfillSnacks"
                        :disabled="fulfilling || snacksFulfilled || !ticketsPrinted"
                    >
                        <span v-if="fulfilling" class="spinner-border spinner-border-sm me-2"></span>
                        <i v-else class="bi bi-check2-circle me-2"></i>
                        {{ bookingSnackActionLabel }}
                    </button>
                </div>
            </section>

            <div class="print-actions">
                <button
                    v-if="!ticketsPrinted"
                    class="btn btn-primary px-4"
                    @click="printGroup"
                    :disabled="printing"
                >
                    <span v-if="printing" class="spinner-border spinner-border-sm me-2"></span>
                    <i v-else class="bi bi-printer me-2"></i>
                    In toàn bộ vé
                </button>

                <div v-else class="printed-state">
                    <i class="bi bi-check-circle-fill me-1"></i>
                    Đã in vé cho mã này
                </div>
            </div>
        </div>

        <div v-if="snackOrder" class="lookup-results standalone-snack-result">
            <div class="result-heading">
                <div>
                    <p class="section-kicker mb-1">Đơn bắp nước</p>
                    <h6 class="mb-0">
                        Mã đơn:
                        <span>{{ snackOrder.orderCode }}</span>
                    </h6>
                </div>
            </div>

            <div class="snack-order-grid">
                <div>
                    <span>Thanh toán</span>
                    <strong>{{ snackOrder.paymentMethod || "VNPAY" }}</strong>
                </div>
                <div>
                    <span>Thanh toán lúc</span>
                    <strong>{{ formatDateTime(snackOrder.paidAt || snackOrder.createdAt) }}</strong>
                </div>
                <div>
                    <span>Ngày nhận</span>
                    <strong>{{ formatPickupDate(snackOrder.pickupDate) }}</strong>
                </div>
                <div>
                    <span>Hạn nhận</span>
                    <strong>{{ formatDateTime(snackOrder.pickupExpiresAt) }}</strong>
                </div>
                <div>
                    <span>Tổng tiền</span>
                    <strong class="brand-text">{{ formatCurrency(snackOrder.totalAmount) }}</strong>
                </div>
                <div v-if="Number(snackOrder.voucherDiscount || 0) > 0">
                    <span>Voucher</span>
                    <strong class="discount-text">-{{ formatCurrency(snackOrder.voucherDiscount) }}</strong>
                </div>
            </div>

            <div v-if="snackOrderItems.length > 0" class="table-responsive snack-table standalone-snack-table">
                <table class="table table-sm align-middle mb-0">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Sản phẩm khách mua</th>
                            <th>Số lượng</th>
                            <th>Tạm tính</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(snack, index) in snackOrderItems" :key="`${snack.snackId}-${index}`">
                            <td>{{ index + 1 }}</td>
                            <td class="fw-semibold">{{ snack.snackName }}</td>
                            <td>{{ snack.quantity }}</td>
                            <td>{{ formatCurrency(snack.subtotal) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="snack-actions">
                <button class="btn btn-outline-primary" @click="openStandaloneSnackSlipPage">
                    <i class="bi bi-printer me-2"></i>
                    In phiếu bắp nước
                </button>
                <button
                    class="btn btn-primary"
                    @click="fulfillStandaloneSnackOrder"
                    :disabled="fulfilling || !snackOrder?.canRedeem || !snackOrder?.printed"
                >
                    <span v-if="fulfilling" class="spinner-border spinner-border-sm me-2"></span>
                    <i v-else class="bi bi-check2-circle me-2"></i>
                    {{
                        snackOrder?.fulfilled
                            ? "Đã giao bắp nước"
                            : snackOrder?.printed
                              ? "Xác nhận giao bắp nước"
                              : "Cần in phiếu trước"
                    }}
                </button>
            </div>
        </div>

        <div v-else-if="searched && tickets.length === 0" class="empty-result">
            <i class="bi bi-ticket-perforated"></i>
            Không tìm thấy vé hoặc đơn bắp nước với mã này.
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "@/api";
import { showCinemaAlert, showCinemaConfirm } from "@/utils/cinemaAlert";

const txnRef = ref("");
const route = useRoute();
const router = useRouter();
const tickets = ref([]);
const snacks = ref([]);
const snackOrder = ref(null);
const popcornSnacks = ref([]);
const selectedPopcornSnackId = ref(null);
const surchargePaymentMethod = ref("CASH");
const loading = ref(false);
const printing = ref(false);
const printedTxn = ref([]);
const searched = ref(false);
const fulfilling = ref(false);

onMounted(() => {
    const lookup = route.query.lookup;
    if (typeof lookup === "string" && lookup.trim()) {
        txnRef.value = lookup;
        searchTicket();
    }
});
const snackTotal = computed(() => snacks.value.reduce((sum, item) => sum + item.subtotal, 0));
const snackOrderItems = computed(() => snackOrder.value?.items || []);
const surchargePaymentOptions = [
    { value: "CASH", label: "Tiền mặt", icon: "bi bi-cash-stack" },
    { value: "VNPAY", label: "VNPay", icon: "bi bi-qr-code" },
    { value: "BANK", label: "Chuyển khoản", icon: "bi bi-bank" },
];
const snacksFulfilled = computed(
    () => tickets.value.length > 0 && tickets.value.every((ticket) => ticket.snacksFulfilled),
);
const ticketsPrinted = computed(() => {
    const currentTxnRef = txnRef.value.trim();
    return (
        tickets.value.length > 0 &&
        (printedTxn.value.includes(currentTxnRef) || tickets.value.every((ticket) => ticket.printed))
    );
});
const bookingSnackActionLabel = computed(() => {
    if (snacksFulfilled.value) return "Đã xuất bắp nước";
    if (!ticketsPrinted.value) return "Cần in vé trước";
    return "Xác nhận xuất bắp nước";
});
const fulfillmentRows = computed(() => buildFulfillmentRows(snacks.value));
const sortedPopcornSnacks = computed(() =>
    [...popcornSnacks.value].sort((left, right) => Number(left.price || 0) - Number(right.price || 0)),
);
const defaultPopcornSnack = computed(() => {
    const colaPopcorn = sortedPopcornSnacks.value.find((snack) => normalizeText(snack.snackName).includes("bắp cola"));
    return colaPopcorn || sortedPopcornSnacks.value[0] || null;
});
const selectedPopcornSnack = computed(
    () =>
        popcornSnacks.value.find((snack) => String(snack.snackId) === String(selectedPopcornSnackId.value)) ||
        defaultPopcornSnack.value,
);
const comboPopcornQuantity = computed(() =>
    snacks.value.reduce((total, item) => total + getComboPopcornQuantity(item.snackName, Number(item.quantity || 0)), 0),
);
const popcornSurcharge = computed(() => {
    if (!defaultPopcornSnack.value || !selectedPopcornSnack.value || comboPopcornQuantity.value <= 0) return 0;
    const diff = Number(selectedPopcornSnack.value.price || 0) - Number(defaultPopcornSnack.value.price || 0);
    return Math.max(0, diff) * comboPopcornQuantity.value;
});
async function searchTicket() {
    if (!txnRef.value.trim()) {
        await showCinemaAlert({
            icon: "warning",
            title: "Thiếu mã giao dịch",
            text: "Vui lòng nhập mã giao dịch!",
        });
        return;
    }
    loading.value = true;
    searched.value = false;

    try {
        const lookup = parseLookupCode(txnRef.value);
        txnRef.value = lookup.code;
        snackOrder.value = null;
        tickets.value = [];
        snacks.value = [];

        if (lookup.type === "snack") {
            await searchSnackOrder(lookup.code);
            searched.value = true;
            return;
        }

        const currentTxnRef = lookup.code;
        const res = await api.get(`/bookings/txn/${currentTxnRef}`);
        tickets.value = res.data || [];

        try {
            const snackRes = await api.get(`/snacks/txn/${currentTxnRef}`);
            snacks.value = mergeSnackItems(snackRes.data || []);
        } catch (snackErr) {
            console.warn("Không thể tải thông tin bắp nước:", snackErr);
            snacks.value = [];
        }
        await ensurePopcornSnacksLoaded();
        selectDefaultPopcorn();
        surchargePaymentMethod.value = "CASH";

        searched.value = true;

        if (tickets.value.length === 0) {
            await showCinemaAlert({
                icon: "warning",
                title: "Không tìm thấy vé",
                text: "Không tìm thấy vé với mã giao dịch này.",
            });
        }

        if (tickets.value.length > 0 && tickets.value.every((t) => t.printed)) {
            if (!printedTxn.value.includes(currentTxnRef)) {
                printedTxn.value.push(currentTxnRef);
            }
        }
    } catch (err) {
        console.error("Lỗi tra cứu vé:", err);
        tickets.value = [];
        snacks.value = [];
        snackOrder.value = null;
        searched.value = true;
        await showCinemaAlert({
            icon: "error",
            title: "Tra cứu thất bại",
            text: err?.response?.data?.error || "Không thể tra cứu. Kiểm tra kết nối hoặc mã đã quét.",
        });
    } finally {
        loading.value = false;
    }
}

async function searchSnackOrder(orderCode) {
    const res = await api.get(`/snack-orders/lookup/${encodeURIComponent(orderCode)}`);
    snackOrder.value = res.data || null;
    tickets.value = [];
    snacks.value = [];
}

function parseLookupCode(value) {
    const text = String(value || "").trim();
    if (text.startsWith("TXN_PICKUP|")) {
        return { type: "ticket", code: extractPayloadValue(text, "TXN") || text };
    }
    if (text.startsWith("TXN_TICKET|")) {
        return { type: "ticket", code: extractPayloadValue(text, "TXN") || text };
    }
    if (text.startsWith("SNACK_ORDER|")) {
        return { type: "snack", code: extractPayloadValue(text, "CODE") || text };
    }
    if (/^SNK-/i.test(text)) {
        return { type: "snack", code: text.toUpperCase() };
    }
    return { type: "ticket", code: text };
}

function extractPayloadValue(payload, key) {
    const body = payload.split("|").slice(1).join("|");
    const prefix = `${key}=`;
    const segment = body.split(";").find((part) => part.trim().startsWith(prefix));
    return segment ? segment.trim().slice(prefix.length).trim() : "";
}

function mergeSnackItems(items) {
    const grouped = new Map();
    for (const item of items) {
        const key = String(item.snackId ?? item.snackName ?? "unknown");
        if (!grouped.has(key)) {
            grouped.set(key, {
                snackName: item.snackName,
                quantity: 0,
                subtotal: 0,
            });
        }
        const entry = grouped.get(key);
        entry.quantity += Number(item.quantity || 0);
        entry.subtotal += Number(item.subtotal || 0);
    }
    return Array.from(grouped.values());
}

function buildFulfillmentRows(items) {
    const grouped = new Map();
    for (const item of items) {
        const qty = Number(item.quantity || 0);
        if (qty <= 0) continue;

        for (const component of expandSnackForFulfillment(item.snackName, qty)) {
            grouped.set(component.name, (grouped.get(component.name) || 0) + component.quantity);
        }
    }

    return Array.from(grouped, ([name, quantity]) => ({ name, quantity }));
}

function expandSnackForFulfillment(snackName, quantity) {
    const normalizedName = normalizeText(snackName);
    const popcornName = selectedPopcornSnack.value?.snackName || defaultPopcornSnack.value?.snackName || "Bắp cola";
    if (normalizedName === normalizeText("Combo Gấu")) {
        return [
            { name: "Coke 32oz", quantity },
            { name: popcornName, quantity },
        ];
    }
    if (normalizedName === normalizeText("Combo Có Gấu")) {
        return [
            { name: "Coke 32oz", quantity: quantity * 2 },
            { name: popcornName, quantity },
        ];
    }
    if (normalizedName === normalizeText("Combo Nhà Gấu")) {
        return [
            { name: "Coke 32oz", quantity: quantity * 4 },
            { name: popcornName, quantity: quantity * 2 },
        ];
    }
    return [{ name: snackName, quantity }];
}

function getComboPopcornQuantity(snackName, quantity) {
    const normalizedName = normalizeText(snackName);
    if (normalizedName === normalizeText("Combo Gấu") || normalizedName === normalizeText("Combo Có Gấu")) {
        return quantity;
    }
    if (normalizedName === normalizeText("Combo Nhà Gấu")) {
        return quantity * 2;
    }
    return 0;
}

function normalizeText(value) {
    return String(value || "")
        .trim()
        .toLocaleLowerCase("vi-VN");
}

async function ensurePopcornSnacksLoaded() {
    if (popcornSnacks.value.length > 0) return;
    try {
        const res = await api.get("/staff/inventory/popcorn-snacks");
        popcornSnacks.value = res.data || [];
    } catch (err) {
        console.warn("Không thể tải danh sách bắp:", err);
        popcornSnacks.value = [];
    }
}

function selectDefaultPopcorn() {
    if (!defaultPopcornSnack.value) {
        selectedPopcornSnackId.value = null;
        return;
    }
    selectedPopcornSnackId.value = defaultPopcornSnack.value.snackId;
}

async function printGroup() {
    const currentTxnRef = txnRef.value.trim();
    if (!currentTxnRef) return;

    printing.value = true;

    try {
        await router.push(`/staff/ticket/${encodeURIComponent(currentTxnRef)}`);
    } catch (err) {
        console.error("Lỗi khi cập nhật trạng thái in:", err);
    } finally {
        printing.value = false;
    }
}

async function fulfillSnacks() {
    const currentTxnRef = txnRef.value.trim();
    if (!currentTxnRef) return;
    if (!ticketsPrinted.value) {
        await showCinemaAlert({
            icon: "warning",
            title: "Cần in vé trước",
            text: "Vui lòng in vé giấy cho khách trước khi xác nhận xuất bắp nước đi kèm.",
        });
        return;
    }

    const confirmed = await showCinemaConfirm({
        icon: "warning",
        title: "Xác nhận xuất bắp nước",
        html: buildFulfillmentConfirmHtml(),
        confirmButtonText: "Xuất kho",
        cancelButtonText: "Kiểm tra lại",
    });
    if (!confirmed) return;

    fulfilling.value = true;
    try {
        const res = await api.post(`/staff/snacks/fulfill/${currentTxnRef}`, {
            popcornSnackId: selectedPopcornSnackId.value || null,
            additionalPaymentMethod: popcornSurcharge.value > 0 ? surchargePaymentMethod.value : null,
        });
        await showCinemaAlert({
            icon: "success",
            title: "Xuất kho thành công",
            text:
                buildFulfillmentMessage(res.data) ||
                res.data?.message ||
                "Đã xuất bắp nước cho mã giao dịch này.",
        });
        await searchTicket();
    } catch (err) {
        console.error("Lỗi khi xuất bắp nước:", err);
        await showCinemaAlert({
            icon: "error",
            title: "Xuất kho thất bại",
            text: err?.response?.data?.error || "Không thể xuất bắp nước. Vui lòng thử lại.",
        });
    } finally {
        fulfilling.value = false;
    }
}

async function fulfillStandaloneSnackOrder() {
    const orderCode = snackOrder.value?.orderCode;
    if (!orderCode || !snackOrder.value?.canRedeem) return;

    const rows = snackOrderItems.value
        .map((item) => `<li><span>${escapeHtml(item.snackName)}</span><strong>x${item.quantity}</strong></li>`)
        .join("");
    const confirmed = await showCinemaConfirm({
        icon: "warning",
        title: "Xác nhận giao bắp nước",
        html: `
            <div class="cinema-alert-body">
                <div class="cinema-alert-main">Xác nhận khách đã nhận các món dưới đây.</div>
                <ul class="fulfillment-confirm-list">${rows}</ul>
            </div>
        `,
        confirmButtonText: "Giao món",
        cancelButtonText: "Kiểm tra lại",
    });
    if (!confirmed) return;

    fulfilling.value = true;
    try {
        const res = await api.post(`/staff/snacks/fulfill-order/${encodeURIComponent(orderCode)}`);
        await showCinemaAlert({
            icon: "success",
            title: "Giao món thành công",
            text: buildFulfillmentMessage(res.data) || res.data?.message || "Đã giao bắp nước cho khách.",
        });
        await searchSnackOrder(orderCode);
        searched.value = true;
    } catch (err) {
        console.error("Lỗi khi giao đơn bắp nước:", err);
        await showCinemaAlert({
            icon: "error",
            title: "Giao món thất bại",
            text: err?.response?.data?.error || "Không thể giao bắp nước. Vui lòng thử lại.",
        });
    } finally {
        fulfilling.value = false;
    }
}

function openStandaloneSnackSlipPage() {
    const orderCode = snackOrder.value?.orderCode;
    if (!orderCode) return;
    router.push(`/staff/snack-ticket/${encodeURIComponent(orderCode)}`);
}

function buildFulfillmentConfirmHtml() {
    const rows = fulfillmentRows.value
        .map((item) => `<li><span>${escapeHtml(item.name)}</span><strong>x${item.quantity}</strong></li>`)
        .join("");
    const paymentLabel =
        surchargePaymentOptions.find((option) => option.value === surchargePaymentMethod.value)?.label || "Tiền mặt";
    const surchargeLine =
        popcornSurcharge.value > 0
            ? `<div class="cinema-alert-note"><div class="cinema-alert-note-title">Phụ thu</div><div class="cinema-alert-note-text">Thu thêm ${escapeHtml(formatCurrency(popcornSurcharge.value))} bằng ${escapeHtml(paymentLabel)} trước khi xuất kho.</div></div>`
            : "";
    return `
        <div class="cinema-alert-body">
            <div class="cinema-alert-main">Hệ thống sẽ trừ kho theo các thành phần dưới đây.</div>
            <ul class="fulfillment-confirm-list">${rows}</ul>
            ${surchargeLine}
        </div>
    `;
}

function buildFulfillmentMessage(data = {}) {
    const items = data?.items || {};
    const rows = Object.entries(items);
    if (rows.length === 0) return "";
    const charge = Number(data?.additionalCharge || 0);
    const chargeText = charge > 0 ? ` Phụ thu đã tính: ${formatCurrency(charge)}.` : "";
    return `Đã trừ kho: ${rows.map(([name, quantity]) => `${name} x${quantity}`).join(", ")}.${chargeText}`;
}

function escapeHtml(value = "") {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatDateTime(t) {
    if (!t) return "Đang cập nhật";
    return new Date(t).toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function formatPickupDate(value) {
    if (!value) return "Đang cập nhật";
    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(new Date(`${value}T00:00:00`));
}

function formatCurrency(value) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(value || 0);
}
</script>

<style scoped>
.ticket-lookup-page {
    padding: 1.25rem;
    color: var(--text-primary);
}

.lookup-hero,
.lookup-search,
.lookup-results,
.snack-panel,
.empty-result {
    border: 1px solid #efe2db;
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.05);
}

.lookup-hero {
    padding: 1rem 1.1rem;
    background: linear-gradient(135deg, #fff8f4 0%, #ffffff 65%);
}

.section-kicker {
    color: #a26f5e;
    font-size: 0.74rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.section-subtitle {
    color: var(--text-secondary);
    font-size: 0.92rem;
}

.lookup-search {
    margin-top: 0.85rem;
    padding: 0.9rem;
}

.lookup-search .input-group {
    max-width: 720px;
}

.input-group-text {
    background: #fff8f4;
    color: var(--brand);
}

.lookup-results {
    margin-top: 0.95rem;
    padding: 1rem;
}

.result-heading,
.snack-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.85rem;
    margin-bottom: 0.85rem;
}

.result-heading h6 span {
    color: var(--brand);
}

.result-count,
.fulfilled-pill,
.print-required-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    border-radius: 999px;
    background: var(--brand-soft);
    color: var(--brand);
    font-size: 0.82rem;
    font-weight: 700;
    padding: 0.34rem 0.7rem;
    white-space: nowrap;
}

.print-required-pill {
    background: #fff6df;
    color: #8a5d12;
}

.standalone-snack-result {
    background: #fffdfc;
}

.snack-order-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 0.75rem;
    margin-bottom: 0.9rem;
}

.snack-order-grid > div {
    display: grid;
    gap: 0.28rem;
    border: 1px solid #f3dfd8;
    border-radius: 10px;
    background: #fff8f4;
    padding: 0.72rem;
}

.snack-order-grid span {
    color: var(--text-secondary);
    font-size: 0.78rem;
    font-weight: 700;
}

.snack-order-grid strong {
    color: #4a4644;
}

.brand-text {
    color: var(--brand) !important;
}

.discount-text {
    color: #198754 !important;
}

.standalone-snack-table {
    border: 1px solid #f1ddd4;
    border-radius: 12px;
    margin-top: 0.8rem;
}

.ticket-table,
.snack-table {
    overflow: hidden;
}

.table {
    margin-bottom: 0;
}

.table thead th {
    border-bottom: 1px solid #f1ddd4;
}

.status-badge {
    border-radius: 999px;
    padding: 0.42rem 0.65rem;
}

.status-badge.is-paid {
    background: #ff8a5c;
    color: #fff;
}

.status-badge.is-pending {
    background: #fff6df;
    color: #7a5a24;
}

.snack-panel {
    margin-top: 1rem;
    padding: 1rem;
    background: #fffdfc;
}

.snack-total-row {
    background: #fff8f4;
    color: #4a4644;
    font-weight: 800;
}

.empty-snack,
.empty-result {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    color: var(--text-secondary);
}

.empty-snack {
    min-height: 70px;
}

.empty-result {
    margin-top: 0.95rem;
    min-height: 150px;
}

.empty-result i,
.empty-snack i {
    color: var(--brand);
    font-size: 1.2rem;
}

.popcorn-choice {
    display: grid;
    grid-template-columns: minmax(240px, 1fr) auto;
    gap: 0.8rem;
    align-items: end;
    margin-top: 0.9rem;
    border: 1px solid #f3dfd8;
    border-radius: 12px;
    background: #fff;
    padding: 0.85rem;
}

.popcorn-choice .form-label {
    color: #5a4842;
    font-size: 0.86rem;
    font-weight: 800;
}

.surcharge-box {
    min-width: 190px;
    border: 1px solid #f3dfd8;
    border-radius: 10px;
    background: #fff8f4;
    padding: 0.58rem 0.75rem;
}

.surcharge-box span {
    display: block;
    color: var(--text-secondary);
    font-size: 0.78rem;
    font-weight: 700;
}

.surcharge-box strong {
    color: #5a4842;
    font-size: 1rem;
}

.surcharge-box.active {
    border-color: #ffb79b;
    box-shadow: 0 6px 16px rgba(255, 107, 53, 0.12);
}

.surcharge-box.active strong {
    color: var(--brand);
}

.surcharge-payment {
    margin-top: 0.75rem;
    border: 1px solid #f3dfd8;
    border-radius: 12px;
    background: #fff;
    padding: 0.85rem;
}

.surcharge-payment .form-label {
    color: #5a4842;
    font-size: 0.86rem;
    font-weight: 800;
}

.payment-options {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.55rem;
}

.payment-option {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    min-height: 42px;
    border: 1px solid #f3dfd8;
    border-radius: 10px;
    background: #fff8f4;
    color: #5a4842;
    font-size: 0.86rem;
    font-weight: 800;
    cursor: pointer;
}

.payment-option input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
}

.payment-option i {
    color: var(--brand);
}

.payment-option.active {
    border-color: #ff9f78;
    background: #fff0e9;
    box-shadow: 0 5px 14px rgba(255, 107, 53, 0.12);
}

.fulfillment-preview {
    margin-top: 0.9rem;
    border: 1px solid #ffd8ca;
    border-radius: 12px;
    background: #fff8f4;
    padding: 0.85rem;
}

.preview-title {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    color: #5a4842;
    font-size: 0.9rem;
    font-weight: 800;
    margin-bottom: 0.65rem;
}

.preview-title i {
    color: var(--brand);
}

.preview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0.55rem;
}

.preview-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    border: 1px solid #f3dfd8;
    border-radius: 10px;
    background: #fff;
    padding: 0.6rem 0.7rem;
}

.preview-item strong {
    color: var(--brand);
}

.print-required-note {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    margin-top: 0.9rem;
    border: 1px solid #f5dfb9;
    border-radius: 12px;
    background: #fffaf0;
    color: #7a5a24;
    padding: 0.72rem 0.85rem;
    font-size: 0.9rem;
    font-weight: 700;
}

.print-required-note i {
    margin-top: 0.1rem;
    color: #c3831f;
}

.snack-actions,
.print-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    justify-content: flex-end;
    margin-top: 0.9rem;
}

.print-actions {
    justify-content: center;
}

.printed-state {
    color: var(--brand);
    font-weight: 800;
}

:global(.fulfillment-confirm-list) {
    list-style: none;
    padding: 0;
    margin: 0.75rem 0 0;
    display: grid;
    gap: 0.5rem;
}

:global(.fulfillment-confirm-list li) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    border: 1px solid #ffd8ca;
    border-radius: 10px;
    background: #fff8f4;
    padding: 0.55rem 0.7rem;
}

:global(.fulfillment-confirm-list strong) {
    color: var(--brand);
}

@media (max-width: 575.98px) {
    .ticket-lookup-page {
        padding: 0.9rem;
    }

    .lookup-search .input-group {
        display: grid;
        grid-template-columns: 44px 1fr;
    }

    .lookup-search .btn {
        grid-column: 1 / -1;
        border-radius: 8px !important;
        margin-top: 0.6rem;
    }

    .result-heading,
    .snack-heading {
        align-items: flex-start;
        flex-direction: column;
    }

    .snack-order-grid {
        grid-template-columns: 1fr;
    }

    .popcorn-choice {
        grid-template-columns: 1fr;
    }

    .surcharge-box {
        min-width: 0;
    }

    .payment-options {
        grid-template-columns: 1fr;
    }

    .snack-actions {
        justify-content: stretch;
    }

    .snack-actions .btn,
    .print-actions .btn {
        width: 100%;
    }
}

</style>
