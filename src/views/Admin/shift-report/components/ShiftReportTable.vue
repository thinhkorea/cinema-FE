<template>
    <div class="table-responsive">
        <table class="table align-middle mb-0">
            <thead>
                <tr>
                    <th>Ca</th>
                    <th>Nhân viên</th>
                    <th>Vé tiền mặt</th>
                    <th>Vé VNPay</th>
                    <th>Phụ phí tiền mặt</th>
                    <th>Phụ phí VNPay</th>
                    <th>Phụ phí chuyển khoản</th>
                    <th>Tổng</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="row in rows" :key="`${row.shiftKey}-${row.staffName}`">
                    <td>
                        <div class="fw-semibold">{{ row.shiftLabel }}</div>
                        <small class="text-muted">{{ row.timeRange }}</small>
                    </td>
                    <td>{{ row.staffName }}</td>
                    <td>{{ formatCurrency(row.ticketCashRevenue) }}</td>
                    <td>{{ formatCurrency(row.ticketVnpayRevenue) }}</td>
                    <td>{{ formatCurrency(row.popcornCashRevenue) }}</td>
                    <td>{{ formatCurrency(row.popcornVnpayRevenue) }}</td>
                    <td>{{ formatCurrency(row.popcornBankRevenue) }}</td>
                    <td class="fw-bold text-primary">{{ formatCurrency(row.totalRevenue) }}</td>
                </tr>
                <tr v-if="!loading && !rows.length">
                    <td colspan="8" class="text-center text-muted py-4">
                        Chưa có doanh thu ca trong ngày đã chọn.
                    </td>
                </tr>
                <tr v-if="loading">
                    <td colspan="8" class="text-center text-muted py-4">Đang tải báo cáo ca...</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script setup>
defineProps({
    rows: {
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
});
</script>
