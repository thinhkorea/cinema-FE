<template>
    <div class="admin-pagination">
        <div class="admin-pagination__summary">
            Hiển thị {{ startItem }}-{{ endItem }} / {{ totalItems }} {{ itemLabel }}
        </div>

        <div class="admin-pagination__controls">
            <label v-if="showPageSize" class="admin-pagination__page-size">
                <span>Mỗi trang</span>
                <select class="form-select form-select-sm" :value="pageSize" @change="updatePageSize">
                    <option v-for="size in pageSizeOptions" :key="size" :value="size">
                        {{ size }}
                    </option>
                </select>
            </label>

            <nav v-if="totalPages > 1" :aria-label="ariaLabel">
                <ul class="pagination pagination-sm mb-0">
                    <li class="page-item" :class="{ disabled: currentPage === 1 }">
                        <button
                            class="page-link"
                            type="button"
                            :disabled="currentPage === 1"
                            @click="goToPage(currentPage - 1)"
                        >
                            Trước
                        </button>
                    </li>

                    <li
                        v-for="page in visiblePages"
                        :key="page"
                        class="page-item"
                        :class="{ active: page === currentPage }"
                    >
                        <button class="page-link" type="button" @click="goToPage(page)">
                            {{ page }}
                        </button>
                    </li>

                    <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                        <button
                            class="page-link"
                            type="button"
                            :disabled="currentPage === totalPages"
                            @click="goToPage(currentPage + 1)"
                        >
                            Sau
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
    modelValue: {
        type: Number,
        default: 1,
    },
    totalItems: {
        type: Number,
        required: true,
    },
    pageSize: {
        type: Number,
        required: true,
    },
    pageSizeOptions: {
        type: Array,
        default: () => [5, 10, 20, 50],
    },
    itemLabel: {
        type: String,
        default: "bản ghi",
    },
    ariaLabel: {
        type: String,
        default: "Phân trang",
    },
    maxVisiblePages: {
        type: Number,
        default: 5,
    },
    showPageSize: {
        type: Boolean,
        default: true,
    },
});

const emit = defineEmits(["update:modelValue", "update:pageSize"]);

const totalPages = computed(() => Math.max(1, Math.ceil(props.totalItems / props.pageSize)));
const currentPage = computed(() => Math.min(Math.max(props.modelValue, 1), totalPages.value));
const startItem = computed(() => (props.totalItems ? (currentPage.value - 1) * props.pageSize + 1 : 0));
const endItem = computed(() => Math.min(currentPage.value * props.pageSize, props.totalItems));

const visiblePages = computed(() => {
    const pages = [];
    let start = Math.max(1, currentPage.value - Math.floor(props.maxVisiblePages / 2));
    const end = Math.min(totalPages.value, start + props.maxVisiblePages - 1);
    start = Math.max(1, end - props.maxVisiblePages + 1);

    for (let page = start; page <= end; page += 1) {
        pages.push(page);
    }
    return pages;
});

const goToPage = (page) => {
    emit("update:modelValue", Math.min(Math.max(page, 1), totalPages.value));
};

const updatePageSize = (event) => {
    emit("update:pageSize", Number(event.target.value));
    emit("update:modelValue", 1);
};
</script>

<style scoped>
.admin-pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    margin-top: 1rem;
}

.admin-pagination__summary,
.admin-pagination__page-size {
    color: #6c757d;
    font-size: 0.875rem;
}

.admin-pagination__controls,
.admin-pagination__page-size {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.admin-pagination__page-size {
    margin-bottom: 0;
}

.admin-pagination__page-size .form-select {
    width: 82px;
}

:deep(.page-link) {
    min-width: 34px;
    text-align: center;
}

@media (max-width: 576px) {
    .admin-pagination {
        align-items: stretch;
    }

    .admin-pagination__controls {
        justify-content: space-between;
        width: 100%;
    }
}
</style>
