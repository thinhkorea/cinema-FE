<template>
    <div class="shift-schedule-page">
        <div v-if="error" class="alert alert-danger py-2 mb-3">{{ error }}</div>

        <section class="schedule-panel">
            <header class="schedule-hero">
                <div>
                    <div class="eyebrow">Lịch làm việc theo ngày</div>
                    <h5 class="mb-1">Xếp ca nhân viên</h5>
                    <div class="text-muted small">
                        Tạo ca trước, sau đó chọn ca để chỉ định nhân viên. Mỗi nhân viên tối đa 2 ca/ngày.
                    </div>
                </div>

                <div class="hero-tools">
                    <label class="date-field">
                        <span>Ngày làm việc</span>
                        <input v-model="selectedDate" type="date" class="form-control form-control-sm" />
                    </label>
                    <button class="btn btn-sm btn-outline-primary" @click="reloadSchedule" :disabled="loading">
                        <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
                        Tải lại
                    </button>
                </div>
            </header>

            <div class="schedule-stats">
                <div class="stat-card">
                    <span>Ca đã tạo</span>
                    <strong>{{ shiftCapacities.length }}</strong>
                </div>
                <div class="stat-card">
                    <span>Nhân viên đã xếp</span>
                    <strong>{{ assignedShiftCount }}</strong>
                </div>
            </div>

            <div class="workflow-grid">
                <article class="workflow-card">
                    <div class="workflow-head">
                        <span class="step-badge">1</span>
                        <div>
                            <h6 class="mb-1">Tạo hoặc cập nhật ca</h6>
                            <p class="mb-0">Chọn khung giờ và số người tối đa cho ngày đã chọn.</p>
                        </div>
                    </div>

                    <div class="slot-buttons">
                        <button
                            v-for="slot in shiftSlots"
                            :key="slot.value"
                            type="button"
                            class="slot-button"
                            :class="{ active: selectedShiftSlot === slot.value, created: isShiftCreated(slot.value) }"
                            @click="selectedShiftSlot = slot.value"
                        >
                            <span>{{ slot.shortLabel }}</span>
                            <small>{{ slot.timeRange }}</small>
                        </button>
                    </div>

                    <div class="create-row">
                        <label class="date-field">
                            <span>Số người tối đa</span>
                            <input
                                v-model.number="capacityInput"
                                type="number"
                                min="1"
                                max="50"
                                class="form-control form-control-sm"
                            />
                        </label>
                        <button
                            v-if="!isSelectedShiftCreated"
                            class="btn btn-primary"
                            @click="saveCapacity('create')"
                            :disabled="savingCapacity"
                        >
                            <span v-if="savingCapacity" class="spinner-border spinner-border-sm me-1"></span>
                            Tạo ca
                        </button>
                        <button
                            v-else
                            class="btn btn-outline-primary"
                            @click="saveCapacity('update')"
                            :disabled="savingCapacity"
                        >
                            <span v-if="savingCapacity" class="spinner-border spinner-border-sm me-1"></span>
                            Cập nhật số người
                        </button>
                    </div>
                </article>

                <article class="workflow-card">
                    <div class="workflow-head">
                        <span class="step-badge">2</span>
                        <div>
                            <h6 class="mb-1">Chọn ca đã tạo</h6>
                            <p class="mb-0">Bấm vào một ca để phân nhân viên cho ca đó.</p>
                        </div>
                    </div>

                    <div class="created-shift-list">
                        <button
                            v-for="capacity in shiftCapacities"
                            :key="capacity.shiftSlot"
                            type="button"
                            class="created-shift-card"
                            :class="{ active: selectedShiftSlot === capacity.shiftSlot }"
                            @click="selectedShiftSlot = capacity.shiftSlot"
                        >
                            <div>
                                <strong>{{ capacity.shiftLabel }}</strong>
                                <span>{{ capacity.registeredCount || 0 }}/{{ capacity.maxStaff || 0 }} nhân viên</span>
                            </div>
                            <div class="capacity-meter">
                                <span :style="{ width: capacityUsageWidth(capacity) }"></span>
                            </div>
                        </button>

                        <div v-if="!shiftCapacities.length" class="empty-assignment">
                            Chưa có ca nào được tạo trong ngày này.
                        </div>
                    </div>
                </article>
            </div>

            <section class="assign-panel" :class="{ disabled: !selectedCapacity }">
                <div class="assign-head">
                    <div class="workflow-head">
                        <span class="step-badge">3</span>
                        <div>
                            <h6 class="mb-1">Chỉ định nhân viên</h6>
                            <p class="mb-0">
                                {{
                                    selectedCapacity
                                        ? `${selectedShiftLabel}: ${selectedAssignedCount}/${selectedCapacity.maxStaff || 0} nhân viên`
                                        : "Tạo hoặc chọn một ca đã tạo để phân nhân viên."
                                }}
                            </p>
                        </div>
                    </div>

                    <div class="assignment-actions">
                        <button class="btn btn-primary" @click="assignShift" :disabled="assigning || !selectedCapacity">
                            <span v-if="assigning" class="spinner-border spinner-border-sm me-1"></span>
                            Xếp vào ca này
                        </button>
                        <button class="btn btn-outline-secondary" @click="selectedStaffIds = []" :disabled="assigning">
                            Bỏ chọn
                        </button>
                    </div>
                </div>

                <div v-if="selectedCapacity" class="selected-summary">
                    <span>{{ selectedCapacityText }}</span>
                    <span>{{ selectedStaffIds.length }} nhân viên đang chọn</span>
                    <span>Còn {{ selectedRemainingSlots }} chỗ</span>
                </div>

                <div class="staff-toolbar">
                    <input
                        v-model.trim="staffSearch"
                        type="text"
                        class="form-control form-control-sm"
                        placeholder="Tìm nhân viên để xếp ca..."
                        :disabled="!selectedCapacity"
                    />
                    <div class="staff-toolbar-actions">
                        <span>{{ filteredStaffOptions.length }}/{{ staffOptions.length }} nhân viên</span>
                        <button
                            type="button"
                            class="btn btn-sm btn-outline-primary"
                            :disabled="!selectedCapacity || !filteredStaffOptions.length"
                            @click="selectFilteredStaff"
                        >
                            Chọn kết quả lọc
                        </button>
                        <button
                            type="button"
                            class="btn btn-sm btn-outline-secondary"
                            :disabled="!selectedStaffIds.length"
                            @click="selectedStaffIds = []"
                        >
                            Bỏ chọn tất cả
                        </button>
                    </div>
                </div>

                <div v-if="selectedCapacity" class="staff-list">
                    <label
                        v-for="staff in filteredStaffOptions"
                        :key="staff.staffId"
                        class="staff-row"
                        :class="{ selected: selectedStaffIds.includes(staff.staffId) }"
                    >
                        <input v-model="selectedStaffIds" type="checkbox" :value="staff.staffId" />
                        <div class="staff-main">
                            <strong>{{ staff.staffName }}</strong>
                            <span>{{ staff.position || "Nhân viên" }}</span>
                        </div>
                        <i v-if="selectedStaffIds.includes(staff.staffId)" class="bi bi-check2-circle"></i>
                    </label>
                    <div v-if="!filteredStaffOptions.length" class="empty-assignment">Không tìm thấy nhân viên phù hợp.</div>
                </div>
            </section>

            <section class="session-panel">
                <div class="section-title">
                    <div>
                        <h6 class="mb-1">Danh sách ca trong ngày</h6>
                        <div class="text-muted small">Theo dõi trạng thái xếp ca, vào ca và kết ca trong ngày đã chọn.</div>
                    </div>
                    <div class="result-counter">
                        Hiển thị <strong>{{ filteredShiftRows.length }}</strong>/<strong>{{ shiftRows.length }}</strong> ca
                    </div>
                </div>

                <div class="filter-bar">
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
                        <button class="btn btn-sm btn-outline-secondary" @click="resetFilters">Xóa lọc</button>
                    </div>
                </div>

                <div class="table-wrap">
                    <ShiftSessionTable
                        :shifts="filteredShiftRows"
                        :loading="loading"
                        :format-currency="formatCurrency"
                        :format-date-time="formatDateTime"
                    />
                </div>
            </section>
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
    { value: "SHIFT_1", shortLabel: "Ca 1", timeRange: "07:30 - 11:30", label: "Ca 1 · 07:30 - 11:30" },
    { value: "SHIFT_2", shortLabel: "Ca 2", timeRange: "11:30 - 15:30", label: "Ca 2 · 11:30 - 15:30" },
    { value: "SHIFT_3", shortLabel: "Ca 3", timeRange: "15:30 - 19:30", label: "Ca 3 · 15:30 - 19:30" },
    { value: "SHIFT_4", shortLabel: "Ca 4", timeRange: "19:30 - 00:00", label: "Ca 4 · 19:30 - 00:00" },
];

const selectedDate = ref(formatDateInput(new Date()));
const selectedShiftSlot = ref("SHIFT_1");
const selectedStaffIds = ref([]);
const shiftSummary = ref({ shifts: [] });
const shiftCapacities = ref([]);
const staffOptions = ref([]);
const loading = ref(false);
const assigning = ref(false);
const savingCapacity = ref(false);
const error = ref("");
const staffSearch = ref("");
const shiftSearch = ref("");
const filterShiftSlot = ref("");
const filterStatus = ref("");
const capacityInput = ref(1);

const shiftRows = computed(() => shiftSummary.value?.shifts || []);
const assignedShiftCount = computed(() => shiftRows.value.length);
const selectedCapacity = computed(() =>
    shiftCapacities.value.find((item) => item.shiftSlot === selectedShiftSlot.value) || null
);
const isSelectedShiftCreated = computed(() => Boolean(selectedCapacity.value));
const selectedRegisteredCount = computed(() =>
    shiftRows.value.filter((shift) => shift.shiftSlot === selectedShiftSlot.value).length
);
const selectedAssignedCount = computed(() => Number(selectedCapacity.value?.registeredCount || selectedRegisteredCount.value || 0));
const selectedRemainingSlots = computed(() => {
    const capacity = selectedCapacity.value;
    if (!capacity) return 0;
    return Math.max(0, Number(capacity.maxStaff || 0) - selectedAssignedCount.value);
});
const selectedCapacityText = computed(() => {
    const capacity = selectedCapacity.value;
    if (!capacity) {
        return `Chưa tạo ca ${selectedShiftLabel.value}.`;
    }
    return `Đã xếp ${capacity.registeredCount || 0}/${capacity.maxStaff || 0} người.`;
});
const selectedShiftLabel = computed(
    () => shiftSlots.find((slot) => slot.value === selectedShiftSlot.value)?.label || "Chưa chọn ca"
);
const filteredStaffOptions = computed(() => {
    const keyword = staffSearch.value.trim().toLowerCase();
    if (!keyword) return staffOptions.value;
    return staffOptions.value.filter((staff) =>
        `${staff.staffName || ""} ${staff.position || ""}`.toLowerCase().includes(keyword)
    );
});
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

const loadShiftCapacities = async () => {
    try {
        const res = await api.get(`/admin/reports/shift-capacities?date=${selectedDate.value}`);
        shiftCapacities.value = res.data || [];
        syncCapacityInput();
    } catch {
        shiftCapacities.value = [];
        syncCapacityInput();
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

const reloadSchedule = async () => {
    await Promise.all([loadShiftSummary(), loadShiftCapacities()]);
};

const syncCapacityInput = () => {
    const capacity = selectedCapacity.value;
    capacityInput.value = capacity?.maxStaff || Math.max(1, selectedRegisteredCount.value || 1);
};

const isShiftCreated = (shiftSlot) => shiftCapacities.value.some((capacity) => capacity.shiftSlot === shiftSlot);

const capacityUsageWidth = (capacity) => {
    const maxStaff = Math.max(1, Number(capacity?.maxStaff || 0));
    const registered = Math.min(maxStaff, Number(capacity?.registeredCount || 0));
    return `${Math.round((registered / maxStaff) * 100)}%`;
};

const selectFilteredStaff = () => {
    if (!selectedCapacity.value) return;
    const current = new Set(selectedStaffIds.value);
    const capacityLeft = Math.max(0, selectedRemainingSlots.value);
    const remainingPickCount = Math.max(0, capacityLeft - current.size);
    const nextIds = filteredStaffOptions.value
        .map((staff) => staff.staffId)
        .filter((staffId) => staffId != null && !current.has(staffId))
        .slice(0, remainingPickCount);

    selectedStaffIds.value = [...current, ...nextIds];
};

const saveCapacity = async (mode = "save") => {
    const maxStaff = Number(capacityInput.value || 0);
    if (maxStaff < 1) {
        await showCinemaAlert({
            icon: "warning",
            title: "Số người không hợp lệ",
            text: "Vui lòng nhập số người tối đa từ 1 trở lên.",
        });
        return;
    }

    savingCapacity.value = true;
    try {
        await api.post("/admin/reports/shift-capacities", {
            workDate: selectedDate.value,
            shiftSlot: selectedShiftSlot.value,
            maxStaff,
        });
        await Promise.all([loadShiftCapacities(), loadShiftSummary()]);
        await showCinemaAlert({
            icon: "success",
            title: mode === "create" ? "Đã tạo ca" : "Đã cập nhật số người",
            text:
                mode === "create"
                    ? `${selectedShiftLabel.value} đã được mở với tối đa ${maxStaff} nhân viên.`
                    : `${selectedShiftLabel.value} hiện cho phép tối đa ${maxStaff} nhân viên.`,
        });
    } catch (err) {
        await showCinemaAlert({
            icon: "error",
            title: "Không thể lưu",
            text: err?.response?.data?.error || "Vui lòng thử lại.",
        });
    } finally {
        savingCapacity.value = false;
    }
};

const assignShift = async () => {
    if (!selectedCapacity.value) {
        await showCinemaAlert({
            icon: "warning",
            title: "Chưa chọn ca làm",
            text: "Vui lòng tạo hoặc chọn một ca làm trước khi xếp nhân viên.",
        });
        return;
    }

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
        await Promise.all([loadShiftSummary(), loadShiftCapacities()]);
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
        await Promise.all([loadShiftSummary(), loadShiftCapacities()]);
    }
});

watch([selectedShiftSlot, selectedCapacity, selectedRegisteredCount], () => {
    syncCapacityInput();
    selectedStaffIds.value = [];
});

onMounted(async () => {
    await Promise.all([loadShiftSummary(), loadShiftCapacities(), loadStaffOptions()]);
});
</script>

<style scoped>
.shift-schedule-page {
    min-height: 100%;
    padding: 16px;
    background: #fff;
}

.schedule-panel {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.schedule-hero,
.workflow-card,
.assign-panel,
.session-panel,
.stat-card {
    border: 1px solid #f0dfd7;
    border-radius: 12px;
    background: #fff;
}

.schedule-hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 18px;
    background: #fffdfb;
}

.eyebrow {
    color: #ff6b35;
    font-size: 0.76rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    margin-bottom: 4px;
    text-transform: uppercase;
}

.hero-tools {
    display: flex;
    align-items: end;
    gap: 10px;
}

.date-field,
.filter-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
}

.date-field span,
.filter-field span {
    color: #8b6b61;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.date-field .form-control {
    min-width: 180px;
}

.schedule-stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
}

.stat-card {
    border-left: 4px solid #ff8758;
    padding: 14px;
}

.stat-card:nth-child(2) {
    border-left-color: #55b99f;
}

.stat-card:nth-child(3) {
    border-left-color: #5b8def;
}

.stat-card span,
.stat-card small {
    display: block;
    color: #75665f;
    font-size: 0.82rem;
    font-weight: 700;
}

.stat-card strong {
    display: block;
    color: #25211f;
    font-size: 1.55rem;
    line-height: 1.1;
    margin-top: 6px;
}

.workflow-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
    gap: 14px;
}

.workflow-card,
.assign-panel,
.session-panel {
    padding: 16px;
}

.workflow-head {
    display: flex;
    align-items: flex-start;
    gap: 10px;
}

.workflow-head p {
    color: #75665f;
    font-size: 0.9rem;
}

.step-badge {
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    border-radius: 999px;
    background: #ff6b35;
    color: #fff;
    font-size: 0.85rem;
    font-weight: 900;
}

.slot-buttons {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
    margin-top: 14px;
}

.slot-button {
    border: 1px solid #ead7cf;
    border-radius: 10px;
    background: #fff;
    color: #342b27;
    min-height: 68px;
    padding: 10px;
    text-align: left;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.slot-button span,
.slot-button small {
    display: block;
}

.slot-button span {
    font-weight: 900;
}

.slot-button small {
    color: #75665f;
    margin-top: 2px;
}

.slot-button.created {
    background: #fffaf7;
}

.slot-button:hover,
.created-shift-card:hover,
.staff-row:hover {
    border-color: #ffb089;
    box-shadow: 0 8px 18px rgba(255, 107, 53, 0.08);
    transform: translateY(-1px);
}

.slot-button.active,
.created-shift-card.active {
    border-color: #ff6b35;
    background: #fff4ee;
    box-shadow: 0 10px 22px rgba(255, 107, 53, 0.12);
}

.create-row {
    display: grid;
    grid-template-columns: minmax(170px, 1fr) auto;
    align-items: end;
    gap: 10px;
    margin-top: 14px;
}

.create-row .btn,
.hero-tools .btn,
.assignment-actions .btn {
    min-height: 38px;
    white-space: nowrap;
}

.created-shift-list {
    display: grid;
    gap: 10px;
    margin-top: 14px;
}

.created-shift-card {
    border: 1px solid #ead7cf;
    border-radius: 10px;
    background: #fff;
    color: #2d2622;
    padding: 12px;
    text-align: left;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.created-shift-card strong,
.created-shift-card span {
    display: block;
}

.created-shift-card strong {
    font-size: 0.95rem;
}

.created-shift-card span {
    color: #75665f;
    font-size: 0.84rem;
    margin-top: 2px;
}

.capacity-meter {
    height: 6px;
    overflow: hidden;
    border-radius: 999px;
    background: #f1e8e3;
    margin-top: 10px;
}

.capacity-meter span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #ff6b35, #ff9a69);
}

.assign-panel.disabled {
    background: #fffdfb;
}

.assign-head,
.section-title {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
}

.assignment-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: flex-end;
}

.selected-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 14px;
}

.selected-summary span,
.result-counter {
    border-radius: 999px;
    background: #fff1ea;
    color: #9c4522;
    font-size: 0.82rem;
    font-weight: 800;
    padding: 0.35rem 0.65rem;
}

.staff-toolbar {
    display: grid;
    grid-template-columns: minmax(220px, 1fr) auto;
    align-items: center;
    gap: 10px;
    margin-top: 12px;
}

.staff-toolbar-actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: flex-end;
}

.staff-toolbar-actions span {
    color: #75665f;
    font-size: 0.84rem;
    font-weight: 800;
    white-space: nowrap;
}

.staff-list {
    max-height: 264px;
    margin-top: 12px;
    overflow-y: auto;
    border: 1px solid #f0dfd7;
    border-radius: 10px;
    background: #fff;
}

.staff-row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    min-height: 48px;
    padding: 9px 12px;
    border-bottom: 1px solid #f5e9e4;
    cursor: pointer;
    transition: background 0.2s ease, border-color 0.2s ease;
}

.staff-row:last-child {
    border-bottom: 0;
}

.staff-row input {
    accent-color: #ff6b35;
}

.staff-row.selected {
    background: #fff7f2;
}

.staff-row .bi {
    color: #ff6b35;
}

.staff-main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-width: 0;
}

.staff-main strong {
    overflow: hidden;
    color: #26211f;
    font-size: 0.95rem;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.staff-main span {
    color: #75665f;
    flex: 0 0 auto;
    font-size: 0.84rem;
}

.session-panel {
    margin-top: 2px;
}

.filter-bar {
    display: grid;
    grid-template-columns: minmax(220px, 1.3fr) repeat(2, minmax(180px, 1fr)) auto;
    align-items: end;
    gap: 12px;
    margin-top: 14px;
}

.filter-field-wide {
    min-width: 0;
}

.filter-actions {
    display: flex;
    justify-content: flex-end;
}

.table-wrap {
    border: 1px solid #f3e9e5;
    border-radius: 10px;
    margin-top: 14px;
    overflow: hidden;
}

.empty-assignment {
    border: 1px dashed #e7d8d0;
    border-radius: 10px;
    color: #7a6b65;
    padding: 16px;
    text-align: center;
}

@media (max-width: 1100px) {
    .workflow-grid,
    .schedule-stats {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .shift-schedule-page {
        padding: 12px;
    }

    .schedule-hero,
    .hero-tools,
    .assign-head,
    .section-title {
        align-items: stretch;
        flex-direction: column;
    }

    .date-field .form-control,
    .hero-tools .btn {
        width: 100%;
    }

    .slot-buttons,
    .create-row,
    .filter-bar {
        grid-template-columns: 1fr;
    }

    .assignment-actions,
    .filter-actions {
        justify-content: stretch;
    }

    .staff-toolbar {
        grid-template-columns: 1fr;
    }

    .staff-toolbar-actions {
        justify-content: stretch;
    }

    .assignment-actions .btn,
    .filter-actions .btn,
    .create-row .btn,
    .staff-toolbar-actions .btn {
        width: 100%;
    }

    .staff-main {
        align-items: flex-start;
        flex-direction: column;
        gap: 2px;
    }
}
</style>
