<template>
    <div class="container py-4">
        <div class="d-flex justify-content-end align-items-center mb-3">
            <button class="btn btn-primary" @click="openModal()">+ Thêm phòng</button>
        </div>

        <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary"></div>
        </div>

        <div v-else>
            <table class="table table-bordered table-striped align-middle">
                <thead class="table-light">
                    <tr>
                        <th>#</th>
                        <th>Tên phòng</th>
                        <th>Sức chứa</th>
                        <th>Loại phòng</th>
                        <th style="width: 230px">Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(room, i) in rooms" :key="room.roomId">
                        <td>{{ i + 1 }}</td>
                        <td>{{ room.roomName }}</td>
                        <td>{{ room.capacity }}</td>
                        <td>{{ room.roomType }}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary me-2" @click="openSeatMap(room)" title="Sơ đồ ghế">
                                <i class="bi bi-grid-3x3-gap"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-secondary me-2" @click="openModal(room)" title="Sửa phòng">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" @click="deleteRoom(room.roomId)" title="Xóa phòng">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>

            <p v-if="!rooms.length" class="text-center text-muted mt-3">Chưa có phòng nào.</p>
        </div>

        <div class="modal fade" id="roomModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <form @submit.prevent="saveRoom">
                        <div class="modal-header">
                            <h5 class="modal-title">{{ form.roomId ? "Sửa phòng" : "Thêm phòng" }}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Tên phòng</label>
                                <input v-model="form.roomName" class="form-control" required />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Sức chứa</label>
                                <input type="number" v-model="form.capacity" class="form-control" required />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Loại phòng</label>
                                <input v-model="form.roomType" class="form-control" placeholder="2D, 3D, IMAX..." />
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
                            <button type="submit" class="btn btn-primary">Lưu</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <div class="modal fade" id="seatMapModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-xl modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <h5 class="modal-title mb-1">Sơ đồ ghế - {{ selectedRoom?.roomName }}</h5>
                            <small class="text-muted">
                                Đã điền {{ filledSlotCount }} / {{ roomCapacity }} ghế. Khung hiện có {{ layoutSlotCount }} ô.
                            </small>
                        </div>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="seat-toolbar">
                            <div class="seat-controls">
                                <button class="btn btn-sm btn-outline-secondary" type="button" @click="addLayoutRow">
                                    <i class="bi bi-plus-lg me-1"></i>Thêm hàng
                                </button>
                                <button class="btn btn-sm btn-outline-primary" type="button" @click="saveLayout" :disabled="savingLayout">
                                    <span v-if="savingLayout" class="spinner-border spinner-border-sm me-1"></span>
                                    <i v-else class="bi bi-save me-1"></i>Lưu layout
                                </button>
                            </div>
                            <div class="seat-legend">
                                <span><i class="legend-dot empty"></i>Trống</span>
                                <span><i class="legend-dot normal"></i>Thường</span>
                                <span><i class="legend-dot vip"></i>VIP</span>
                                <span><i class="legend-dot sweetbox"></i>Sweetbox</span>
                            </div>
                        </div>

                        <div class="screen-label">Màn hình</div>

                        <div v-if="loadingSeats" class="text-center py-5">
                            <div class="spinner-border text-primary"></div>
                        </div>
                        <div v-else class="seat-layout-wrap">
                            <div class="seat-layout">
                                <template v-for="row in gridCells" :key="row.label">
                                    <div class="row-tools">
                                        <strong>{{ row.label }}</strong>
                                        <input
                                            :value="row.slots"
                                            type="number"
                                            min="1"
                                            max="30"
                                            class="form-control form-control-sm"
                                            @change="updateRowSlots(row.label, $event.target.value)"
                                        />
                                        <select
                                            :value="row.seatType"
                                            class="form-select form-select-sm"
                                            @change="updateRowType(row.label, $event.target.value)"
                                        >
                                            <option value="NORMAL">Thường</option>
                                            <option value="VIP">VIP</option>
                                            <option value="SWEETBOX">Sweetbox</option>
                                        </select>
                                        <button
                                            class="btn btn-sm btn-outline-danger"
                                            type="button"
                                            title="Xóa hàng"
                                            @click="removeLayoutRow(row.label)"
                                        >
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    </div>
                                    <div class="seat-cells" :style="{ '--seat-columns': row.slots }">
                                        <button
                                            v-for="cell in row.cells"
                                            :key="cell.seatNumber"
                                            class="seat-cell"
                                            :class="cell.seat ? seatClass(cell) : emptySeatClass(cell)"
                                            :disabled="isSavingCell(cell)"
                                            @click="handleSeatCellClick(cell)"
                                            :title="cell.seat ? `${cell.seat.seatNumber} - ${formatSeatType(cell.rowSeatType)}` : `${cell.seatNumber} - ${formatSeatType(cell.rowSeatType)}`"
                                        >
                                            <span v-if="isSavingCell(cell)" class="spinner-border spinner-border-sm"></span>
                                            <span v-else-if="cell.seat">{{ cell.seatNumber }}</span>
                                            <i v-else class="bi bi-plus-lg"></i>
                                        </button>
                                    </div>
                                </template>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal fade" id="seatFormModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <form @submit.prevent="saveSeat">
                        <div class="modal-header">
                            <h5 class="modal-title">{{ seatForm.seatId ? "Sửa ghế" : "Thêm ghế" }}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Số ghế</label>
                                <input v-model.trim="seatForm.seatNumber" class="form-control" placeholder="VD: A1, B12" required />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Loại ghế</label>
                                <input :value="formatSeatType(seatForm.seatType)" class="form-control" disabled />
                            </div>
                        </div>
                        <div class="modal-footer justify-content-between">
                            <button v-if="seatForm.seatId" type="button" class="btn btn-outline-danger" @click="deleteSeat(seatForm.seatId)">
                                Xóa ghế
                            </button>
                            <div class="ms-auto">
                                <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">Đóng</button>
                                <button type="submit" class="btn btn-primary">Lưu</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import api from "@/api";
import * as bootstrap from "bootstrap";
import { getApiErrorMessage, showCinemaAlert, showCinemaConfirm } from "@/utils/cinemaAlert";

const rooms = ref([]);
const loading = ref(true);
const selectedRoom = ref(null);
const seats = ref([]);
const loadingSeats = ref(false);
const rowConfigs = ref([]);
const savingSeatNumber = ref("");
const savingLayout = ref(false);
const form = reactive({ roomId: null, roomName: "", capacity: "", roomType: "", layoutConfig: "" });
const seatForm = reactive({ seatId: null, seatNumber: "", seatType: "NORMAL" });

let modal = null;
let seatMapModal = null;
let seatFormModal = null;

onMounted(async () => {
    modal = new bootstrap.Modal(document.getElementById("roomModal"));
    seatMapModal = new bootstrap.Modal(document.getElementById("seatMapModal"));
    seatFormModal = new bootstrap.Modal(document.getElementById("seatFormModal"));
    await loadRooms();
});

const seatsByNumber = computed(() => {
    const map = new Map();
    seats.value.forEach((seat) => {
        const range = getSeatRange(seat.seatNumber);
        for (let column = range.start; column <= range.end; column += 1) {
            map.set(`${range.row}${column}`, seat);
        }
    });
    return map;
});

const roomCapacity = computed(() => Number(selectedRoom.value?.capacity) || 0);

const layoutSlotCount = computed(() => rowConfigs.value.reduce((sum, row) => sum + row.slots, 0));

const filledSlotCount = computed(() => {
    return seats.value.reduce((sum, seat) => {
        const range = getSeatRange(seat.seatNumber);
        return sum + Math.max(1, range.end - range.start + 1);
    }, 0);
});

const gridCells = computed(() => {
    return rowConfigs.value.map((row) => {
        const cells = Array.from({ length: row.slots }, (_, columnIndex) => {
            const column = columnIndex + 1;
            const seatNumber = `${row.label}${column}`;
            const seat = seatsByNumber.value.get(seatNumber);
            return {
                seatNumber,
                rowLabel: row.label,
                column,
                rowSeatType: row.seatType || "NORMAL",
                sweetboxPart: getSweetboxPart(seat, column),
                seat,
            };
        });
        return { ...row, cells };
    });
});

async function loadRooms() {
    try {
        const res = await api.get("/rooms");
        rooms.value = res.data;
    } catch (e) {
        console.error(e);
    } finally {
        loading.value = false;
    }
}

async function loadSeats(roomId) {
    loadingSeats.value = true;
    try {
        const { data } = await api.get(`/seats/room/${roomId}`);
        seats.value = data || [];
        ensureLayoutContainsSeats();
    } catch (e) {
        await showCinemaAlert({ icon: "error", title: "Không thể tải sơ đồ ghế", text: getApiErrorMessage(e) });
    } finally {
        loadingSeats.value = false;
    }
}

function openModal(room = null) {
    if (room) Object.assign(form, room);
    else Object.assign(form, { roomId: null, roomName: "", capacity: "", roomType: "", layoutConfig: "" });
    modal.show();
}

async function saveRoom() {
    try {
        if (form.roomId) await api.put(`/rooms/${form.roomId}`, form);
        else await api.post("/rooms", form);
        await loadRooms();
        modal.hide();
    } catch (e) {
        await showCinemaAlert({ icon: "error", title: "Không thể lưu phòng", text: getApiErrorMessage(e) });
    }
}

async function openSeatMap(room) {
    selectedRoom.value = { ...room };
    seats.value = [];
    rowConfigs.value = getLayoutRows(room);
    seatMapModal.show();
    await loadSeats(room.roomId);
}

function openSeatForm(seat = null, seatNumber = "") {
    if (seat) {
        Object.assign(seatForm, {
            seatId: seat.seatId,
            seatNumber: seat.seatNumber,
            seatType: getRowSeatType(extractSeatRow(seat.seatNumber)),
        });
    } else {
        Object.assign(seatForm, { seatId: null, seatNumber, seatType: getRowSeatType(extractSeatRow(seatNumber)) });
    }
    seatFormModal.show();
}

async function handleSeatCellClick(cell) {
    if (cell.seat) {
        openSeatForm(cell.seat);
        return;
    }
    await createSeatAtCell(cell);
}

async function createSeatAtCell(cell) {
    if (!selectedRoom.value || savingSeatNumber.value) return;
    const seatNumber = getSeatNumberForCell(cell);
    if (!seatNumber) return;

    savingSeatNumber.value = seatNumber;
    try {
        await api.post(`/seats/room/${selectedRoom.value.roomId}`, {
            seatNumber,
            seatType: cell.rowSeatType,
        });
        await loadSeats(selectedRoom.value.roomId);
        await loadRooms();
    } catch (e) {
        await showCinemaAlert({ icon: "error", title: "Không thể thêm ghế", text: getApiErrorMessage(e) });
    } finally {
        savingSeatNumber.value = "";
    }
}

async function saveSeat() {
    try {
        const seatNumber = getSeatNumberForForm();
        if (!seatNumber) return;
        const payload = { seatNumber: seatForm.seatNumber, seatType: seatForm.seatType };
        payload.seatNumber = seatNumber;
        if (seatForm.seatId) await api.put(`/seats/${seatForm.seatId}`, payload);
        else await api.post(`/seats/room/${selectedRoom.value.roomId}`, payload);
        seatFormModal.hide();
        await loadSeats(selectedRoom.value.roomId);
        await loadRooms();
    } catch (e) {
        await showCinemaAlert({ icon: "error", title: "Không thể lưu ghế", text: getApiErrorMessage(e) });
    }
}

async function deleteSeat(seatId) {
    const confirmed = await showCinemaConfirm({
        title: "Xóa ghế",
        text: "Bạn có chắc muốn xóa ghế này khỏi sơ đồ phòng?",
        confirmButtonText: "Xóa",
    });
    if (!confirmed) return;
    try {
        await api.delete(`/seats/${seatId}`);
        seatFormModal.hide();
        await loadSeats(selectedRoom.value.roomId);
        await loadRooms();
    } catch (e) {
        await showCinemaAlert({ icon: "error", title: "Không thể xóa ghế", text: getApiErrorMessage(e) });
    }
}

async function deleteRoom(id) {
    const confirmed = await showCinemaConfirm({
        title: "Xóa phòng chiếu",
        text: "Bạn có chắc muốn xóa phòng này?",
        confirmButtonText: "Xóa",
    });
    if (!confirmed) return;
    try {
        await api.delete(`/rooms/${id}`);
        await loadRooms();
    } catch (e) {
        await showCinemaAlert({ icon: "error", title: "Không thể xóa phòng", text: getApiErrorMessage(e) });
    }
}

async function saveLayout() {
    if (!selectedRoom.value) return;
    savingLayout.value = true;
    try {
        const payload = {
            ...selectedRoom.value,
            layoutConfig: JSON.stringify({ rows: rowConfigs.value }),
        };
        const { data } = await api.put(`/rooms/${selectedRoom.value.roomId}`, payload);
        selectedRoom.value = { ...data };
        await loadRooms();
        await showCinemaAlert({ icon: "success", title: "Đã lưu layout" });
    } catch (e) {
        await showCinemaAlert({ icon: "error", title: "Không thể lưu layout", text: getApiErrorMessage(e) });
    } finally {
        savingLayout.value = false;
    }
}

function addLayoutRow() {
    rowConfigs.value.push({ label: nextAvailableRowLabel(), slots: defaultRowSlots(), seatType: "NORMAL" });
}

async function removeLayoutRow(label) {
    const rowSeats = seats.value.filter((seat) => extractSeatRow(seat.seatNumber) === label);
    if (rowSeats.length) {
        const confirmed = await showCinemaConfirm({
            title: `Xóa hàng ${label}?`,
            text: `Hàng này có ${countSeatSlots(rowSeats)} ghế. Tất cả ghế trong hàng sẽ được xóa mềm.`,
            confirmButtonText: "Xóa hàng",
        });
        if (!confirmed) return;

        try {
            await Promise.all(rowSeats.map((seat) => api.delete(`/seats/${seat.seatId}`)));
            await loadSeats(selectedRoom.value.roomId);
            await loadRooms();
        } catch (e) {
            await showCinemaAlert({ icon: "error", title: "Không thể xóa hàng", text: getApiErrorMessage(e) });
            return;
        }
    }

    rowConfigs.value = rowConfigs.value.filter((row) => row.label !== label);
}

async function updateRowSlots(label, value) {
    const slots = Math.min(30, Math.max(1, Number(value) || 1));
    const overflowSeats = seats.value.filter((seat) => {
        const range = getSeatRange(seat.seatNumber);
        return range.row === label && range.end > slots;
    });

    if (overflowSeats.length) {
        const seatNames = overflowSeats.map((seat) => seat.seatNumber).join(", ");
        const confirmed = await showCinemaConfirm({
            title: "Giảm số ô trong hàng?",
            text: `Các ghế vượt khung sẽ được xóa mềm: ${seatNames}.`,
            confirmButtonText: "Xóa và giảm",
        });
        if (!confirmed) return;

        try {
            await Promise.all(overflowSeats.map((seat) => api.delete(`/seats/${seat.seatId}`)));
            await loadSeats(selectedRoom.value.roomId);
            await loadRooms();
        } catch (e) {
            await showCinemaAlert({ icon: "error", title: "Không thể xóa ghế vượt khung", text: getApiErrorMessage(e) });
            return;
        }
    }

    rowConfigs.value = rowConfigs.value.map((row) => {
        if (row.label !== label) return row;
        return { ...row, slots };
    });
}

async function updateRowType(label, seatType) {
    rowConfigs.value = rowConfigs.value.map((row) => (row.label === label ? { ...row, seatType } : row));

    const rowSeats = seats.value.filter((seat) => extractSeatRow(seat.seatNumber) === label);
    if (!rowSeats.length) return;

    const confirmed = await showCinemaConfirm({
        title: "Đổi loại ghế của cả hàng?",
        text: `Tất cả ghế đang có ở hàng ${label} sẽ chuyển sang ${formatSeatType(seatType)}.`,
        confirmButtonText: "Đổi",
    });
    if (!confirmed) return;

    try {
        await Promise.all(
            rowSeats.map((seat) =>
                api.put(`/seats/${seat.seatId}`, {
                    seatNumber: seat.seatNumber,
                    seatType,
                })
            )
        );
        await loadSeats(selectedRoom.value.roomId);
        await loadRooms();
    } catch (e) {
        await showCinemaAlert({ icon: "error", title: "Không thể đổi loại ghế của hàng", text: getApiErrorMessage(e) });
    }
}

function getLayoutRows(room) {
    const savedRows = parseLayoutRows(room.layoutConfig);
    if (savedRows.length) return savedRows;
    return createRowsFromCapacity(room.capacity);
}

function parseLayoutRows(layoutConfig) {
    if (!layoutConfig) return [];
    try {
        const parsed = JSON.parse(layoutConfig);
        if (!Array.isArray(parsed.rows)) return [];
        return parsed.rows
            .map((row, index) => ({
                label: row.label || rowLabel(index),
                slots: Math.min(30, Math.max(1, Number(row.slots) || defaultRowSlots())),
                seatType: normalizeSeatType(row.seatType),
            }))
            .filter((row) => row.slots > 0);
    } catch {
        return [];
    }
}

function createRowsFromCapacity(capacity) {
    const count = Number(capacity);
    const slotsPerRow = defaultRowSlots();
    if (!Number.isFinite(count) || count <= 0) {
        return Array.from({ length: 10 }, (_, index) => ({ label: rowLabel(index), slots: slotsPerRow, seatType: "NORMAL" }));
    }
    const rows = Math.max(1, Math.ceil(count / slotsPerRow));
    return Array.from({ length: rows }, (_, index) => {
        const remaining = count - index * slotsPerRow;
        return { label: rowLabel(index), slots: Math.min(slotsPerRow, Math.max(1, remaining)), seatType: "NORMAL" };
    });
}

function ensureLayoutContainsSeats() {
    const rows = [...rowConfigs.value];
    seats.value.forEach((seat) => {
        const rowName = extractSeatRow(seat.seatNumber);
        const column = columnFromSeatNumber(seat.seatNumber);
        let row = rows.find((item) => item.label === rowName);
        if (!row) {
            row = { label: rowName, slots: defaultRowSlots(), seatType: seat.seatType || "NORMAL" };
            rows.push(row);
        }
        row.slots = Math.max(row.slots, getSeatRange(seat.seatNumber).end || column);
        row.seatType = inferRowSeatType(row, seat);
    });
    rowConfigs.value = rows.sort((a, b) => rowIndexFromLabel(a.label) - rowIndexFromLabel(b.label));
}

function defaultRowSlots() {
    return 16;
}

function nextAvailableRowLabel() {
    const usedLabels = new Set(rowConfigs.value.map((row) => row.label));
    let index = 0;
    while (usedLabels.has(rowLabel(index))) {
        index += 1;
    }
    return rowLabel(index);
}

function rowLabel(index) {
    let label = "";
    let value = index;
    do {
        label = String.fromCharCode(65 + (value % 26)) + label;
        value = Math.floor(value / 26) - 1;
    } while (value >= 0);
    return label;
}

function extractSeatRow(seatNumber) {
    return String(seatNumber || "").match(/^[A-Z]+/)?.[0] || "A";
}

function rowIndexFromLabel(label) {
    return String(label || "A")
        .split("")
        .reduce((sum, char) => sum * 26 + char.charCodeAt(0) - 64, 0) - 1;
}

function columnFromSeatNumber(seatNumber) {
    return Number(String(seatNumber || "").match(/\d+/)?.[0] || 0);
}

function getRowSeatType(label) {
    return rowConfigs.value.find((row) => row.label === label)?.seatType || "NORMAL";
}

function normalizeSeatType(type) {
    return ["NORMAL", "VIP", "SWEETBOX"].includes(type) ? type : "NORMAL";
}

function inferRowSeatType(row, seat) {
    if (row.seatType && row.seatType !== "NORMAL") return row.seatType;
    return normalizeSeatType(seat.seatType);
}

function getSeatRange(seatNumber) {
    const value = String(seatNumber || "").toUpperCase();
    const match = value.match(/^([A-Z]+)(\d+)(?:-(\d+))?$/);
    if (!match) return { row: extractSeatRow(value), start: columnFromSeatNumber(value), end: columnFromSeatNumber(value) };
    const start = Number(match[2]);
    const end = Number(match[3] || match[2]);
    return { row: match[1], start, end: Math.max(start, end) };
}

function countSeatSlots(list) {
    return list.reduce((sum, seat) => {
        const range = getSeatRange(seat.seatNumber);
        return sum + Math.max(1, range.end - range.start + 1);
    }, 0);
}

function getSeatNumberForCell(cell) {
    if (cell.rowSeatType !== "SWEETBOX") return cell.seatNumber;

    const pairStart = getSweetboxPairStart(cell.column);
    const pairEnd = pairStart + 1;
    const row = rowConfigs.value.find((item) => item.label === cell.rowLabel);
    if (!row || pairEnd > row.slots) {
        showCinemaAlert({ icon: "warning", title: "Sweetbox cần 2 ô liền kề" });
        return "";
    }

    const occupiedSeat = seats.value.find((seat) => {
        const range = getSeatRange(seat.seatNumber);
        return range.row === cell.rowLabel && rangesOverlap(range.start, range.end, pairStart, pairEnd);
    });

    if (occupiedSeat) {
        showCinemaAlert({
            icon: "warning",
            title: "Không thể tạo Sweetbox",
            text: `Cặp ghế ${cell.rowLabel}${pairStart}-${pairEnd} đã có ghế.`,
        });
        return "";
    }

    return `${cell.rowLabel}${pairStart}-${pairEnd}`;
}

function getSeatNumberForForm() {
    const rowType = getRowSeatType(extractSeatRow(seatForm.seatNumber));
    seatForm.seatType = rowType;
    if (rowType !== "SWEETBOX") return seatForm.seatNumber;

    const range = getSeatRange(seatForm.seatNumber);
    if (range.end > range.start) return seatForm.seatNumber;

    const pairStart = getSweetboxPairStart(range.start);
    const pairEnd = pairStart + 1;
    const row = rowConfigs.value.find((item) => item.label === range.row);
    if (!row || pairEnd > row.slots) {
        showCinemaAlert({ icon: "warning", title: "Sweetbox cần 2 ô liền kề" });
        return "";
    }

    const occupiedSeat = seats.value.find((seat) => {
        if (seat.seatId === seatForm.seatId) return false;
        const seatRange = getSeatRange(seat.seatNumber);
        return seatRange.row === range.row && rangesOverlap(seatRange.start, seatRange.end, pairStart, pairEnd);
    });

    if (occupiedSeat) {
        showCinemaAlert({
            icon: "warning",
            title: "Không thể đổi thành Sweetbox",
            text: `Cặp ghế ${range.row}${pairStart}-${pairEnd} đã có ghế.`,
        });
        return "";
    }

    return `${range.row}${pairStart}-${pairEnd}`;
}

function isSavingCell(cell) {
    if (!savingSeatNumber.value) return false;
    const range = getSeatRange(savingSeatNumber.value);
    return range.row === cell.rowLabel && cell.column >= range.start && cell.column <= range.end;
}

function getSweetboxPairStart(column) {
    return column % 2 === 0 ? column - 1 : column;
}

function getSweetboxPart(seat, column) {
    if (!seat || seat.seatType !== "SWEETBOX") return "";
    const range = getSeatRange(seat.seatNumber);
    if (column === range.start) return "sweetbox-start";
    if (column === range.end) return "sweetbox-end";
    return "sweetbox-middle";
}

function rangesOverlap(startA, endA, startB, endB) {
    return startA <= endB && startB <= endA;
}

function formatSeatType(type) {
    if (type === "VIP") return "VIP";
    if (type === "SWEETBOX") return "Sweetbox";
    return "Thường";
}

function seatClass(cell) {
    return {
        normal: cell.rowSeatType === "NORMAL",
        vip: cell.rowSeatType === "VIP",
        sweetbox: cell.rowSeatType === "SWEETBOX",
        "sweetbox-start": cell.sweetboxPart === "sweetbox-start",
        "sweetbox-end": cell.sweetboxPart === "sweetbox-end",
    };
}

function emptySeatClass(cell) {
    return {
        empty: true,
        "empty-normal": cell.rowSeatType === "NORMAL",
        "empty-vip": cell.rowSeatType === "VIP",
        "empty-sweetbox": cell.rowSeatType === "SWEETBOX",
    };
}
</script>

<style scoped>
.table th,
.table td {
    vertical-align: middle;
}

.seat-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 16px;
}

.seat-controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
}

.seat-type-select {
    width: 130px;
}

.seat-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    color: #5f5651;
    font-size: 14px;
}

.seat-legend span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.legend-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    display: inline-block;
}

.legend-dot.empty {
    background: #fff;
    border: 1px dashed #adb5bd;
}

.legend-dot.normal {
    background: #e9f1ff;
    border: 1px solid #8eb8ff;
}

.legend-dot.vip {
    background: #fff3cd;
    border: 1px solid #ffc107;
}

.legend-dot.sweetbox {
    background: #f8d7da;
    border: 1px solid #dc3545;
}

.screen-label {
    width: min(560px, 90%);
    margin: 0 auto 24px;
    border-radius: 0 0 24px 24px;
    padding: 8px;
    background: #2f353a;
    color: #fff;
    text-align: center;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.seat-layout-wrap {
    overflow-x: auto;
    padding-bottom: 8px;
}

.seat-layout {
    display: grid;
    grid-template-columns: 240px minmax(max-content, 1fr);
    gap: 8px 10px;
    min-width: max-content;
}

.row-tools {
    display: grid;
    grid-template-columns: 28px 58px 112px 32px;
    align-items: center;
    gap: 4px;
    color: #6c757d;
    width: 240px;
}

.row-tools input {
    height: 32px;
    padding: 4px 6px;
}

.row-tools select {
    height: 32px;
    padding: 4px 28px 4px 8px;
}

.seat-cells {
    display: grid;
    grid-template-columns: repeat(var(--seat-columns), 48px);
    gap: 8px;
}

.seat-cell {
    position: relative;
    width: 48px;
    height: 38px;
    border-radius: 8px;
    border: 1px solid #ced4da;
    padding: 0 4px;
    font-weight: 700;
    color: #30363a;
    transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}

.seat-cell > span,
.seat-cell > i {
    position: relative;
    z-index: 1;
}

.seat-cell:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.seat-cell.empty {
    background: #fff;
    border-style: dashed;
    color: #8a949e;
}

.seat-cell.empty:hover:not(:disabled) {
    border-color: #0d6efd;
    color: #0d6efd;
}

.seat-cell.normal {
    background: #e9f1ff;
    border-color: #8eb8ff;
}

.seat-cell.vip {
    background: #fff3cd;
    border-color: #ffc107;
}

.seat-cell.sweetbox {
    background: #f8d7da;
    border-color: #dc3545;
}

@media (max-width: 576px) {
    .seat-toolbar {
        align-items: stretch;
        flex-direction: column;
    }
}
</style>
