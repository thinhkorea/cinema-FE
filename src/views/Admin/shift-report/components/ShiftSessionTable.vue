<template>
    <div class="table-responsive">
        <table class="table align-middle mb-0">
            <thead>
                <tr>
                    <th>Nhân viên</th>
                    <th>Trạng thái</th>
                    <th>Vào ca</th>
                    <th>Thời lượng</th>
                    <th>Kết ca</th>
                    <th>Tiền mặt dự kiến</th>
                    <th>Tiền mặt thực tế</th>
                    <th>Chênh lệch</th>
                    <th>Ghi chú</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="shift in shifts" :key="shift.shiftId">
                    <td>{{ shift.staffName || "Không xác định" }}</td>
                    <td>
                        <span class="badge" :class="shift.status === 'CLOSED' ? 'bg-success' : 'bg-primary'">
                            {{ formatStatus(shift.status) }}
                        </span>
                    </td>
                    <td>{{ formatDateTime(shift.openedAt) }}</td>
                    <td>{{ formatDuration(shift) }}</td>
                    <td>{{ formatDateTime(shift.closedAt) }}</td>
                    <td>{{ formatCurrency(shift.expectedCash) }}</td>
                    <td>{{ formatCurrency(shift.actualCash) }}</td>
                    <td :class="Number(shift.cashDifference || 0) < 0 ? 'text-danger' : 'text-success'">
                        {{ formatCurrency(shift.cashDifference) }}
                    </td>
                    <td>{{ shift.note || "-" }}</td>
                </tr>
                <tr v-if="!loading && !shifts.length">
                    <td colspan="9" class="text-center text-muted py-4">Chưa có ca làm trong ngày đã chọn.</td>
                </tr>
                <tr v-if="loading">
                    <td colspan="9" class="text-center text-muted py-4">Đang tải ca làm...</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script setup>
defineProps({
    shifts: {
        type: Array,
        default: () => [],
    },
    loading: {
        type: Boolean,
        default: false,
    },
    formatCurrency: {
        type: Function,
        required: true,
    },
    formatDateTime: {
        type: Function,
        required: true,
    },
});

const formatStatus = (status) => {
    if (status === "CLOSED") return "Đã kết ca";
    if (status === "OPEN") return "Đang trong ca";
    return status || "-";
};

const formatDuration = (shift) => {
    if (!shift?.closedAt) return "-";
    let totalSeconds = Number(shift.durationSeconds);
    if (!Number.isFinite(totalSeconds) && shift.openedAt) {
        totalSeconds = Math.max(0, Math.floor((new Date(shift.closedAt) - new Date(shift.openedAt)) / 1000));
    }
    if (!Number.isFinite(totalSeconds)) return "-";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    if (hours > 0) return minutes > 0 ? `${hours} giờ ${minutes} phút` : `${hours} giờ`;
    if (minutes > 0) return seconds > 0 ? `${minutes} phút ${seconds} giây` : `${minutes} phút`;
    return `${seconds} giây`;
};
</script>
