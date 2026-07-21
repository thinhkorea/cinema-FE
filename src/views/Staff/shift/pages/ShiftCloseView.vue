<template>
    <div class="shift-close-page">
        <section class="shift-header">
            <div>
                <p class="section-kicker mb-1">Kết ca</p>
                <h5 class="mb-1">Đối chiếu tiền trong ca</h5>
                <p class="section-subtitle mb-0">
                    Tổng hợp tiền vé và phụ phí bắp nước theo ngày làm việc.
                </p>
            </div>
            <div class="shift-date-tools">
                <input v-model="selectedDate" type="date" class="form-control" />
                <button class="btn btn-primary" @click="loadShiftClose" :disabled="loading">
                    <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
                    Tải lại
                </button>
            </div>
        </section>

        <section class="shift-state-panel">
            <div>
                <p class="section-kicker mb-1">Trạng thái ca</p>
                <h6 class="mb-1">{{ openShift ? "Đang trong ca" : "Chưa vào ca" }}</h6>
                <p class="section-subtitle mb-0">
                    {{
                        openShift
                            ? `Bắt đầu ${formatDateTime(openShift.openedAt)} - đã làm ${formatShiftDuration(openShift.openedAt, now)}`
                            : "Bấm Vào ca trước khi bắt đầu bán vé."
                    }}
                </p>
            </div>
            <div class="shift-actions">
                <button class="btn btn-outline-primary" @click="startShift" :disabled="!!loadingAction || !!openShift">
                    <span v-if="loadingAction === 'start'" class="spinner-border spinner-border-sm me-1"></span>
                    Vào ca
                </button>
                <button class="btn btn-primary" @click="closeShift" :disabled="!!loadingAction || !openShift">
                    <span v-if="loadingAction === 'close'" class="spinner-border spinner-border-sm me-1"></span>
                    Kết ca
                </button>
            </div>
        </section>

        <section class="summary-grid">
            <div class="summary-card">
                <span>Tổng doanh thu</span>
                <strong>{{ formatCurrency(totalRevenue) }}</strong>
            </div>
            <div class="summary-card cash">
                <span>Tiền mặt cần nộp</span>
                <strong>{{ formatCurrency(expectedCash) }}</strong>
            </div>
            <div class="summary-card digital">
                <span>VNPay / chuyển khoản</span>
                <strong>{{ formatCurrency(digitalRevenue) }}</strong>
            </div>
        </section>

        <section class="summary-grid">
            <div class="summary-card">
                <span>Tổng số ca trong ngày</span>
                <strong>{{ dailyShiftCount }}</strong>
            </div>
            <div class="summary-card cash">
                <span>Tổng giờ làm trong ngày</span>
                <strong>{{ formatDurationFromSeconds(dailyDurationSeconds) }}</strong>
            </div>
            <div class="summary-card digital">
                <span>Ngày báo cáo</span>
                <strong>{{ displayDate }}</strong>
            </div>
        </section>

        <section class="cash-check-panel">
            <div>
                <label class="form-label">Tiền mặt thực tế trong két</label>
                <input
                    v-model.number="actualCash"
                    type="number"
                    min="0"
                    step="1000"
                    class="form-control"
                    placeholder="Nhập số tiền kiểm được..."
                />
            </div>
            <div>
                <label class="form-label">Ghi chú kết ca</label>
                <input v-model="shiftNote" type="text" class="form-control" placeholder="Ví dụ: thiếu 20.000đ..." />
            </div>
            <div class="difference-box" :class="cashDifferenceClass">
                <span>Chênh lệch</span>
                <strong>{{ formatCurrency(cashDifference) }}</strong>
            </div>
        </section>

        <section class="detail-panel">
            <div class="detail-head">
                <div>
                    <p class="section-kicker mb-1">Chi tiết</p>
                    <h6 class="mb-0">{{ displayDate }}</h6>
                </div>
                <span class="staff-pill">{{ auth.fullName || report?.staff || auth.username || "Nhân viên" }}</span>
            </div>

            <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>

            <div class="table-responsive">
                <table class="table align-middle mb-0">
                    <thead>
                        <tr>
                            <th>Ca</th>
                            <th>Vé tiền mặt</th>
                            <th>Vé VNPay</th>
                            <th>Phụ phí tiền mặt</th>
                            <th>Phụ phí VNPay</th>
                            <th>Phụ phí chuyển khoản</th>
                            <th>Tổng</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="row in revenueRows" :key="`${row.shiftKey}-${row.staffName}`">
                            <td>
                                <div class="fw-semibold">{{ row.shiftLabel }}</div>
                                <small class="text-muted">{{ row.timeRange }}</small>
                            </td>
                            <td>{{ formatCurrency(row.ticketCashRevenue) }}</td>
                            <td>{{ formatCurrency(row.ticketVnpayRevenue) }}</td>
                            <td>{{ formatCurrency(row.popcornCashRevenue) }}</td>
                            <td>{{ formatCurrency(row.popcornVnpayRevenue) }}</td>
                            <td>{{ formatCurrency(row.popcornBankRevenue) }}</td>
                            <td class="fw-bold text-primary">{{ formatCurrency(row.totalRevenue) }}</td>
                        </tr>
                        <tr v-if="!loading && !revenueRows.length">
                            <td colspan="7" class="text-center text-muted py-4">
                                Chưa có doanh thu nào trong ngày này.
                            </td>
                        </tr>
                        <tr v-if="loading">
                            <td colspan="7" class="text-center text-muted py-4">Đang tải báo cáo kết ca...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <section class="detail-panel" v-if="closedShifts.length">
            <div class="detail-head">
                <div>
                    <p class="section-kicker mb-1">Lịch sử ca</p>
                    <h6 class="mb-0">Các ca trong ngày</h6>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table align-middle mb-0">
                    <thead>
                        <tr>
                            <th>Vào ca</th>
                            <th>Số giờ làm</th>
                            <th>Kết ca</th>
                            <th>Tiền mặt hệ thống</th>
                            <th>Tiền mặt thực tế</th>
                            <th>Chênh lệch</th>
                            <th>Ghi chú</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="shift in closedShifts" :key="shift.shiftId">
                            <td>{{ formatDateTime(shift.openedAt) }}</td>
                            <td>{{ formatShiftDuration(shift.openedAt, shift.closedAt, shift.durationSeconds) }}</td>
                            <td>{{ formatDateTime(shift.closedAt) }}</td>
                            <td>{{ formatCurrency(shift.expectedCash) }}</td>
                            <td>{{ formatCurrency(shift.actualCash) }}</td>
                            <td :class="toNumber(shift.cashDifference) < 0 ? 'text-danger' : 'text-success'">
                                {{ formatCurrency(shift.cashDifference) }}
                            </td>
                            <td>{{ shift.note || "-" }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
    </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import api from "@/api";
import { useAuthStore } from "@/stores/auth.store";
import { showCinemaAlert, showCinemaConfirm } from "@/utils/cinemaAlert";

const auth = useAuthStore();
const selectedDate = ref(formatDateInput(new Date()));
const report = ref(null);
const actualCash = ref(0);
const shiftNote = ref("");
const loading = ref(false);
const loadingAction = ref("");
const error = ref("");
const now = ref(new Date());
let clockTimer = null;

const revenueRows = computed(() => report.value?.revenues || []);
const openShift = computed(() => report.value?.openShift || null);
const closedShifts = computed(() => report.value?.shifts || []);
const totalRevenue = computed(() => revenueRows.value.reduce((sum, row) => sum + toNumber(row.totalRevenue), 0));
const expectedCash = computed(() =>
    revenueRows.value.reduce(
        (sum, row) => sum + toNumber(row.ticketCashRevenue) + toNumber(row.popcornCashRevenue),
        0,
    ),
);
const digitalRevenue = computed(() =>
    revenueRows.value.reduce(
        (sum, row) =>
            sum +
            toNumber(row.ticketVnpayRevenue) +
            toNumber(row.popcornVnpayRevenue) +
            toNumber(row.popcornBankRevenue),
        0,
    ),
);
const dailyShiftCount = computed(() => Number(report.value?.dailyShiftCount || 0));
const dailyDurationSeconds = computed(() => Number(report.value?.dailyDurationSeconds || 0));
const cashDifference = computed(() => toNumber(actualCash.value) - expectedCash.value);
const cashDifferenceClass = computed(() => {
    if (cashDifference.value === 0) return "balanced";
    return cashDifference.value > 0 ? "surplus" : "short";
});
const displayDate = computed(() => {
    if (!selectedDate.value) return "Hôm nay";
    return new Date(`${selectedDate.value}T00:00:00`).toLocaleDateString("vi-VN");
});

function formatDateInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function toNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(toNumber(value));
}

function formatDateTime(value) {
    if (!value) return "-";
    return new Date(value).toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function formatShiftDuration(startValue, endValue, durationSeconds = null) {
    if (!startValue || !endValue) return "-";
    let totalSeconds = Number(durationSeconds);
    if (!Number.isFinite(totalSeconds)) {
        const start = new Date(startValue);
        const end = endValue instanceof Date ? endValue : new Date(endValue);
        totalSeconds = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
    }
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    if (hours > 0) return minutes > 0 ? `${hours} giờ ${minutes} phút` : `${hours} giờ`;
    if (minutes > 0) return seconds > 0 ? `${minutes} phút ${seconds} giây` : `${minutes} phút`;
    return `${seconds} giây`;
}

function formatDurationFromSeconds(totalSeconds) {
    const safeSeconds = Number(totalSeconds || 0);
    if (!safeSeconds) return "0 giờ";
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    if (hours > 0) return minutes > 0 ? `${hours} giờ ${minutes} phút` : `${hours} giờ`;
    return `${minutes} phút`;
}

async function startShift() {
    loadingAction.value = "start";
    error.value = "";
    try {
        await api.post("/staff/reports/shift/start");
        await loadShiftClose();
        await showCinemaAlert({
            icon: "success",
            title: "Đã vào ca",
            text: "Ca làm của bạn đã được bắt đầu.",
        });
    } catch (err) {
        await showCinemaAlert({
            icon: "error",
            title: "Không thể vào ca",
            text: err?.response?.data?.error || "Vui lòng thử lại.",
        });
    } finally {
        loadingAction.value = "";
    }
}

async function closeShift() {
    const confirmed = await showCinemaConfirm({
        title: "Kết ca",
        text: `Xác nhận kết ca với tiền mặt thực tế ${formatCurrency(actualCash.value)}?`,
        icon: "warning",
        confirmButtonText: "Kết ca",
    });
    if (!confirmed) return;

    loadingAction.value = "close";
    error.value = "";
    try {
        await api.post("/staff/reports/shift/close", {
            actualCash: toNumber(actualCash.value),
            note: shiftNote.value || null,
        });
        shiftNote.value = "";
        await loadShiftClose();
        await showCinemaAlert({
            icon: "success",
            title: "Đã kết ca",
            text: "Ca làm đã được lưu lại.",
        });
    } catch (err) {
        await showCinemaAlert({
            icon: "error",
            title: "Không thể kết ca",
            text: err?.response?.data?.error || "Vui lòng thử lại.",
        });
    } finally {
        loadingAction.value = "";
    }
}

async function loadShiftClose() {
    loading.value = true;
    error.value = "";
    try {
        const res = await api.get(`/staff/reports/shift-close?date=${selectedDate.value}`);
        report.value = res.data || { revenues: [] };
        actualCash.value = expectedCash.value;
    } catch (err) {
        report.value = { revenues: [] };
        error.value = err?.response?.data?.error || "Không thể tải báo cáo kết ca.";
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    loadShiftClose();
    clockTimer = window.setInterval(() => {
        now.value = new Date();
    }, 60000);
});

onUnmounted(() => {
    if (clockTimer) {
        window.clearInterval(clockTimer);
    }
});
</script>

<style scoped>
.shift-close-page {
    padding: 1.25rem;
    color: var(--text-primary);
    background: linear-gradient(180deg, #fffdfb 0%, #fff 42%);
}

.shift-header,
.shift-state-panel,
.shift-register-panel,
.cash-check-panel,
.detail-panel {
    border: 1px solid #efe2db;
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.05);
}

.shift-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem 1.1rem;
    background: linear-gradient(135deg, #fff8f4 0%, #ffffff 65%);
}

.section-kicker {
    color: #a26f5e;
    font-size: 0.74rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.section-subtitle {
    color: var(--text-secondary);
    font-size: 0.92rem;
}

.shift-date-tools {
    display: flex;
    align-items: center;
    gap: 0.55rem;
}

.shift-date-tools .form-control {
    min-width: 180px;
}

.shift-state-panel {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 0.9rem;
    padding: 0.9rem 1rem;
    background: #fffaf7;
}

.shift-register-panel {
    margin-top: 0.9rem;
    padding: 1rem;
}

.registration-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 0.75rem;
}

.registration-card {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.75rem;
    border: 1px solid #f3dfd8;
    border-radius: 12px;
    background: #fff;
    min-height: 96px;
    padding: 0.85rem 0.9rem;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.registration-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 22px rgba(255, 107, 53, 0.09);
}

.registration-card.available {
    border-color: #ffd3c2;
}

.registration-card.registered {
    border-color: #a7dcc7;
    background: #f8fffb;
}

.registration-card.full {
    border-color: #e5e0dd;
    background: #fafafa;
}

.registration-card-main {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 0;
}

.registration-icon {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    border-radius: 10px;
    background: #fff1ea;
    color: #ff6b35;
    font-size: 1.05rem;
}

.registration-card.registered .registration-icon {
    background: #eaf8f1;
    color: #24865a;
}

.registration-card.full .registration-icon {
    background: #f1eeee;
    color: #8a7f7a;
}

.registration-info {
    min-width: 0;
}

.registration-info strong {
    display: block;
    color: #282320;
    line-height: 1.25;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.slot-meter {
    height: 6px;
    width: 100%;
    min-width: 130px;
    margin: 0.45rem 0 0.3rem;
    overflow: hidden;
    border-radius: 999px;
    background: #f1e8e3;
}

.slot-meter span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #ff6b35, #ff9a69);
}

.registration-card.registered .slot-meter span {
    background: linear-gradient(90deg, #2da36f, #63c497);
}

.registration-card.full .slot-meter span {
    background: #9a918d;
}

.registration-action {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.45rem;
}

.registration-action .btn {
    min-width: 104px;
    min-height: 34px;
}

.slot-status {
    border-radius: 999px;
    background: #fff1ea;
    color: #bc4f26;
    font-size: 0.72rem;
    font-weight: 800;
    line-height: 1;
    padding: 0.35rem 0.55rem;
    white-space: nowrap;
}

.registration-card.registered .slot-status {
    background: #eaf8f1;
    color: #24865a;
}

.registration-card.full .slot-status {
    background: #eeecea;
    color: #746b66;
}

.empty-registration {
    grid-column: 1 / -1;
    border: 1px dashed #e8d8d0;
    border-radius: 12px;
    color: var(--text-secondary);
    padding: 1rem;
    text-align: center;
}

.shift-actions {
    display: flex;
    align-items: center;
    gap: 0.55rem;
}

.shift-actions .btn {
    min-width: 106px;
    min-height: 38px;
}

.summary-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.8rem;
    margin-top: 0.9rem;
}

.summary-card {
    border: 1px solid #f3dfd8;
    border-left: 4px solid #ff8758;
    border-radius: 12px;
    background: #fff;
    padding: 0.9rem;
}

.summary-card.cash {
    border-left-color: #5bc4a5;
}

.summary-card.digital {
    border-left-color: #5b8def;
}

.summary-card span,
.difference-box span {
    display: block;
    color: var(--text-secondary);
    font-size: 0.82rem;
    font-weight: 700;
}

.summary-card strong,
.difference-box strong {
    display: block;
    margin-top: 0.35rem;
    color: #4a4644;
    font-size: 1.35rem;
}

.cash-check-panel {
    display: grid;
    grid-template-columns: minmax(220px, 1fr) minmax(220px, 1fr) 240px;
    gap: 0.9rem;
    align-items: end;
    margin-top: 0.9rem;
    padding: 1rem;
}

.difference-box {
    border: 1px solid #f3dfd8;
    border-radius: 12px;
    background: #fff8f4;
    padding: 0.75rem;
}

.difference-box.balanced strong {
    color: #24865a;
}

.difference-box.surplus strong {
    color: #1d63c5;
}

.difference-box.short strong {
    color: #c0392b;
}

.detail-panel {
    margin-top: 0.9rem;
    padding: 1rem;
}

.detail-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
    margin-bottom: 0.85rem;
}

.staff-pill {
    border-radius: 999px;
    background: var(--brand-soft);
    color: var(--brand);
    font-size: 0.82rem;
    font-weight: 800;
    padding: 0.38rem 0.75rem;
    white-space: nowrap;
}

.table thead th {
    border-bottom: 1px solid #f1ddd4;
}

@media (max-width: 767.98px) {
    .shift-close-page {
        padding: 0.9rem;
    }

    .shift-header,
    .shift-state-panel,
    .detail-head {
        align-items: flex-start;
        flex-direction: column;
    }

    .shift-date-tools,
    .shift-actions,
    .shift-actions .btn,
    .shift-date-tools .btn {
        width: 100%;
    }

    .shift-date-tools .form-control {
        min-width: 0;
    }

    .registration-card {
        grid-template-columns: 1fr;
    }

    .registration-action {
        align-items: stretch;
    }

    .registration-action .btn {
        width: 100%;
    }

    .summary-grid,
    .cash-check-panel {
        grid-template-columns: 1fr;
    }
}
</style>
