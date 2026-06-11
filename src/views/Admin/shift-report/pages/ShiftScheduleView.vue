<template>
    <div class="shift-schedule-page p-3 p-md-4">
        <div v-if="error" class="alert alert-danger py-2 mb-3">{{ error }}</div>

        <section class="schedule-panel">
            <div class="panel-head">
                <div class="eyebrow">Lịch làm việc theo ngày</div>
                <h5 class="mb-1">Xếp ca nhân viên</h5>
                <div class="text-muted small">
                    Mỗi nhân viên tối đa 2 ca trong ngày. Khung hoạt động của rạp là 07:30 - 00:00.
                </div>
            </div>

            <div class="assignment-bar mt-3">
                <div class="slot-picker">
                    <div class="picker-head">
                        <span class="summary-label">Chọn ca làm</span>
                        <small class="text-muted">Đang chọn: {{ selectedShiftLabel }}</small>
                    </div>
                    <div class="slot-buttons">
                        <button
                            v-for="slot in shiftSlots"
                            :key="slot.value"
                            type="button"
                            class="btn btn-sm"
                            :class="selectedShiftSlot === slot.value ? 'btn-primary' : 'btn-outline-primary'"
                            @click="selectedShiftSlot = slot.value"
                        >
                            {{ slot.label }}
                        </button>
                    </div>
                </div>

                <div class="assignment-side">
                    <label class="summary-date-field">
                        <span class="summary-label">Ngày làm việc</span>
                        <input v-model="selectedDate" type="date" class="form-control form-control-sm" />
                    </label>

                    <div class="assignment-actions">
                        <button class="btn btn-primary" @click="assignShift" :disabled="assigning">
                            <span v-if="assigning" class="spinner-border spinner-border-sm me-1"></span>
                            Xếp ca đã chọn
                        </button>
                        <button class="btn btn-outline-secondary" @click="selectedStaffIds = []" :disabled="assigning">
                            Bỏ chọn
                        </button>
                    </div>
                </div>
            </div>

            <div class="staff-grid mt-3">
                <label v-for="staff in staffOptions" :key="staff.staffId" class="staff-option">
                    <input v-model="selectedStaffIds" type="checkbox" :value="staff.staffId" />
                    <div>
                        <div class="fw-semibold">{{ staff.staffName }}</div>
                        <small class="text-muted">{{ staff.position || "Nhân viên" }}</small>
                    </div>
                </label>
            </div>

            <div class="section-title mt-4">
                <div>
                    <h6 class="mb-1">Danh sách ca trong ngày</h6>
                    <div class="text-muted small">Theo dõi trạng thái xếp ca, vào ca và kết ca trong ngày đã chọn.</div>
                </div>
                <div class="result-counter">
                    Hiển thị <strong>{{ filteredShiftRows.length }}</strong
                    >/<strong>{{ shiftRows.length }}</strong> ca
                </div>
            </div>

            <div class="filter-bar mt-3">
                <label class="filter-field">
                    <span>Ngày</span>
                    <input v-model="selectedDate" type="date" class="form-control form-control-sm" />
                </label>
                <label class="filter-field filter-field-wide">
                    <span>Tìm nhân viên</span>
                    <input
                        v-model.trim="shiftSearch"
                        type="text"
                        class="form-control form-control-sm"
                        placeholder="Nhập tên nhân viên..."
                    />
                </label>
                <label class="filter-field">
                    <span>Ca làm</span>
                    <select v-model="filterShiftSlot" class="form-select form-select-sm">
                        <option value="">Tất cả các ca</option>
                        <option v-for="slot in shiftSlots" :key="slot.value" :value="slot.value">
                            {{ slot.label }}
                        </option>
                    </select>
                </label>
                <label class="filter-field">
                    <span>Trạng thái</span>
                    <select v-model="filterStatus" class="form-select form-select-sm">
                        <option value="">Tất cả trạng thái</option>
                        <option value="ASSIGNED">Đã xếp ca</option>
                        <option value="OPEN">Đang trong ca</option>
                        <option value="CLOSED">Đã kết ca</option>
                    </select>
                </label>
                <div class="filter-actions">
                    <button class="btn btn-sm btn-outline-primary" @click="loadShiftSummary" :disabled="loading">
                        <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
                        Tải lại
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" @click="resetFilters">Xóa lọc</button>
                </div>
            </div>

            <div class="table-wrap mt-3">
                <ShiftSessionTable
                    :shifts="filteredShiftRows"
                    :loading="loading"
                    :format-currency="formatCurrency"
                    :format-date-time="formatDateTime"
                />
            </div>
        </section>
    </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import api from "@/api";
import ShiftSessionTable from "../components/ShiftSessionTable.vue";
import { showCinemaAlert } from "@/utils/cinemaAlert";

function formatDateInput(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

const shiftSlots = [
    { value: "SHIFT_1", label: "Ca 1 · 07:30 - 11:30" },
    { value: "SHIFT_2", label: "Ca 2 · 11:30 - 15:30" },
    { value: "SHIFT_3", label: "Ca 3 · 15:30 - 19:30" },
    { value: "SHIFT_4", label: "Ca 4 · 19:30 - 00:00" },
];

const selectedDate = ref(formatDateInput(new Date()));
const selectedShiftSlot = ref("SHIFT_1");
const selectedStaffIds = ref([]);
const shiftSummary = ref({ shifts: [] });
const staffOptions = ref([]);
const loading = ref(false);
const assigning = ref(false);
const error = ref("");
const shiftSearch = ref("");
const filterShiftSlot = ref("");
const filterStatus = ref("");

const shiftRows = computed(() => shiftSummary.value?.shifts || []);
const selectedShiftLabel = computed(
    () => shiftSlots.find((slot) => slot.value === selectedShiftSlot.value)?.label || "Chưa chọn ca"
);
const filteredShiftRows = computed(() => {
    const keyword = shiftSearch.value.trim().toLowerCase();
    return shiftRows.value.filter((shift) => {
        const matchesKeyword = !keyword || String(shift.staffName || "").toLowerCase().includes(keyword);
        const matchesSlot = !filterShiftSlot.value || shift.shiftSlot === filterShiftSlot.value;
        const matchesStatus = !filterStatus.value || shift.status === filterStatus.value;
        return matchesKeyword && matchesSlot && matchesStatus;
    });
});

const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));

const formatDateTime = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleString("vi-VN");
};

const loadShiftSummary = async () => {
    loading.value = true;
    error.value = "";
    try {
        const res = await api.get(`/admin/reports/shift-summary?date=${selectedDate.value}`);
        shiftSummary.value = res.data || { shifts: [] };
    } catch (err) {
        shiftSummary.value = { shifts: [] };
        error.value = err?.response?.data?.error || "Không thể tải danh sách ca.";
    } finally {
        loading.value = false;
    }
};

const loadStaffOptions = async () => {
    try {
        const res = await api.get("/admin/reports/shift-staff-options");
        staffOptions.value = res.data || [];
    } catch {
        staffOptions.value = [];
    }
};

const assignShift = async () => {
    if (!selectedStaffIds.value.length) {
        await showCinemaAlert({
            icon: "warning",
            title: "Chưa chọn nhân viên",
            text: "Vui lòng chọn ít nhất một nhân viên để xếp ca.",
        });
        return;
    }

    assigning.value = true;
    try {
        const res = await api.post("/admin/reports/shift-assignments", {
            workDate: selectedDate.value,
            shiftSlot: selectedShiftSlot.value,
            staffIds: selectedStaffIds.value,
        });
        const result = res.data || {};
        const skippedMessages = Array.isArray(result.skippedMessages) ? result.skippedMessages : [];
        const detailText = skippedMessages.length ? `\n${skippedMessages.join("\n")}` : "";
        await showCinemaAlert({
            icon: "success",
            title: "Đã xếp ca",
            text: `Đã xếp thành công ${result.assignedCount || 0} nhân viên.${detailText}`,
        });
        selectedStaffIds.value = [];
        await loadShiftSummary();
    } catch (err) {
        await showCinemaAlert({
            icon: "error",
            title: "Không thể xếp ca",
            text: err?.response?.data?.error || "Vui lòng thử lại.",
        });
    } finally {
        assigning.value = false;
    }
};

const resetFilters = () => {
    shiftSearch.value = "";
    filterShiftSlot.value = "";
    filterStatus.value = "";
};

watch(selectedDate, async (newValue, oldValue) => {
    if (newValue && newValue !== oldValue) {
        await loadShiftSummary();
    }
});

onMounted(async () => {
    await Promise.all([loadShiftSummary(), loadStaffOptions()]);
});
</script>

<style scoped>
.shift-schedule-page {
    background: linear-gradient(180deg, #fffdfb 0%, #fff 40%);
    border-radius: 14px;
    min-height: 100%;
}

.schedule-panel {
    border: 1px solid #f0dfd7;
    border-radius: 16px;
    background: #fff;
    padding: 16px;
}

.panel-head {
    display: block;
}

.eyebrow {
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #ff6b35;
    margin-bottom: 4px;
}

.assignment-bar {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    padding: 14px 16px;
    border: 1px solid #f3e9e5;
    border-radius: 14px;
    background: #fffaf7;
}

.slot-picker {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1 1 420px;
}

.picker-head {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.slot-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.assignment-side {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 12px;
    flex: 0 0 auto;
}

.summary-label {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #8b6b61;
}

.summary-date-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 180px;
}

.staff-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 10px;
}

.staff-option {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    border: 1px solid #ead7cf;
    border-radius: 12px;
    background: #fff;
    padding: 12px;
    cursor: pointer;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.staff-option:hover {
    border-color: #ffb089;
    box-shadow: 0 8px 20px rgba(255, 107, 53, 0.08);
    transform: translateY(-1px);
}

.staff-option input {
    margin-top: 4px;
}

.assignment-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.section-title {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 12px;
    padding-top: 14px;
    border-top: 1px solid #f3e9e5;
}

.result-counter {
    font-size: 0.92rem;
    color: #6d5b54;
}

.filter-bar {
    display: grid;
    grid-template-columns: minmax(170px, 0.9fr) minmax(220px, 1.4fr) repeat(2, minmax(180px, 1fr)) auto;
    gap: 12px;
    align-items: end;
}

.filter-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 0.88rem;
    color: #6d5b54;
}

.filter-field-wide {
    min-width: 0;
}

.filter-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
}

.table-wrap {
    border: 1px solid #f3e9e5;
    border-radius: 12px;
    overflow: hidden;
}

@media (max-width: 992px) {
    .assignment-bar,
    .assignment-side,
    .section-title {
        flex-direction: column;
        align-items: stretch;
    }

    .filter-bar {
        grid-template-columns: 1fr;
    }

    .filter-actions {
        justify-content: stretch;
    }
}

@media (max-width: 576px) {
    .schedule-panel {
        padding: 12px;
    }

    .slot-buttons .btn,
    .assignment-actions .btn,
    .filter-actions .btn {
        width: 100%;
    }

    .summary-date-field {
        min-width: 0;
    }
}
</style>
