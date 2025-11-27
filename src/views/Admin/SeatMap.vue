<template>
    <div class="container py-4 text-center">
        <h4 class="mb-4">Sơ đồ ghế - Phòng 1 (Demo)</h4>

        <!-- Màn hình -->
        <div class="screen mb-4">MÀN HÌNH</div>

        <!-- Sơ đồ ghế -->
        <div v-for="row in groupedSeats" :key="row.label" class="seat-row mb-2 d-flex justify-content-center">
            <div
                v-for="seat in row.seats"
                :key="seat.id"
                class="seat"
                :class="{
                    booked: seat.status === 'BOOKED',
                    selected: selectedSeats.includes(seat.id),
                }"
                @click="toggleSeat(seat)"
            >
                {{ seat.label }}
            </div>
        </div>

        <!-- Ghi chú -->
        <div class="legend mt-4 d-flex justify-content-center gap-4">
            <div><span class="seat"></span> Trống</div>
            <div><span class="seat selected"></span> Đang chọn</div>
            <div><span class="seat booked"></span> Đã đặt</div>
        </div>

        <!-- Danh sách ghế chọn -->
        <div v-if="selectedSeats.length" class="alert alert-info mt-4">
            Đã chọn: <strong>{{ selectedSeatLabels.join(", ") }}</strong>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from "vue";

// Dữ liệu giả lập
const seats = ref([
    { id: 1, label: "A1", row: "A", status: "AVAILABLE" },
    { id: 2, label: "A2", row: "A", status: "BOOKED" },
    { id: 3, label: "A3", row: "A", status: "AVAILABLE" },
    { id: 4, label: "A4", row: "A", status: "AVAILABLE" },
    { id: 5, label: "B1", row: "B", status: "AVAILABLE" },
    { id: 6, label: "B2", row: "B", status: "AVAILABLE" },
    { id: 7, label: "B3", row: "B", status: "BOOKED" },
    { id: 8, label: "B4", row: "B", status: "AVAILABLE" },
    { id: 9, label: "C1", row: "C", status: "AVAILABLE" },
    { id: 10, label: "C2", row: "C", status: "AVAILABLE" },
    { id: 11, label: "C3", row: "C", status: "AVAILABLE" },
    { id: 12, label: "C4", row: "C", status: "BOOKED" },
]);

const selectedSeats = ref([]);

// Gom ghế theo hàng
const groupedSeats = computed(() => {
    const grouped = {};
    for (const seat of seats.value) {
        if (!grouped[seat.row]) grouped[seat.row] = { label: seat.row, seats: [] };
        grouped[seat.row].seats.push(seat);
    }
    return Object.values(grouped);
});

// Chọn ghế
function toggleSeat(seat) {
    if (seat.status === "BOOKED") return; // Không cho chọn
    if (selectedSeats.value.includes(seat.id)) {
        selectedSeats.value = selectedSeats.value.filter((id) => id !== seat.id);
    } else {
        selectedSeats.value.push(seat.id);
    }
}

const selectedSeatLabels = computed(() =>
    seats.value.filter((s) => selectedSeats.value.includes(s.id)).map((s) => s.label)
);
</script>

<style scoped>
.container {
    max-width: 600px;
}

.screen {
    background-color: #222;
    color: white;
    font-weight: bold;
    padding: 8px;
    border-radius: 6px;
    text-align: center;
    margin-bottom: 24px;
    letter-spacing: 2px;
}

.seat {
    width: 40px;
    height: 40px;
    margin: 4px;
    border-radius: 6px;
    background-color: #e0e0e0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: 0.2s;
    font-weight: 500;
}

.seat:hover {
    background-color: #cfcfcf;
}

.seat.selected {
    background-color: #007bff;
    color: #fff;
}

.seat.booked {
    background-color: #dc3545;
    color: #fff;
    cursor: not-allowed;
}

.legend .seat {
    display: inline-block;
    width: 24px;
    height: 24px;
    margin-right: 6px;
    vertical-align: middle;
}
</style>
