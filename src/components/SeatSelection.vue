<template>
  <div class="container py-4">
    <h5 class="mb-3">🪑 Sơ đồ ghế cho suất chiếu {{ showtimeId }}</h5>

    <div v-if="loading" class="text-muted">Đang tải danh sách ghế...</div>

    <div v-else class="seat-map">
      <div v-for="row in seatRows" :key="row.letter" class="seat-row">
        <div class="row-label">{{ row.letter }}</div>
        <div class="seats">
          <div
            v-for="seat in row.seats"
            :key="seat.seatId"
            class="seat"
            :class="{
              booked: seat.booked,
              selected: selectedSeats.includes(seat.seatId)
            }"
            @click="toggleSeat(seat)"
          >
            {{ seat.seatNumber }}
          </div>
        </div>
      </div>
    </div>

    <div class="mt-4">
      <strong>Ghế đã chọn:</strong>
      <span v-if="selectedSeats.length === 0">Chưa chọn</span>
      <span v-else>{{ selectedSeats.join(', ') }}</span>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  props: {
    showtimeId: { type: Number, required: true },
  },
  data() {
    return {
      seats: [],
      seatRows: [],
      selectedSeats: [],
      loading: false,
    };
  },
  watch: {
    showtimeId: {
      immediate: true,
      handler(newVal) {
        if (newVal) this.loadSeats();
      },
    },
  },
  methods: {
    async loadSeats() {
      this.loading = true;
      try {
        const res = await axios.get(`/api/staff/showtimes/${this.showtimeId}/seats`);
        this.seats = res.data;
        this.groupSeatsByRow();
      } catch (err) {
        console.error("Lỗi tải ghế:", err);
      } finally {
        this.loading = false;
      }
    },
    groupSeatsByRow() {
      const grouped = {};
      this.seats.forEach((seat) => {
        const rowLetter = seat.seatNumber.charAt(0);
        if (!grouped[rowLetter]) grouped[rowLetter] = [];
        grouped[rowLetter].push(seat);
      });

      this.seatRows = Object.keys(grouped)
        .sort()
        .map((letter) => ({
          letter,
          seats: grouped[letter].sort(
            (a, b) => parseInt(a.seatNumber.slice(1)) - parseInt(b.seatNumber.slice(1))
          ),
        }));
    },
    toggleSeat(seat) {
      if (seat.booked) return;
      const idx = this.selectedSeats.indexOf(seat.seatNumber);
      if (idx >= 0) this.selectedSeats.splice(idx, 1);
      else this.selectedSeats.push(seat.seatNumber);
    },
  },
};
</script>

<style scoped>
.seat-map {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}
.seat-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.row-label {
  width: 20px;
  font-weight: bold;
}
.seats {
  display: grid;
  grid-template-columns: repeat(10, 40px);
  gap: 8px;
}
.seat {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: 600;
  transition: 0.2s;
}
.seat:hover {
  background: #cbd5e1;
}
.seat.booked {
  background: #ef4444;
  color: white;
  cursor: not-allowed;
}
.seat.selected {
  background: #3b82f6;
  color: white;
}
</style>
