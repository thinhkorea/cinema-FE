<template>
    <div class="recipes-page p-3 p-md-4">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <div>
                <h5 class="mb-1">Công thức nấu bắp</h5>
                <p class="text-muted mb-0">Nhân viên xem định mức nguyên liệu và hướng dẫn chế biến dạng tài liệu.</p>
            </div>
            <button class="btn btn-outline-primary" :disabled="loading" @click="loadSnacks">
                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                Tải lại
            </button>
        </div>

        <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary"></div>
            <p class="text-muted mt-2 mb-0">Đang tải công thức...</p>
        </div>

        <div v-else-if="loadError" class="alert alert-danger mb-0">
            {{ loadError }}
        </div>

        <div v-else class="row g-3">
            <div class="col-12 col-lg-4">
                <div class="panel h-100">
                    <div class="panel-head">
                        <h6 class="mb-0">Món bắp</h6>
                    </div>

                    <div v-if="popcornSnacks.length" class="snack-list mt-3">
                        <button
                            v-for="snack in popcornSnacks"
                            :key="snack.snackId"
                            class="snack-item"
                            :class="{ active: selectedSnackId === snack.snackId }"
                            @click="selectSnack(snack.snackId)"
                        >
                            <span class="snack-name">{{ snack.snackName }}</span>
                            <span class="snack-status" :class="snack.available ? 'available' : 'hidden'">
                                {{ snack.available ? "Đang bán" : "Không bán online" }}
                            </span>
                        </button>
                    </div>

                    <div v-else class="text-muted mt-3">Chưa có món bắp nào để hiển thị công thức.</div>
                </div>
            </div>

            <div class="col-12 col-lg-8">
                <div class="panel h-100">
                    <div class="panel-head d-flex justify-content-between align-items-center gap-2">
                        <div>
                            <h6 class="mb-0">{{ selectedSnack?.snackName || "Chọn món bắp" }}</h6>
                            <small class="text-muted">Tài liệu công thức</small>
                        </div>
                        <span v-if="loadingRecipe" class="spinner-border spinner-border-sm text-primary"></span>
                    </div>

                    <div v-if="selectedSnack" class="mt-3">
                        <article class="recipe-doc">
                            <header class="recipe-doc-header">
                                <p class="recipe-doc-kicker">Tài liệu chế biến</p>
                                <h3>{{ selectedSnack.snackName }}</h3>
                                <p>Định mức áp dụng cho 1 sản phẩm.</p>
                            </header>

                            <section class="recipe-doc-section">
                                <h6>Nguyên liệu cần chuẩn bị</h6>
                                <div v-if="recipeRows.length" class="ingredient-doc-text">
                                    <p v-for="row in recipeRows" :key="row.recipeItemId || row.ingredientId">
                                        <strong>{{ row.ingredientName }}</strong>
                                        dùng
                                        <strong>{{ formatQty(row.quantityPerSnack) }} {{ row.unit || "" }}</strong>
                                        cho mỗi phần.
                                    </p>
                                </div>
                                <p v-else class="text-muted mb-0">Món này chưa có định mức nguyên liệu.</p>
                            </section>

                            <section class="recipe-doc-section">
                                <h6>Hướng dẫn / ghi chú chế biến</h6>
                                <div
                                    v-if="recipeInstructions.trim()"
                                    class="instructions-preview"
                                    v-html="renderedInstructionsHtml"
                                ></div>
                                <div v-else class="instructions-preview text-muted">
                                    Chưa có hướng dẫn chế biến cho món này.
                                </div>
                            </section>
                        </article>
                    </div>

                    <div v-else class="text-center text-muted py-5">
                        Chọn một món bắp bên trái để xem công thức.
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { marked } from "marked";
import DOMPurify from "dompurify";
import api from "@/api";

const popcornSnacks = ref([]);
const selectedSnackId = ref("");
const recipeRows = ref([]);
const recipeInstructions = ref("");
const loading = ref(false);
const loadingRecipe = ref(false);
const loadError = ref("");

const selectedSnack = computed(() =>
    popcornSnacks.value.find((snack) => String(snack.snackId) === String(selectedSnackId.value)),
);

const renderedInstructionsHtml = computed(() => {
    try {
        return DOMPurify.sanitize(marked.parse(recipeInstructions.value || ""));
    } catch (e) {
        return "<p><i>Không thể hiển thị hướng dẫn.</i></p>";
    }
});

const formatQty = (value) => {
    const number = Number(value || 0);
    return number.toLocaleString("vi-VN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
};

const loadRecipe = async () => {
    if (!selectedSnackId.value) {
        recipeRows.value = [];
        recipeInstructions.value = "";
        return;
    }

    loadingRecipe.value = true;
    try {
        const [recipeRes, instructionsRes] = await Promise.all([
            api.get(`/staff/inventory/snacks/${selectedSnackId.value}/recipe`),
            api.get(`/staff/inventory/snacks/${selectedSnackId.value}/instructions`),
        ]);

        recipeRows.value = recipeRes.data || [];
        recipeInstructions.value = instructionsRes.data?.instructions || "";
    } catch (err) {
        console.error("Không thể tải công thức:", err);
        recipeRows.value = [];
        recipeInstructions.value = "";
        loadError.value = err?.response?.data?.error || "Không thể tải công thức bắp.";
    } finally {
        loadingRecipe.value = false;
    }
};

const selectSnack = async (snackId) => {
    selectedSnackId.value = snackId;
    loadError.value = "";
    await loadRecipe();
};

const loadSnacks = async () => {
    loading.value = true;
    loadError.value = "";
    try {
        const res = await api.get("/staff/inventory/popcorn-snacks");
        popcornSnacks.value = res.data || [];

        if (popcornSnacks.value.length) {
            const stillExists = popcornSnacks.value.some(
                (snack) => String(snack.snackId) === String(selectedSnackId.value),
            );
            selectedSnackId.value = stillExists ? selectedSnackId.value : popcornSnacks.value[0].snackId;
            await loadRecipe();
        } else {
            selectedSnackId.value = "";
            recipeRows.value = [];
            recipeInstructions.value = "";
        }
    } catch (err) {
        console.error("Không thể tải danh sách món bắp:", err);
        loadError.value = err?.response?.data?.error || "Không thể tải danh sách món bắp.";
    } finally {
        loading.value = false;
    }
};

onMounted(loadSnacks);
</script>

<style scoped>
.recipes-page {
    min-height: 100%;
    background: #fffdfb;
    border-radius: 14px;
}

.panel {
    border: 1px solid #efe2db;
    border-radius: 12px;
    background: #fff;
    padding: 16px;
}

.panel-head {
    border-bottom: 1px solid #f1e5df;
    padding-bottom: 12px;
}

.snack-list {
    display: grid;
    gap: 10px;
}

.snack-item {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    border: 1px solid #efe2db;
    border-radius: 8px;
    background: #fff;
    padding: 12px;
    color: #4c4744;
    text-align: left;
}

.snack-item:hover,
.snack-item.active {
    border-color: #ff8a5c;
    background: #fff6f1;
}

.snack-name {
    font-weight: 600;
}

.snack-status {
    flex: 0 0 auto;
    border-radius: 999px;
    padding: 3px 8px;
    font-size: 12px;
    font-weight: 600;
}

.snack-status.available {
    background: #e8f6ef;
    color: #20784f;
}

.snack-status.hidden {
    background: #f1eee9;
    color: #776b62;
}

.recipe-doc {
    border: 1px solid #ead9d1;
    border-radius: 8px;
    background: #fffaf7;
    color: #332f2c;
    padding: 24px;
    max-width: 820px;
    box-shadow: 0 8px 20px rgba(88, 55, 39, 0.06);
}

.recipe-doc-header {
    border-bottom: 1px solid #ead9d1;
    margin-bottom: 20px;
    padding-bottom: 16px;
}

.recipe-doc-kicker {
    color: #a26f5e;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    margin-bottom: 8px;
    text-transform: uppercase;
}

.recipe-doc-header h3 {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 8px;
}

.recipe-doc-header p:last-child {
    color: #6c625d;
    margin-bottom: 0;
}

.recipe-doc-section {
    margin-top: 20px;
}

.recipe-doc-section h6 {
    color: #3f3834;
    font-size: 15px;
    font-weight: 700;
    margin-bottom: 12px;
}

.ingredient-doc-text {
    line-height: 1.75;
}

.ingredient-doc-text p {
    margin-bottom: 8px;
}

.ingredient-doc-text p:last-child {
    margin-bottom: 0;
}

.ingredient-doc-text strong {
    color: #1f1c1a;
    font-weight: 700;
}

.instructions-preview {
    border-left: 4px solid #ff8a5c;
    background: #fff;
    padding: 14px 16px;
    line-height: 1.7;
}

.instructions-preview :deep(p:last-child),
.instructions-preview :deep(ul:last-child),
.instructions-preview :deep(ol:last-child) {
    margin-bottom: 0;
}

@media (max-width: 575.98px) {
    .snack-item {
        align-items: flex-start;
        flex-direction: column;
    }

    .recipe-doc {
        padding: 18px;
    }

    .recipe-doc-header h3 {
        font-size: 22px;
    }
}
</style>
