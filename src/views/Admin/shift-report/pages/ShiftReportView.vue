<template>
    <div class="shift-report-page p-3 p-md-4">
        <section class="shift-report-panel">
            <div class="panel-head">
                <div class="eyebrow">Theo ngày</div>
                <div class="shift-report-controls">
                    <label class="control-field">
                        <span>Ngày báo cáo</span>
                        <input v-model="selectedDate" type="date" class="form-control form-control-sm" />
                    </label>
                    <button class="btn btn-sm btn-primary" @click="loadShiftSummary" :disabled="loading">
                        <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
                        Xem báo cáo
                    </button>
                </div>
            </div>

            <ShiftReportSummary
                class="mt-3"
                :total-revenue="shiftRevenueTotal"
                :ticket-revenue="shiftTicketTotal"
                :popcorn-revenue="shiftPopcornTotal"
                :format-currency="formatCurrency"
            />

            <div v-if="error" class="alert alert-danger py-2 mt-3 mb-0">
                {{ error }}
            </div>

            <div class="section-title mt-4 mb-2">
                <h6 class="mb-0">Ca làm trong ngày</h6>
            </div>
            <ShiftSessionTable
                :shifts="shiftRows"
                :loading="loading"
                :format-currency="formatCurrency"
                :format-date-time="formatDateTime"
            />

            <div class="section-title mt-4 mb-2">
                <h6 class="mb-0">Doanh thu theo ca</h6>
            </div>
            <ShiftReportTable
                :rows="shiftRevenueRows"
                :loading="loading"
                :format-currency="formatCurrency"
            />
        </section>
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import api from "@/api";
import ShiftReportSummary from "../components/ShiftReportSummary.vue";
import ShiftSessionTable from "../components/ShiftSessionTable.vue";
import ShiftReportTable from "../components/ShiftReportTable.vue";

function formatDateInput(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

const selectedDate = ref(formatDateInput(new Date()));
const shiftSummary = ref({ revenues: [], shifts: [] });
const loading = ref(false);
const error = ref("");

const toNumber = (value) => Number(value || 0);

const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(toNumber(value));

const formatDateTime = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleString("vi-VN");
};

const shiftRows = computed(() => shiftSummary.value?.shifts || []);
const shiftRevenueRows = computed(() => shiftSummary.value?.revenues || []);
const shiftRevenueTotal = computed(() =>
    shiftRevenueRows.value.reduce((sum, row) => sum + toNumber(row.totalRevenue), 0)
);
const shiftTicketTotal = computed(() =>
    shiftRevenueRows.value.reduce(
        (sum, row) => sum + toNumber(row.ticketCashRevenue) + toNumber(row.ticketVnpayRevenue),
        0
    )
);
const shiftPopcornTotal = computed(() =>
    shiftRevenueRows.value.reduce(
        (sum, row) =>
            sum +
            toNumber(row.popcornCashRevenue) +
            toNumber(row.popcornVnpayRevenue) +
            toNumber(row.popcornBankRevenue),
        0
    )
);

const loadShiftSummary = async () => {
    loading.value = true;
    error.value = "";
    try {
        const res = await api.get(`/admin/reports/shift-summary?date=${selectedDate.value}`);
        shiftSummary.value = res.data || { revenues: [], shifts: [] };
    } catch (err) {
        shiftSummary.value = { revenues: [], shifts: [] };
        error.value = err?.response?.data?.error || "Không thể tải báo cáo ca.";
    } finally {
        loading.value = false;
    }
};

onMounted(loadShiftSummary);
</script>

<style scoped>
.shift-report-page {
    background: linear-gradient(180deg, #fffdfb 0%, #fff 40%);
    border-radius: 14px;
    min-height: 100%;
}

.shift-report-panel {
    border: 1px solid #f0dfd7;
    border-radius: 16px;
    background: #fff;
    padding: 16px;
}

.panel-head {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    justify-content: space-between;
    gap: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f3e9e5;
}

.eyebrow {
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #ff6b35;
    margin-bottom: 4px;
}

.section-title {
    border-top: 1px solid #f3e9e5;
    padding-top: 14px;
}

.shift-report-controls {
    display: flex;
    align-items: end;
    gap: 8px;
    flex-wrap: wrap;
}

.control-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 0.88rem;
    color: #6d5b54;
    min-width: 180px;
}

@media (max-width: 576px) {
    .shift-report-panel {
        padding: 12px;
    }

    .shift-report-controls {
        align-items: end;
        flex-direction: column;
        width: 100%;
    }

    .control-field,
    .shift-report-controls .btn {
        width: 100%;
    }
}
</style>
