<template>
    <div
        class="min-vh-100 d-flex align-items-center justify-content-center p-3"
        style="background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)"
    >
        <button class="ticket-back-button" type="button" @click="goBackToLookup">
            <i class="bi bi-arrow-left"></i>
            <span>Quay lại tra cứu</span>
        </button>

        <div
            class="ticket-container"
            style="
                width: 100%;
                max-width: 400px;
                background-color: #d4a5a5;
                border-radius: 20px;
                padding: 30px 20px;
                position: relative;
            "
        >
            <div class="perforation perforation-left"></div>
            <div class="perforation perforation-right"></div>

            <div class="text-center mb-4">
                <h1 class="fw-bold" style="font-size: 24px; color: #1a1a1a; margin-bottom: 5px">
                    {{ ticket.title }}
                </h1>
                <p class="mb-0" style="font-size: 14px; color: #555">
                    {{ ticket.cinema }}
                </p>
            </div>

            <div class="bg-white rounded p-3 mb-3">
                <p style="font-size: 12px; color: #666; line-height: 1.5; margin-bottom: 0">
                    {{ ticket.location }}
                </p>
            </div>

            <div class="row g-0 mb-3">
                <div class="col-6">
                    <div class="bg-white rounded-start p-3">
                        <p style="font-size: 11px; color: #888; margin-bottom: 5px">Ngày nhận</p>
                        <p class="fw-bold" style="font-size: 16px; color: #1a1a1a; margin-bottom: 0">
                            {{ ticket.date }}
                        </p>
                    </div>
                </div>
                <div class="col-6">
                    <div class="bg-white rounded-end p-3">
                        <p style="font-size: 11px; color: #888; margin-bottom: 5px">Hạn nhận</p>
                        <p class="fw-bold" style="font-size: 12px; color: #1a1a1a; margin-bottom: 0">
                            {{ ticket.time }}
                        </p>
                    </div>
                </div>
            </div>

            <hr style="border-top: 2px dashed #a88585; margin: 15px 0" />

            <div class="bg-white rounded p-3 mb-3">
                <div class="row g-3">
                    <div class="col-6">
                        <p style="font-size: 10px; color: #888; margin-bottom: 5px; text-transform: uppercase">Mã đơn</p>
                        <p class="fw-bold" style="font-size: 13px; color: #1a1a1a; margin-bottom: 0">
                            {{ ticket.orderCode }}
                        </p>
                    </div>
                    <div class="col-6">
                        <p style="font-size: 10px; color: #888; margin-bottom: 5px; text-transform: uppercase">
                            Thanh toán
                        </p>
                        <p class="fw-bold" style="font-size: 14px; color: #1a1a1a; margin-bottom: 0">
                            {{ ticket.paymentMethod }}
                        </p>
                    </div>
                </div>
            </div>

            <div class="mb-3">
                <div v-for="item in items" :key="`${item.snackId}-${item.snackName}`" class="snack-ticket-line">
                    <span style="font-size: 12px; color: #555">{{ item.snackName }}</span>
                    <span class="fw-bold" style="font-size: 14px; color: #1a1a1a">x{{ item.quantity }}</span>
                </div>
            </div>

            <div class="d-flex justify-content-between align-items-center mb-3">
                <span class="fw-bold" style="font-size: 14px; color: #1a1a1a">{{ ticket.totalLabel }}</span>
                <span class="fw-bold" style="font-size: 20px; color: #1a1a1a">{{ ticket.total }}</span>
            </div>

            <hr style="border-top: 2px dashed #a88585; margin: 15px 0" />

            <p class="text-center" style="font-size: 11px; color: #666; margin-bottom: 12px">
                {{ ticket.salesNo }}
            </p>

            <div class="ticket-rules bg-white rounded p-3 mb-3">
                <p class="ticket-rules-title">QUY ĐỊNH CỦA RẠP</p>
                <ul>
                    <li>Vui lòng kiểm tra món và số lượng trước khi rời quầy.</li>
                    <li>Phiếu chỉ có giá trị trong thời hạn nhận ghi trên phiếu.</li>
                    <li>Phiếu đã giao không hỗ trợ đổi hoặc hoàn lại.</li>
                    <li>Mọi quyết định của nhân viên là quyết định cuối cùng.</li>
                </ul>
            </div>

            <div class="ticket-print-actions">
                <button
                    v-if="!ticket.printed"
                    class="ticket-print-button"
                    type="button"
                    :disabled="printing"
                    @click="confirmPrintedSnackOrder"
                >
                    <span v-if="printing" class="spinner-border spinner-border-sm me-2"></span>
                    <i v-else class="bi bi-printer me-2"></i>
                    In phiếu bắp nước
                </button>
                <div v-else class="ticket-printed-state">
                    <i class="bi bi-check-circle-fill me-1"></i>
                    Đã xác nhận in phiếu
                </div>
                <p v-if="printError" class="ticket-print-error">{{ printError }}</p>
            </div>

            <p class="text-center" style="font-size: 11px; color: #666; font-style: italic; margin-bottom: 0">
                {{ ticket.footer }}
            </p>
        </div>
    </div>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "@/api";

const route = useRoute();
const router = useRouter();
const items = ref([]);
const printing = ref(false);
const printError = ref("");
const ticket = reactive({
    title: "Đang tải...",
    cinema: "Cinema And Joy",
    location: "Tầng 4, Khu II, Đường 3/2, Cần Thơ",
    date: "",
    time: "",
    orderCode: "",
    paymentMethod: "VNPAY",
    totalLabel: "Tổng cộng",
    total: "0 VND",
    salesNo: "...",
    printed: false,
    footer: "Vui lòng kiểm tra thông tin phiếu trước khi giao cho khách hàng",
});

onMounted(async () => {
    const orderCode = route.params.orderCode;
    if (!orderCode) {
        ticket.title = "Lỗi: Không tìm thấy mã đơn";
        return;
    }

    try {
        const res = await api.get(`/snack-orders/lookup/${encodeURIComponent(orderCode)}`);
        const data = res.data || {};
        Object.assign(ticket, {
            title: "Phiếu bắp nước",
            date: formatPickupDate(data.pickupDate),
            time: formatDateTime(data.pickupExpiresAt),
            orderCode: data.orderCode || orderCode,
            paymentMethod: data.paymentMethod || "VNPAY",
            total: formatCurrency(data.totalAmount),
            salesNo: `Order No. ${data.orderCode || orderCode}`,
            printed: data.printed === true,
        });
        items.value = data.items || [];
    } catch (err) {
        console.error("Lỗi khi tải phiếu bắp nước:", err);
        ticket.title = "Lỗi khi tải phiếu";
        ticket.footer = "Vui lòng kiểm tra lại mã đơn hoặc kết nối.";
    }
});

function formatPickupDate(value) {
    if (!value) return "Đang cập nhật";
    return new Date(`${value}T00:00:00`)
        .toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        })
        .toUpperCase();
}

function formatDateTime(value) {
    if (!value) return "Đang cập nhật";
    return new Date(value).toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function formatCurrency(value) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(value || 0);
}

async function confirmPrintedSnackOrder() {
    const orderCode = route.params.orderCode;
    if (!orderCode || printing.value || ticket.printed) return;

    printing.value = true;
    printError.value = "";
    try {
        await api.post(`/staff/snacks/mark-printed/${encodeURIComponent(orderCode)}`);
        ticket.printed = true;
    } catch (err) {
        printError.value = err?.response?.data?.error || "Không thể xác nhận in phiếu. Vui lòng thử lại.";
    } finally {
        printing.value = false;
    }
}

function goBackToLookup() {
    router.push({ path: "/staff/search-ticket", query: { lookup: route.params.orderCode } });
}
</script>

<style scoped>
:root {
    --bs-body-font-size: 1rem;
    --bs-body-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

body {
    font-family: var(--bs-body-font-family);
}

.ticket-back-button {
    position: fixed;
    top: 18px;
    left: 18px;
    z-index: 10;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 40px;
    padding: 8px 14px;
    border: 1px solid #e5caca;
    border-radius: 8px;
    background: #fff;
    color: #8f6767;
    font-size: 13px;
    font-weight: 700;
    box-shadow: 0 5px 15px rgba(143, 103, 103, 0.12);
    transition: 0.2s ease;
}

.ticket-back-button:hover {
    background: #d4a5a5;
    color: #fff;
}

.ticket-print-actions {
    margin: 0 0 16px;
    text-align: center;
}

.ticket-print-button {
    min-height: 42px;
    padding: 9px 20px;
    border: 0;
    border-radius: 8px;
    background: #ff6b35;
    color: #fff;
    font-size: 14px;
    font-weight: 800;
    box-shadow: 0 8px 18px rgba(255, 107, 53, 0.22);
}

.ticket-print-button:hover:not(:disabled) {
    background: #e95b28;
}

.ticket-print-button:disabled {
    cursor: wait;
    opacity: 0.7;
}

.ticket-printed-state {
    color: #198754;
    font-size: 13px;
    font-weight: 800;
}

.ticket-print-error {
    margin: 8px 0 0;
    color: #dc3545;
    font-size: 11px;
}

.ticket-container {
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.perforation {
    position: absolute;
    width: 15px;
    height: 15px;
    background-color: #f5f5f5;
    border-radius: 50%;
    top: 50%;
    transform: translateY(-50%);
}

.perforation-left {
    left: -8px;
}

.perforation-right {
    right: -8px;
}

.snack-ticket-line {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    border-bottom: 1px solid rgba(168, 133, 133, 0.35);
    padding: 6px 0;
}

.ticket-rules {
    color: #555;
}

.ticket-rules-title {
    color: #8f6767;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.08em;
    margin: 0 0 8px;
}

.ticket-rules ul {
    margin: 0;
    padding-left: 18px;
}

.ticket-rules li {
    font-size: 11px;
    line-height: 1.55;
    margin-bottom: 4px;
}

@media (max-width: 576px) {
    .ticket-container {
        padding: 20px 15px;
    }
}
</style>
