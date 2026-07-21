<template>
    <div class="shift-registration-page">
        <section class="shift-registration-header">
            <div>
                <p class="section-kicker mb-1">Chọn ca làm</p>
                <h5 class="mb-1">Đăng ký ca đã được mở</h5>
                <p class="section-subtitle mb-0">Chọn ngày làm việc và đăng ký ca còn chỗ.</p>
            </div>
            <div class="shift-date-tools">
                <input v-model="selectedDate" type="date" class="form-control" />
                <button class="btn btn-primary" @click="loadShiftRegistration" :disabled="loading">
                    <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
                    Tải lại
                </button>
            </div>
        </section>

        <section class="shift-register-panel">
            <div class="detail-head">
                <div>
                    <p class="section-kicker mb-1">Ca trong ngày</p>
                    <h6 class="mb-0">{{ displayDate }}</h6>
                </div>
                <span class="staff-pill">{{ registeredShiftsToday }}/{{ maxShiftsPerDay }} ca đã đăng ký</span>
            </div>

            <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>
            <div v-if="registrationLimitReached" class="limit-note">
                Bạn đã đăng ký đủ 2 ca trong ngày này.
            </div>

            <div class="registration-grid">
                <article
                    v-for="slot in registrationSlots"
                    :key="slot.shiftSlot"
                    class="registration-card"
                    :class="slotCardClass(slot)"
                >
                    <div class="registration-card-top">
                        <div class="registration-card-main">
                            <div class="registration-icon">
                                <i :class="slot.registeredByCurrentStaff ? 'bi bi-check2' : 'bi bi-calendar2-week'"></i>
                            </div>
                            <div class="registration-info">
                                <strong>{{ slot.shiftLabel }}</strong>
                            </div>
                        </div>
                        <span class="slot-status">{{ slotStatusText(slot) }}</span>
                    </div>

                    <div class="slot-meter">
                        <span :style="{ width: slotFillWidth(slot) }"></span>
                    </div>

                    <div class="registration-footer">
                        <p class="mb-0 text-secondary small">
                            {{ slot.registeredCount || 0 }}/{{ slot.maxStaff || 0 }} nhân viên
                        </p>
                        <button
                            class="btn btn-sm"
                            :class="slot.registeredByCurrentStaff ? 'btn-outline-success' : 'btn-outline-primary'"
                            :disabled="!!loadingAction || !canRegisterSlot(slot)"
                            @click="registerShift(slot)"
                        >
                            <span v-if="isRegisteringSlot(slot)" class="spinner-border spinner-border-sm me-1"></span>
                            <i
                                v-else
                                :class="slot.registeredByCurrentStaff ? 'bi bi-check2-circle me-1' : 'bi bi-plus-circle me-1'"
                            ></i>
                            {{ slotButtonText(slot) }}
                        </button>
                    </div>
                </article>

                <div v-if="!loading && !registrationSlots.length" class="empty-registration">
                    Chưa có ca nào được admin mở đăng ký trong ngày này.
                </div>
                <div v-if="loading" class="empty-registration">Đang tải ca làm...</div>
            </div>
        </section>
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import api from "@/api";
import { showCinemaAlert } from "@/utils/cinemaAlert";

const selectedDate = ref(formatDateInput(new Date()));
const registrationSlots = ref([]);
const loading = ref(false);
const loadingAction = ref("");
const error = ref("");
const maxShiftsPerDay = 2;

const displayDate = computed(() => {
    if (!selectedDate.value) return "Hôm nay";
    return new Date(`${selectedDate.value}T00:00:00`).toLocaleDateString("vi-VN");
});
const registeredShiftsToday = computed(
    () => registrationSlots.value.filter((slot) => slot.registeredByCurrentStaff).length
);
const registrationLimitReached = computed(() => registeredShiftsToday.value >= maxShiftsPerDay);

function formatDateInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function canRegisterSlot(slot) {
    return !!slot && !registrationLimitReached.value && !slot.registeredByCurrentStaff && Number(slot.remainingSlots || 0) > 0;
}

function isRegisteringSlot(slot) {
    return !!slot?.shiftSlot && loadingAction.value === `register-${slot.shiftSlot}`;
}

function slotButtonText(slot) {
    if (isRegisteringSlot(slot)) return "Đang lưu";
    if (slot?.registeredByCurrentStaff) return "Đã đăng ký";
    if (registrationLimitReached.value) return "Đã đủ 2 ca";
    if (Number(slot?.remainingSlots || 0) <= 0) return "Đã đủ";
    return "Đăng ký";
}

function slotStatusText(slot) {
    if (slot?.registeredByCurrentStaff) return "Ca của bạn";
    if (registrationLimitReached.value) return "Giới hạn 2 ca";
    const remaining = Number(slot?.remainingSlots || 0);
    if (remaining <= 0) return "Đã đủ người";
    return `Còn ${remaining} chỗ`;
}

function slotCardClass(slot) {
    if (slot?.registeredByCurrentStaff) return "registered";
    if (registrationLimitReached.value) return "locked";
    if (Number(slot?.remainingSlots || 0) <= 0) return "full";
    return "available";
}

function slotFillWidth(slot) {
    const maxStaff = Math.max(1, Number(slot?.maxStaff || 0));
    const registered = Math.min(maxStaff, Number(slot?.registeredCount || 0));
    return `${Math.round((registered / maxStaff) * 100)}%`;
}

async function registerShift(slot) {
    if (!slot?.shiftSlot) return;
    loadingAction.value = `register-${slot.shiftSlot}`;
    error.value = "";
    try {
        await api.post("/staff/reports/shift/register", {
            workDate: selectedDate.value,
            shiftSlot: slot.shiftSlot,
        });
        await loadShiftRegistration();
        await showCinemaAlert({
            icon: "success",
            title: "Đã đăng ký ca",
            text: slot.shiftLabel || "Ca làm đã được lưu.",
        });
    } catch (err) {
        await showCinemaAlert({
            icon: "error",
            title: "Không thể đăng ký ca",
            text: err?.response?.data?.error || "Vui lòng thử lại.",
        });
    } finally {
        loadingAction.value = "";
    }
}

async function loadShiftRegistration() {
    loading.value = true;
    error.value = "";
    try {
        const res = await api.get(`/staff/reports/shift-registration?date=${selectedDate.value}`);
        registrationSlots.value = res.data?.slots || [];
    } catch (err) {
        registrationSlots.value = [];
        error.value = err?.response?.data?.error || "Không thể tải danh sách ca.";
    } finally {
        loading.value = false;
    }
}

onMounted(loadShiftRegistration);
</script>

<style scoped>
.shift-registration-page {
    min-height: 100%;
    padding: 1rem;
    color: var(--text-primary);
    background: #fff;
}

.shift-registration-header,
.shift-register-panel {
    border: 1px solid #efe2db;
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.05);
}

.shift-registration-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem 1.15rem;
    background: #fffdfb;
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
    min-width: 220px;
    height: 42px;
}

.shift-date-tools .btn {
    min-width: 96px;
    height: 42px;
    white-space: nowrap;
}

.shift-register-panel {
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

.registration-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(285px, 1fr));
    gap: 0.85rem;
}

.registration-card {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-height: 132px;
    border: 1px solid #f3dfd8;
    border-radius: 12px;
    background: #fff;
    padding: 0.95rem;
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

.registration-card.locked {
    border-color: #e5e0dd;
    background: #fffdfb;
    opacity: 0.82;
}

.registration-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.7rem;
}

.registration-card-main {
    display: flex;
    align-items: center;
    gap: 0.7rem;
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

.registration-card.locked .registration-icon {
    background: #f1eeee;
    color: #8a7f7a;
}

.registration-info {
    min-width: 0;
}

.registration-info strong {
    display: block;
    color: #282320;
    line-height: 1.35;
    white-space: normal;
}

.slot-meter {
    height: 6px;
    width: 100%;
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

.registration-card.locked .slot-meter span {
    background: #b8afaa;
}

.registration-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
}

.registration-footer .btn {
    min-width: 112px;
    min-height: 36px;
    white-space: nowrap;
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

.registration-card.locked .slot-status {
    background: #eeecea;
    color: #746b66;
}

.limit-note {
    border: 1px solid #ffe0d1;
    border-radius: 12px;
    background: #fff7f2;
    color: #a74720;
    font-size: 0.9rem;
    font-weight: 700;
    margin-bottom: 0.85rem;
    padding: 0.7rem 0.85rem;
}

.empty-registration {
    grid-column: 1 / -1;
    border: 1px dashed #e8d8d0;
    border-radius: 12px;
    color: var(--text-secondary);
    padding: 1rem;
    text-align: center;
}

@media (max-width: 767.98px) {
    .shift-registration-page {
        padding: 0.9rem;
    }

    .shift-registration-header,
    .detail-head {
        align-items: flex-start;
        flex-direction: column;
    }

    .shift-date-tools,
    .shift-date-tools .btn {
        width: 100%;
    }

    .shift-date-tools .form-control {
        min-width: 0;
    }

    .registration-card-top,
    .registration-footer {
        align-items: stretch;
        flex-direction: column;
    }

    .slot-status {
        width: fit-content;
    }

    .registration-footer .btn {
        width: 100%;
    }
}
</style>
