<template>
    <div class="table-responsive">
        <table class="table align-middle mb-0">
            <thead>
                <tr>
                    <th>Ca</th>
                    <th>Nhân viên</th>
                    <th>Trạng thái</th>
                    <th>Giờ chuẩn</th>
                    <th>Vào ca</th>
                    <th>Kết ca</th>
                    <th>Số giờ làm</th>
                    <th>Đi muộn</th>
                    <th>Về sớm</th>
                    <th>Tăng ca</th>
                    <th>Chênh lệch</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="shift in shifts" :key="shift.shiftId">
                    <td>{{ shift.shiftLabel || "-" }}</td>
                    <td>{{ shift.staffName || "Không xác định" }}</td>
                    <td>
                        <span class="badge" :class="badgeClass(shift.status)">
                            {{ formatStatus(shift.status) }}
                        </span>
                    </td>
                    <td>{{ formatTimeRange(shift.scheduledStart, shift.scheduledEnd) }}</td>
                    <td>{{ formatDateTime(shift.openedAt) }}</td>
                    <td>{{ formatDateTime(shift.closedAt) }}</td>
                    <td>{{ formatDuration(shift.durationSeconds) }}</td>
                    <td>{{ formatMinutes(shift.lateMinutes) }}</td>
                    <td>{{ formatMinutes(shift.earlyLeaveMinutes) }}</td>
                    <td>{{ formatMinutes(shift.overtimeMinutes) }}</td>
                    <td :class="Number(shift.cashDifference || 0) < 0 ? 'text-danger' : 'text-success'">
                        {{ formatCurrency(shift.cashDifference) }}
                    </td>
                </tr>
                <tr v-if="!loading && !shifts.length">
                    <td colspan="11" class="text-center text-muted py-4">Chưa có ca làm trong ngày đã chọn.</td>
                </tr>
                <tr v-if="loading">
                    <td colspan="11" class="text-center text-muted py-4">Đang tải ca làm...</td>
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
    if (status === "ASSIGNED") return "Đã xếp ca";
    if (status === "OPEN") return "Đang trong ca";
    if (status === "CLOSED") return "Đã kết ca";
    return "Chưa hoàn tất";
};

const badgeClass = (status) => {
    if (status === "ASSIGNED") return "bg-secondary";
    if (status === "OPEN") return "bg-primary";
    if (status === "CLOSED") return "bg-success";
    return "bg-dark";
};

const formatMinutes = (value) => {
    const minutes = Number(value || 0);
    return minutes > 0 ? `${minutes} phút` : "-";
};

const formatDuration = (value) => {
    const totalSeconds = Number(value || 0);
    if (!totalSeconds) return "-";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) return minutes > 0 ? `${hours} giờ ${minutes} phút` : `${hours} giờ`;
    return `${minutes} phút`;
};

const formatTimeRange = (startValue, endValue) => {
    if (!startValue || !endValue) return "-";
    const start = new Date(startValue);
    const end = new Date(endValue);
    const startText = start.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    const endText = end.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    return `${startText} - ${endText}`;
};
</script>
