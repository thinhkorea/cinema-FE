<template>
    <div class="shift-summary-grid">
        <div class="summary-card" style="border-left-color: #ff8758">
            <div class="summary-title">Tổng doanh thu ca</div>
            <div class="summary-value">{{ formatCurrency(totalRevenue) }}</div>
        </div>
        <div class="summary-card" style="border-left-color: #5bc4a5">
            <div class="summary-title">Tiền vé nhân viên bán</div>
            <div class="summary-value">{{ formatCurrency(ticketRevenue) }}</div>
        </div>
        <div class="summary-card" style="border-left-color: #5b8def">
            <div class="summary-title">Phụ phí bắp nước</div>
            <div class="summary-value">{{ formatCurrency(popcornRevenue) }}</div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    totalRevenue: {
        type: Number,
        default: 0,
    },
    ticketRevenue: {
        type: Number,
        default: 0,
    },
    popcornRevenue: {
        type: Number,
        default: 0,
    },
    formatCurrency: {
        type: Function,
        required: true,
    },
});
</script>

<style scoped>
.shift-summary-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
}

.summary-card {
    border: 1px solid #eee;
    border-left-width: 4px;
    border-radius: 8px;
    padding: 12px 14px;
    background: #fff;
}

.summary-title {
    color: #6a6663;
    font-size: 13px;
    margin-bottom: 6px;
}

.summary-value {
    font-size: 28px;
    font-weight: 700;
    line-height: 1;
}

@media (max-width: 576px) {
    .shift-summary-grid {
        grid-template-columns: 1fr;
    }
}
</style>
