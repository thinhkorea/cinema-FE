<template>
    <div class="inventory-page p-3 p-md-4">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <h5 class="mb-0">Quản lý Nguyên Liệu & Công Thức</h5>
            <button class="btn btn-outline-secondary" @click="loadAll">Tải lại dữ liệu</button>
        </div>

        <div class="row g-3 mb-3">
            <div class="col-md-3">
                <div class="summary-card border-warning">
                    <div class="summary-title">Nguyên liệu sắp hết</div>
                    <div class="summary-value text-warning">{{ lowStockIngredients.length }}</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="summary-card border-danger">
                    <div class="summary-title">Lô sắp hết hạn</div>
                    <div class="summary-value text-danger">{{ expiringBatches.length }}</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="summary-card border-danger">
                    <div class="summary-title">Lô đã hết hạn</div>
                    <div class="summary-value text-danger">{{ expiredBatches.length }}</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="summary-card border-primary">
                    <div class="summary-title">Tổng nguyên liệu</div>
                    <div class="summary-value text-primary">{{ ingredients.length }}</div>
                </div>
            </div>
        </div>

        <div class="row g-3">
            <div class="col-12 col-xl-7">
                <div class="panel">
                    <div class="panel-head d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">Danh sách nguyên liệu</h6>
                        <button class="btn btn-sm btn-primary" @click="openCreateIngredient">+ Thêm nguyên liệu</button>
                    </div>

                    <div class="table-responsive mt-2">
                        <table class="table table-hover align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Tên</th>
                                    <th>Đơn vị</th>
                                    <th>Tồn</th>
                                    <th>Trạng thái</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in ingredients" :key="item.ingredientId">
                                    <td>{{ item.ingredientName }}</td>
                                    <td>{{ item.unit }}</td>
                                    <td>
                                        <span
                                            class="badge"
                                            :class="
                                                toNumber(item.stock) <= lowStockThreshold
                                                    ? 'bg-warning text-dark'
                                                    : 'bg-success'
                                            "
                                        >
                                            {{ formatQty(item.stock) }}
                                        </span>
                                    </td>
                                    <td>
                                        <span class="badge" :class="item.active ? 'bg-primary' : 'bg-secondary'">
                                            {{ item.active ? "Đang dùng" : "Ngừng" }}
                                        </span>
                                    </td>
                                    <td class="d-flex flex-wrap gap-1">
                                        <button
                                            class="btn btn-sm btn-outline-primary"
                                            @click="openEditIngredient(item)"
                                        >
                                            Sửa
                                        </button>
                                        <button class="btn btn-sm btn-outline-success" @click="openReceiveBatch(item)">
                                            Nhập lô
                                        </button>
                                        <button
                                            class="btn btn-sm btn-outline-warning"
                                            @click="openConsumeIngredient(item)"
                                        >
                                            Xuất dùng
                                        </button>
                                        <button class="btn btn-sm btn-outline-dark" @click="viewBatches(item)">
                                            Xem lô
                                        </button>
                                        <button class="btn btn-sm btn-outline-secondary" @click="viewMovements(item)">
                                            Lịch sử
                                        </button>
                                    </td>
                                </tr>
                                <tr v-if="!ingredients.length">
                                    <td colspan="5" class="text-center text-muted py-4">Chưa có nguyên liệu nào.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="col-12 col-xl-5">
                <div class="panel h-100">
                    <div class="panel-head d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">Công thức món Snack</h6>
                    </div>

                    <div class="mt-3">
                        <label class="form-label">Chọn món snack</label>
                        <select class="form-select" v-model="selectedSnackId" @change="loadRecipe">
                            <option value="">-- Chọn món --</option>
                            <option v-for="sn in snacks" :key="sn.snackId" :value="sn.snackId">
                                {{ sn.snackName }}
                            </option>
                        </select>
                    </div>

                    <div class="mt-3" v-if="selectedSnackId">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <div class="small text-muted">Định mức cho 1 sản phẩm</div>
                            <button class="btn btn-sm btn-outline-primary" @click="addRecipeRow">+ Dòng</button>
                        </div>

                        <div class="recipe-list">
                            <div class="recipe-row" v-for="(row, idx) in recipeDraft" :key="idx">
                                <select class="form-select form-select-sm" v-model="row.ingredientId">
                                    <option value="">Nguyên liệu</option>
                                    <option
                                        v-for="ing in ingredients"
                                        :key="ing.ingredientId"
                                        :value="ing.ingredientId"
                                    >
                                        {{ ing.ingredientName }} ({{ ing.unit }})
                                    </option>
                                </select>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    class="form-control form-control-sm"
                                    v-model.number="row.quantityPerSnack"
                                    placeholder="SL"
                                />
                                <button class="btn btn-sm btn-outline-danger" @click="removeRecipeRow(idx)">X</button>
                            </div>
                            <div class="mt-3">
                                <label class="form-label">Hướng dẫn / Ghi chú chế biến</label>
                                <textarea
                                    class="form-control"
                                    rows="5"
                                    v-model="recipeInstructionsDraft"
                                    placeholder="Nhập hướng dẫn chế biến, bước nấu, lưu ý..."
                                ></textarea>
                                <div class="form-text text-danger" v-if="instructionsError">
                                    {{ instructionsError }}
                                </div>
                                <div class="mt-2 d-flex gap-2 align-items-center">
                                    <button
                                        class="btn btn-primary"
                                        :disabled="savingRecipeInstructions"
                                        @click="saveRecipeInstructions"
                                    >
                                        <span
                                            v-if="savingRecipeInstructions"
                                            class="spinner-border spinner-border-sm me-2"
                                        ></span>
                                        Lưu hướng dẫn
                                    </button>
                                    <button class="btn btn-outline-secondary" @click="loadRecipe">Tải lại</button>
                                    <button
                                        class="btn btn-outline-info ms-2"
                                        @click="showInstructionsPreview = !showInstructionsPreview"
                                    >
                                        {{ showInstructionsPreview ? "Ẩn xem trước" : "Xem trước" }}
                                    </button>
                                </div>

                                <div
                                    v-if="showInstructionsPreview"
                                    class="mt-3 p-3 border rounded bg-light"
                                    v-html="renderedInstructionsHtml()"
                                ></div>
                            </div>
                        </div>

                        <div class="mt-3 d-flex gap-2">
                            <button class="btn btn-primary" :disabled="savingRecipe" @click="saveRecipe">
                                <span v-if="savingRecipe" class="spinner-border spinner-border-sm me-2"></span>
                                Lưu công thức
                            </button>
                            <button class="btn btn-outline-secondary" @click="loadRecipe">Tải lại công thức</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-12">
                <div class="panel">
                    <div class="panel-head d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">Lô sắp hết hạn ({{ expiringDays }} ngày)</h6>
                    </div>
                    <div class="table-responsive mt-2">
                        <table class="table table-sm align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Nguyên liệu</th>
                                    <th>Số lượng còn</th>
                                    <th>HSD</th>
                                    <th>Nhà cung cấp</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="b in expiringBatches" :key="`expiring-${b.batchId}`">
                                    <td>{{ b.ingredientName }}</td>
                                    <td>{{ formatQty(b.quantityRemaining) }}</td>
                                    <td>{{ formatDate(b.expiryDate) }}</td>
                                    <td>{{ b.supplier || "-" }}</td>
                                </tr>
                                <tr v-if="!expiringBatches.length">
                                    <td colspan="4" class="text-center text-muted py-3">Không có lô sắp hết hạn.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="col-12">
                <div class="panel">
                    <div class="panel-head d-flex justify-content-between align-items-center">
                        <h6 class="mb-0 text-danger">Lô đã hết hạn</h6>
                        <button
                            class="btn btn-sm btn-outline-danger"
                            :disabled="!expiredBatches.length || discardingExpiredAll"
                            @click="discardAllExpiredBatches"
                        >
                            <span v-if="discardingExpiredAll" class="spinner-border spinner-border-sm me-1"></span>
                            Loại bỏ tất cả lô hết hạn
                        </button>
                    </div>
                    <div class="table-responsive mt-2">
                        <table class="table table-sm align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Nguyên liệu</th>
                                    <th>Số lượng còn</th>
                                    <th>HSD</th>
                                    <th>Nhà cung cấp</th>
                                    <th class="text-end">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="b in expiredBatches" :key="`expired-${b.batchId}`">
                                    <td>{{ b.ingredientName }}</td>
                                    <td>{{ formatQty(b.quantityRemaining) }}</td>
                                    <td>{{ formatDate(b.expiryDate) }}</td>
                                    <td>{{ b.supplier || "-" }}</td>
                                    <td class="text-end">
                                        <button
                                            class="btn btn-sm btn-outline-danger"
                                            :disabled="!!discardingBatchIds[b.batchId]"
                                            @click="discardExpiredBatch(b)"
                                        >
                                            <span
                                                v-if="discardingBatchIds[b.batchId]"
                                                class="spinner-border spinner-border-sm me-1"
                                            ></span>
                                            Loại bỏ
                                        </button>
                                    </td>
                                </tr>
                                <tr v-if="!expiredBatches.length">
                                    <td colspan="5" class="text-center text-muted py-3">Không có lô đã hết hạn.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal fade" id="ingredientModal" tabindex="-1" ref="ingredientModalEl" aria-hidden="true">
            <div class="modal-dialog">
                <form class="modal-content" @submit.prevent="submitIngredient">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            {{ ingredientForm.ingredientId ? "Sửa nguyên liệu" : "Thêm nguyên liệu" }}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">Tên nguyên liệu</label>
                            <input class="form-control" v-model="ingredientForm.ingredientName" required />
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Đơn vị</label>
                            <input
                                class="form-control"
                                v-model="ingredientForm.unit"
                                placeholder="g, ml, cái..."
                                required
                            />
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Tồn đầu kỳ</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                class="form-control"
                                v-model.number="ingredientForm.stock"
                            />
                        </div>
                        <div class="form-check">
                            <input
                                class="form-check-input"
                                type="checkbox"
                                id="activeCheck"
                                v-model="ingredientForm.active"
                            />
                            <label class="form-check-label" for="activeCheck">Đang sử dụng</label>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
                        <button class="btn btn-primary" type="submit" :disabled="savingIngredient">Lưu</button>
                    </div>
                </form>
            </div>
        </div>

        <div class="modal fade" id="batchModal" tabindex="-1" ref="batchModalEl" aria-hidden="true">
            <div class="modal-dialog">
                <form class="modal-content" @submit.prevent="submitBatch">
                    <div class="modal-header">
                        <h5 class="modal-title">Nhập lô cho {{ selectedIngredient?.ingredientName }}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-2">
                            <label class="form-label">Số lượng nhập</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                class="form-control"
                                v-model.number="batchForm.quantity"
                                required
                            />
                        </div>
                        <div class="mb-2">
                            <label class="form-label">Đơn giá</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                class="form-control"
                                v-model.number="batchForm.unitCost"
                            />
                        </div>
                        <div class="mb-2">
                            <label class="form-label">Nhà cung cấp</label>
                            <input class="form-control" v-model="batchForm.supplier" />
                        </div>
                        <div class="row g-2">
                            <div class="col-6">
                                <label class="form-label">NSX</label>
                                <input type="date" class="form-control" v-model="batchForm.productionDate" />
                            </div>
                            <div class="col-6">
                                <label class="form-label">HSD</label>
                                <input type="date" class="form-control" v-model="batchForm.expiryDate" />
                            </div>
                        </div>
                        <div class="mt-2">
                            <label class="form-label">Ghi chú</label>
                            <textarea class="form-control" rows="2" v-model="batchForm.note"></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
                        <button class="btn btn-success" type="submit" :disabled="savingBatch">Nhập lô</button>
                    </div>
                </form>
            </div>
        </div>

        <div class="modal fade" id="batchesListModal" tabindex="-1" ref="batchesListModalEl" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Lô của {{ selectedIngredient?.ingredientName }}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="table-responsive">
                            <table class="table table-sm align-middle">
                                <thead>
                                    <tr>
                                        <th>Ngày nhập</th>
                                        <th>Nhập</th>
                                        <th>Còn lại</th>
                                        <th>HSD</th>
                                        <th>NCC</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="b in selectedIngredientBatches" :key="b.batchId">
                                        <td>{{ formatDateTime(b.receivedAt) }}</td>
                                        <td>{{ formatQty(b.quantityReceived) }}</td>
                                        <td>{{ formatQty(b.quantityRemaining) }}</td>
                                        <td>{{ formatDate(b.expiryDate) }}</td>
                                        <td>{{ b.supplier || "-" }}</td>
                                    </tr>
                                    <tr v-if="!selectedIngredientBatches.length">
                                        <td colspan="5" class="text-center text-muted">Không có lô nào.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal fade" id="consumeModal" tabindex="-1" ref="consumeModalEl" aria-hidden="true">
            <div class="modal-dialog">
                <form class="modal-content" @submit.prevent="submitConsumeIngredient">
                    <div class="modal-header">
                        <h5 class="modal-title">Xuất dùng nguyên liệu: {{ selectedIngredient?.ingredientName }}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-2 text-muted small">
                            Tồn hiện tại:
                            <strong>{{ formatQty(selectedIngredient?.stock) }} {{ selectedIngredient?.unit }}</strong>
                        </div>
                        <div class="mb-2">
                            <label class="form-label">Số lượng xuất dùng</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                class="form-control"
                                v-model.number="consumeForm.quantity"
                                required
                            />
                        </div>
                        <div class="mb-2">
                            <label class="form-label">Lý do</label>
                            <input
                                class="form-control"
                                v-model="consumeForm.reason"
                                placeholder="Ví dụ: Pha chế tại quầy"
                            />
                        </div>
                        <div>
                            <label class="form-label">Ghi chú</label>
                            <textarea class="form-control" rows="2" v-model="consumeForm.note"></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
                        <button class="btn btn-warning" type="submit" :disabled="savingConsume">
                            Xác nhận xuất dùng
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <div class="modal fade" id="movementModal" tabindex="-1" ref="movementModalEl" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Lịch sử thao tác: {{ selectedIngredient?.ingredientName }}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="table-responsive">
                            <table class="table table-sm align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th>Thời gian</th>
                                        <th>Hành động</th>
                                        <th>Biến động</th>
                                        <th>Trước</th>
                                        <th>Sau</th>
                                        <th>Người thực hiện</th>
                                        <th>Lý do</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="m in ingredientMovements" :key="m.movementId">
                                        <td>{{ formatDateTime(m.createdAt) }}</td>
                                        <td>{{ m.action }}</td>
                                        <td :class="m.quantityChange >= 0 ? 'text-success' : 'text-danger'">
                                            {{ m.quantityChange >= 0 ? "+" : "" }}{{ formatQty(m.quantityChange) }}
                                        </td>
                                        <td>{{ formatQty(m.quantityBefore) }}</td>
                                        <td>{{ formatQty(m.quantityAfter) }}</td>
                                        <td>{{ m.performedBy }}</td>
                                        <td>{{ m.reason || "-" }}</td>
                                    </tr>
                                    <tr v-if="!ingredientMovements.length">
                                        <td colspan="7" class="text-center text-muted py-3">
                                            Chưa có lịch sử thao tác.
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { Modal } from "bootstrap";
import api from "@/api";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { showCinemaAlert, showCinemaConfirm, showCinemaToast } from "@/utils/cinemaAlert";

const showAlert = ({ icon = "info", title = "Thông báo", text = "", toast = false }) => {
    if (toast) {
        return showCinemaToast({
            icon,
            title,
            text,
        });
    }
    return showCinemaAlert({
        icon,
        title,
        text,
    });
};

const showConfirm = async (text, title = "Xác nhận") => {
    return showCinemaConfirm({
        title,
        text,
        icon: "warning",
        confirmButtonText: "Xác nhận",
    });
};

const ingredients = ref([]);
const lowStockIngredients = ref([]);
const expiringBatches = ref([]);
const expiredBatches = ref([]);
const snacks = ref([]);

const lowStockThreshold = 10;
const expiringDays = 7;

const selectedSnackId = ref("");
const recipeDraft = ref([]);
const savingRecipe = ref(false);
const recipeInstructionsDraft = ref("");
const savingRecipeInstructions = ref(false);
const showInstructionsPreview = ref(false);
const instructionsError = ref("");

const selectedIngredient = ref(null);
const selectedIngredientBatches = ref([]);
const ingredientMovements = ref([]);

const savingIngredient = ref(false);
const savingBatch = ref(false);
const savingConsume = ref(false);
const discardingExpiredAll = ref(false);
const discardingBatchIds = ref({});

const ingredientForm = ref({
    ingredientId: null,
    ingredientName: "",
    unit: "",
    stock: 0,
    active: true,
});

const batchForm = ref({
    quantity: null,
    unitCost: null,
    supplier: "",
    productionDate: "",
    expiryDate: "",
    note: "",
});

const consumeForm = ref({
    quantity: null,
    reason: "",
    note: "",
});

const ingredientModalEl = ref(null);
const batchModalEl = ref(null);
const batchesListModalEl = ref(null);
const consumeModalEl = ref(null);
const movementModalEl = ref(null);
let ingredientModal = null;
let batchModal = null;
let batchesListModal = null;
let consumeModal = null;
let movementModal = null;

const toNumber = (val) => {
    const parsed = Number(val);
    return Number.isFinite(parsed) ? parsed : 0;
};

const formatQty = (val) => {
    const n = toNumber(val);
    return n % 1 === 0 ? n.toFixed(0) : n.toFixed(2);
};

const formatDate = (val) => {
    if (!val) return "-";
    return new Date(val).toLocaleDateString("vi-VN");
};

const formatDateTime = (val) => {
    if (!val) return "-";
    return new Date(val).toLocaleString("vi-VN");
};

const loadAll = async () => {
    try {
        const [ingRes, lowRes, expRes, expiredRes, snackRes] = await Promise.all([
            api.get("/admin/inventory/ingredients"),
            api.get(`/admin/inventory/ingredients/low-stock?threshold=${lowStockThreshold}`),
            api.get(`/admin/inventory/ingredients/expiring-batches?days=${expiringDays}`),
            api.get("/admin/inventory/ingredients/expired-batches"),
            api.get("/snacks/admin/all"),
        ]);

        ingredients.value = ingRes.data || [];
        lowStockIngredients.value = lowRes.data || [];
        expiringBatches.value = expRes.data || [];
        expiredBatches.value = expiredRes.data || [];
        snacks.value = snackRes.data || [];
    } catch (err) {
        await showAlert({
            icon: "error",
            title: "Lỗi",
            text: err?.response?.data?.error || "Không thể tải dữ liệu inventory.",
        });
    }
};

const openCreateIngredient = () => {
    ingredientForm.value = {
        ingredientId: null,
        ingredientName: "",
        unit: "",
        stock: 0,
        active: true,
    };

    if (!ingredientModal && ingredientModalEl.value) {
        ingredientModal = new Modal(ingredientModalEl.value);
    }
    ingredientModal?.show();
};

const openEditIngredient = (item) => {
    ingredientForm.value = {
        ingredientId: item.ingredientId,
        ingredientName: item.ingredientName,
        unit: item.unit,
        stock: toNumber(item.stock),
        active: !!item.active,
    };

    if (!ingredientModal && ingredientModalEl.value) {
        ingredientModal = new Modal(ingredientModalEl.value);
    }
    ingredientModal?.show();
};

const submitIngredient = async () => {
    savingIngredient.value = true;
    try {
        const payload = { ...ingredientForm.value };
        if (payload.ingredientId) {
            await api.put(`/admin/inventory/ingredients/${payload.ingredientId}`, payload);
        } else {
            await api.post("/admin/inventory/ingredients", payload);
        }
        ingredientModal?.hide();
        await loadAll();
    } catch (err) {
        await showAlert({
            icon: "error",
            title: "Lỗi",
            text: err?.response?.data?.error || "Không thể lưu nguyên liệu.",
        });
    } finally {
        savingIngredient.value = false;
    }
};

const openReceiveBatch = (item) => {
    selectedIngredient.value = item;
    batchForm.value = {
        quantity: null,
        unitCost: null,
        supplier: "",
        productionDate: "",
        expiryDate: "",
        note: "",
    };
    if (!batchModal && batchModalEl.value) {
        batchModal = new Modal(batchModalEl.value);
    }
    batchModal?.show();
};

const submitBatch = async () => {
    if (!selectedIngredient.value) return;

    savingBatch.value = true;
    try {
        await api.post(
            `/admin/inventory/ingredients/${selectedIngredient.value.ingredientId}/batches`,
            batchForm.value,
        );
        batchModal?.hide();
        await loadAll();
    } catch (err) {
        await showAlert({ icon: "error", title: "Lỗi", text: err?.response?.data?.error || "Không thể nhập lô." });
    } finally {
        savingBatch.value = false;
    }
};

const viewBatches = async (item) => {
    selectedIngredient.value = item;
    selectedIngredientBatches.value = [];

    if (!batchesListModal && batchesListModalEl.value) {
        batchesListModal = new Modal(batchesListModalEl.value);
    }
    batchesListModal?.show();

    try {
        const res = await api.get(`/admin/inventory/ingredients/${item.ingredientId}/batches`);
        selectedIngredientBatches.value = res.data || [];
    } catch (err) {
        await showAlert({
            icon: "error",
            title: "Lỗi",
            text: err?.response?.data?.error || "Không thể tải danh sách lô.",
        });
    }
};

const openConsumeIngredient = (item) => {
    selectedIngredient.value = item;
    consumeForm.value = {
        quantity: null,
        reason: "Pha chế tại quầy",
        note: "",
    };

    if (!consumeModal && consumeModalEl.value) {
        consumeModal = new Modal(consumeModalEl.value);
    }
    consumeModal?.show();
};

const submitConsumeIngredient = async () => {
    if (!selectedIngredient.value) return;
    savingConsume.value = true;
    try {
        await api.post(
            `/admin/inventory/ingredients/${selectedIngredient.value.ingredientId}/consume`,
            consumeForm.value,
        );
        consumeModal?.hide();
        await loadAll();
    } catch (err) {
        await showAlert({
            icon: "error",
            title: "Lỗi",
            text: err?.response?.data?.error || "Không thể ghi nhận xuất dùng nguyên liệu.",
        });
    } finally {
        savingConsume.value = false;
    }
};

const viewMovements = async (item) => {
    selectedIngredient.value = item;
    ingredientMovements.value = [];

    if (!movementModal && movementModalEl.value) {
        movementModal = new Modal(movementModalEl.value);
    }
    movementModal?.show();

    try {
        const res = await api.get(`/admin/inventory/ingredients/${item.ingredientId}/movements`);
        ingredientMovements.value = res.data || [];
    } catch (err) {
        await showAlert({
            icon: "error",
            title: "Lỗi",
            text: err?.response?.data?.error || "Không thể tải lịch sử thao tác.",
        });
    }
};

const discardExpiredBatch = async (batch) => {
    if (!batch?.batchId) return;

    const ok = await showConfirm(`Loại bỏ lô hết hạn của ${batch.ingredientName}?`);
    if (!ok) return;

    discardingBatchIds.value = {
        ...discardingBatchIds.value,
        [batch.batchId]: true,
    };

    try {
        await api.post(`/admin/inventory/ingredients/batches/${batch.batchId}/discard-expired`);
        await loadAll();
    } catch (err) {
        await showAlert({
            icon: "error",
            title: "Lỗi",
            text: err?.response?.data?.error || "Không thể loại bỏ lô hết hạn.",
        });
    } finally {
        const next = { ...discardingBatchIds.value };
        delete next[batch.batchId];
        discardingBatchIds.value = next;
    }
};

const discardAllExpiredBatches = async () => {
    if (!expiredBatches.value.length) return;

    const ok = await showConfirm("Loại bỏ tất cả lô đã hết hạn khỏi tồn kho?");
    if (!ok) return;

    discardingExpiredAll.value = true;
    try {
        const res = await api.post("/admin/inventory/ingredients/batches/discard-expired-all");
        const discardedCount = res?.data?.discardedCount ?? 0;
        await loadAll();
        await showAlert({ icon: "success", title: "Hoàn tất", text: `Đã loại bỏ ${discardedCount} lô hết hạn.` });
    } catch (err) {
        await showAlert({
            icon: "error",
            title: "Lỗi",
            text: err?.response?.data?.error || "Không thể loại bỏ các lô hết hạn.",
        });
    } finally {
        discardingExpiredAll.value = false;
    }
};

const loadRecipe = async () => {
    if (!selectedSnackId.value) {
        recipeDraft.value = [];
        return;
    }

    try {
        const res = await api.get(`/admin/inventory/snacks/${selectedSnackId.value}/recipe`);
        recipeDraft.value = (res.data || []).map((item) => ({
            ingredientId: item.ingredientId,
            quantityPerSnack: item.quantityPerSnack,
        }));

        if (recipeDraft.value.length === 0) {
            recipeDraft.value = [{ ingredientId: "", quantityPerSnack: null }];
        }
    } catch (err) {
        await showAlert({
            icon: "error",
            title: "Lỗi",
            text: err?.response?.data?.error || "Không thể tải công thức.",
        });
    }
    // load instructions as well
    try {
        const ins = await api.get(`/admin/inventory/snacks/${selectedSnackId.value}/instructions`);
        recipeInstructionsDraft.value = ins?.data?.instructions || "";
    } catch (err) {
        recipeInstructionsDraft.value = "";
    }
};

const addRecipeRow = () => {
    recipeDraft.value.push({ ingredientId: "", quantityPerSnack: null });
};

const removeRecipeRow = (index) => {
    recipeDraft.value.splice(index, 1);
    if (recipeDraft.value.length === 0) {
        recipeDraft.value.push({ ingredientId: "", quantityPerSnack: null });
    }
};

const saveRecipe = async () => {
    if (!selectedSnackId.value) return;

    const payload = recipeDraft.value
        .filter((row) => row.ingredientId && toNumber(row.quantityPerSnack) > 0)
        .map((row) => ({
            ingredientId: row.ingredientId,
            quantityPerSnack: toNumber(row.quantityPerSnack),
        }));

    savingRecipe.value = true;
    try {
        await api.put(`/admin/inventory/snacks/${selectedSnackId.value}/recipe`, payload);
        await loadRecipe();
        await loadAll();
    } catch (err) {
        await showAlert({
            icon: "error",
            title: "Lỗi",
            text: err?.response?.data?.error || "Không thể lưu công thức.",
        });
    } finally {
        savingRecipe.value = false;
    }
};

const saveRecipeInstructions = async () => {
    if (!selectedSnackId.value) return;
    // validation
    instructionsError.value = "";
    const txt = (recipeInstructionsDraft.value || "").trim();
    if (!txt) {
        instructionsError.value = "Hướng dẫn không được để trống.";
        return;
    }
    if (txt.length > 10000) {
        instructionsError.value = "Hướng dẫn quá dài (tối đa 10000 ký tự).";
        return;
    }
    savingRecipeInstructions.value = true;
    try {
        await api.put(`/admin/inventory/snacks/${selectedSnackId.value}/instructions`, {
            instructions: recipeInstructionsDraft.value,
        });
        await loadAll();
        await showAlert({ icon: "success", title: "Hoàn tất", text: "Đã lưu hướng dẫn/nội dung công thức." });
    } catch (err) {
        await showAlert({
            icon: "error",
            title: "Lỗi",
            text: err?.response?.data?.error || "Không thể lưu hướng dẫn công thức.",
        });
    } finally {
        savingRecipeInstructions.value = false;
    }
};

const renderedInstructionsHtml = () => {
    const md = recipeInstructionsDraft.value || "";
    try {
        const raw = marked.parse(md);
        return DOMPurify.sanitize(raw);
    } catch (e) {
        return "<p><i>Lỗi render markdown</i></p>";
    }
};

onMounted(async () => {
    await loadAll();
});
</script>

<style scoped>
.inventory-page {
    background: linear-gradient(180deg, #fffdfb 0%, #fff 40%);
    border-radius: 14px;
    min-height: 100%;
}

.summary-card {
    border: 1px solid #eee;
    border-left-width: 4px;
    border-radius: 12px;
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

.panel {
    border: 1px solid #f0dfd7;
    border-radius: 12px;
    background: #fff;
    padding: 12px;
}

.panel-head {
    border-bottom: 1px solid #f3e9e5;
    padding-bottom: 10px;
}

.recipe-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.recipe-row {
    display: grid;
    grid-template-columns: 1fr 120px 48px;
    gap: 8px;
}

@media (max-width: 576px) {
    .recipe-row {
        grid-template-columns: 1fr;
    }
}
</style>
