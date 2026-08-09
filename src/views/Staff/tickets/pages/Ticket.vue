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
            <!-- Side perforations -->
            <div class="perforation perforation-left"></div>
            <div class="perforation perforation-right"></div>

            <!-- Header -->
            <div class="text-center mb-4">
                <h1 class="fw-bold" style="font-size: 24px; color: #1a1a1a; margin-bottom: 5px">
                    {{ ticket.movieTitle }}
                </h1>
                <p class="mb-0" style="font-size: 14px; color: #555">
                    {{ ticket.cinema }}
                </p>
            </div>

            <!-- Location Card -->
            <div class="bg-white rounded p-3 mb-3">
                <p style="font-size: 12px; color: #666; line-height: 1.5; margin-bottom: 0">
                    {{ ticket.location }}
                </p>
            </div>

            <!-- Date and Time -->
            <div class="row g-0 mb-3">
                <div class="col-6">
                    <div class="bg-white rounded-start p-3">
                        <p style="font-size: 11px; color: #888; margin-bottom: 5px">Ngày</p>
                        <p class="fw-bold" style="font-size: 16px; color: #1a1a1a; margin-bottom: 0">
                            {{ ticket.date }}
                        </p>
                    </div>
                </div>
                <div class="col-6">
                    <div class="bg-white rounded-end p-3">
                        <p style="font-size: 11px; color: #888; margin-bottom: 5px">Giờ</p>
                        <p
                            class="fw-bold"
                            style="font-size: 16px; color: #1a1a1a; margin-bottom: 0; white-space: nowrap"
                        >
                            {{ ticket.time }}
                        </p>
                    </div>
                </div>
            </div>

            <!-- POS -->
            <div class="row g-0 mb-3">
                <div class="col-12">
                    <p style="font-size: 10px; color: #666; margin-bottom: 3px">POS</p>
                    <p class="fw-bold" style="font-size: 14px; color: #1a1a1a; margin-bottom: 0">
                        {{ ticket.pos }}
                    </p>
                </div>
            </div>

            <!-- Dashed Divider -->
            <hr style="border-top: 2px dashed #a88585; margin: 15px 0" />

            <!-- Movie Details Card -->
            <div class="bg-white rounded p-3 mb-3">
                <p style="font-size: 10px; color: #888; margin-bottom: 5px; text-transform: uppercase">Phim</p>
                <h3 class="fw-bold mb-3" style="font-size: 18px; color: #1a1a1a">
                    {{ ticket.movieName }}
                </h3>

                <div class="row g-3">
                    <div class="col-6">
                        <p style="font-size: 10px; color: #888; margin-bottom: 5px; text-transform: uppercase">Phòng</p>
                        <p class="fw-bold" style="font-size: 14px; color: #1a1a1a; margin-bottom: 0">
                            {{ ticket.room }}
                        </p>
                    </div>
                    <div class="col-6">
                        <p style="font-size: 10px; color: #888; margin-bottom: 5px; text-transform: uppercase">Ghế</p>
                        <p class="fw-bold" style="font-size: 14px; color: #1a1a1a; margin-bottom: 0">
                            {{ ticket.seat }}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Pricing -->
            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span style="font-size: 12px; color: #555">Số lượng vé</span>
                    <span class="fw-bold" style="font-size: 14px; color: #1a1a1a">{{ ticket.quantity }}</span>
                </div>
                <div v-if="ticket.price1" class="d-flex justify-content-between align-items-center mb-2">
                    <span style="font-size: 12px; color: #555">{{ ticket.priceLabel1 }}</span>
                    <span class="fw-bold" style="font-size: 14px; color: #1a1a1a">{{ ticket.price1 }}</span>
                </div>
            </div>

            <!-- Total -->
            <div class="d-flex justify-content-between align-items-center mb-3">
                <span class="fw-bold" style="font-size: 14px; color: #1a1a1a">{{ ticket.totalLabel }}</span>
                <span class="fw-bold" style="font-size: 20px; color: #1a1a1a">{{ ticket.total }}</span>
            </div>

            <!-- Attached snacks -->
            <div v-if="snacks.length > 0" class="bg-white rounded p-3 mb-3">
                <p style="font-size: 10px; color: #888; margin-bottom: 8px; text-transform: uppercase">
                    Bắp nước đi kèm
                </p>
                <div v-for="item in snacks" :key="`${item.snackId}-${item.snackName}`" class="snack-print-line">
                    <span>{{ item.snackName }}</span>
                    <strong>x{{ item.quantity }}</strong>
                </div>
                <div class="snack-print-total">
                    <span>Tổng bắp nước</span>
                    <strong>{{ formatCurrency(snackTotal) }}</strong>
                </div>
            </div>

            <!-- Dashed Divider -->
            <hr style="border-top: 2px dashed #a88585; margin: 15px 0" />

            <!-- Sales Number -->
            <p class="text-center" style="font-size: 11px; color: #666; margin-bottom: 12px">
                {{ ticket.salesNo }}
            </p>

            <!-- Cinema rules -->
            <div class="ticket-rules bg-white rounded p-3 mb-3">
                <p class="ticket-rules-title">QUY ĐỊNH CỦA RẠP</p>
                <ul>
                    <li>Vui lòng giữ vé và xuất trình khi được yêu cầu.</li>
                    <li>Vé đã in không hỗ trợ đổi hoặc hoàn lại.</li>
                    <li>Vui lòng vào đúng phòng và ghế đã ghi trên vé.</li>
                    <li>Mọi quyết định của nhân viên là quyết định cuối cùng.</li>
                </ul>
            </div>

            <div class="ticket-print-actions">
                <button
                    v-if="!ticket.printed"
                    class="ticket-print-button"
                    type="button"
                    :disabled="printing"
                    @click="confirmPrintedTicket"
                >
                    <span v-if="printing" class="spinner-border spinner-border-sm me-2"></span>
                    <i v-else class="bi bi-printer me-2"></i>
                    In vé
                </button>
                <div v-else class="ticket-printed-state">
                    <i class="bi bi-check-circle-fill me-1"></i>
                    Đã xác nhận in vé
                </div>
                <p v-if="printError" class="ticket-print-error">{{ printError }}</p>
            </div>

            <!-- Footer -->
            <p class="text-center" style="font-size: 11px; color: #666; font-style: italic; margin-bottom: 0">
                {{ ticket.footer }}
            </p>
        </div>
    </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "@/api";

const ticket = reactive({
    movieTitle: "Đang tải...",
    cinema: "Cinema And Joy",
    location: "Tầng 4, Khu II, Đường 3/2, Cần Thơ",
    date: "",
    time: "",
    pos: "ONLINE",
    movieName: "Đang tải...",
    room: "...",
    seat: "...",
    priceLabel1: "Tổng giá vé",
    price1: "",
    totalLabel: "Tổng cộng",
    total: "0 VND",
    salesNo: "...",
    printed: false,
    txnRef: "",
    footer: "Vui lòng kiểm tra thông tin vé trước khi giao cho khách hàng",
});

const route = useRoute();
const router = useRouter();
const snacks = ref([]);
const printing = ref(false);
const printError = ref("");
const snackTotal = computed(() => snacks.value.reduce((sum, item) => sum + Number(item.subtotal || 0), 0));
// Hàm định dạng ngày tháng
const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr)
        .toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        })
        .toUpperCase();
};

// Hàm định dạng giờ
const formatTime = (timeStr) => {
    if (!timeStr) return "";
    return new Date(timeStr).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
};

onMounted(async () => {
    const txnRef = route.params.txnRef;
    if (!txnRef) {
        ticket.movieTitle = "Lỗi: Không tìm thấy mã giao dịch";
        return;
    }

    try {
        const [res, snackRes] = await Promise.all([
            api.get(`/bookings/group-ticket-info/${txnRef}`),
            api.get(`/snacks/txn/${txnRef}`).catch(() => ({ data: [] })),
        ]);
        const data = res.data;
        snacks.value = mergeSnackItems(snackRes.data || []);

        // Cập nhật dữ liệu từ API vào object 'ticket'
        Object.assign(ticket, {
            txnRef: data.txnRef || txnRef,
            movieTitle: data.movieTitle,
            quantity: data.seat.split(",").length, // Đếm số lượng vé từ chuỗi ghế
            movieName: data.movieTitle,
            date: formatDate(data.startTime),
            time: `${formatTime(data.startTime)} - ${formatTime(data.endTime)}`,
            room: data.room,
            seat: data.seat,
            total: data.total,
            salesNo: `Sales No. ${data.salesNo}`,
            footer: data.footer,
            pos: data.paymentMethod === "CASH" ? "BOX OFFICE" : "ONLINE",
            price1: data.total, // Hiển thị tổng tiền ở dòng giá vé
            printed: data.printed === true,
        });
    } catch (err) {
        console.error("Lỗi khi tải dữ liệu vé:", err);
        ticket.movieTitle = "Lỗi khi tải dữ liệu vé";
        ticket.movieName = "Vui lòng kiểm tra lại mã giao dịch hoặc kết nối.";
    }
});

function mergeSnackItems(items) {
    const grouped = new Map();
    for (const item of items) {
        const key = String(item.snackId ?? item.snackName ?? "unknown");
        if (!grouped.has(key)) {
            grouped.set(key, {
                snackId: item.snackId,
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

function formatCurrency(value) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(value || 0);
}

async function confirmPrintedTicket() {
    const txnRef = route.params.txnRef;
    if (!txnRef || printing.value || ticket.printed) return;

    printing.value = true;
    printError.value = "";
    try {
        await api.post(`/bookings/mark-printed/${encodeURIComponent(txnRef)}`);
        ticket.printed = true;
    } catch (err) {
        if (err?.response?.status === 409) {
            ticket.printed = true;
        } else {
            printError.value = err?.response?.data?.error || "Không thể xác nhận in vé. Vui lòng thử lại.";
        }
    } finally {
        printing.value = false;
    }
}

function goBackToLookup() {
    router.push({ path: "/staff/search-ticket", query: { lookup: route.params.txnRef } });
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

.snack-print-line,
.snack-print-total {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    color: #1a1a1a;
}

.snack-print-line {
    border-bottom: 1px solid #eee;
    padding: 5px 0;
    font-size: 12px;
}

.snack-print-total {
    padding-top: 8px;
    font-size: 12px;
    font-weight: 800;
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
