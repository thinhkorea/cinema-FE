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

        <div class="section-tabs mb-3">
            <button
                v-for="tab in sectionTabs"
                :key="tab.key"
                class="section-widget"
                :class="{ active: activeSection === tab.key }"
                @click="activeSection = tab.key"
            >
                <span class="section-widget-top">
                    <span class="section-widget-label">{{ tab.label }}</span>
                    <span class="section-widget-arrow">›</span>
                </span>
                <small class="section-widget-desc">{{ tab.description }}</small>
            </button>
        </div>

        <div class="row g-3">
            <div class="col-12 col-xl-7" v-show="activeSection === 'ingredients'">
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
                                        <button class="btn btn-sm btn-outline-danger" @click="deleteIngredient(item)">
                                            Xóa
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

            <div class="col-12 col-xl-5" v-show="activeSection === 'recipes'">
                <div class="panel h-100">
                    <div class="panel-head d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">Công thức món Snack</h6>
                    </div>

                    <div class="mt-3">
                        <label class="form-label">Chọn món snack</label>
                        <select class="form-select" v-model="selectedSnackId" @change="loadRecipe">
                            <option value="">-- Chọn món --</option>
                            <option v-for="sn in recipeSnacks" :key="sn.snackId" :value="sn.snackId">
                                {{ sn.snackName }}
                            </option>
                        </select>
                    </div>

                    <div class="mt-3" v-if="selectedSnackId">
                        <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
                            <div class="form-check form-switch">
                                <input
                                    class="form-check-input"
                                    type="checkbox"
                                    id="toggleWarehouseTrackable"
                                    v-model="snackTrackableDraft"
                                />
                                <label class="form-check-label" for="toggleWarehouseTrackable">
                                    Theo dõi kho thành phẩm
                                </label>
                            </div>
                            <button
                                class="btn btn-sm btn-outline-primary"
                                :disabled="savingSnackTrackable"
                                @click="saveSnackTrackable"
                            >
                                <span v-if="savingSnackTrackable" class="spinner-border spinner-border-sm me-1"></span>
                                Lưu trạng thái kho
                            </button>
                            <small class="text-muted">Bật để quản lý số phần làm sẵn.</small>
                        </div>

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

            <div class="col-12" v-show="activeSection === 'warehouse'">
                <div class="panel">
                    <div class="panel-head d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">Bật theo dõi kho cho snack</h6>
                        <div class="d-flex flex-wrap align-items-center gap-2">
                            <small class="text-muted">Bật để quản lý số phần làm sẵn</small>
                            <button
                                class="btn btn-sm btn-primary"
                                :disabled="savingAllSnackTrackable"
                                @click="saveAllSnackTrackable"
                            >
                                <span
                                    v-if="savingAllSnackTrackable"
                                    class="spinner-border spinner-border-sm me-1"
                                ></span>
                                Lưu tất cả
                            </button>
                        </div>
                    </div>
                    <div class="table-responsive mt-2">
                        <table class="table table-sm align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Snack</th>
                                    <th>Loại</th>
                                    <th>Theo dõi kho</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="snack in snacks" :key="`track-${snack.snackId}`">
                                    <td>{{ snack.snackName }}</td>
                                    <td>{{ snack.category }}</td>
                                    <td>
                                        <div class="form-check form-switch">
                                            <input
                                                class="form-check-input"
                                                type="checkbox"
                                                :id="`track-input-${snack.snackId}`"
                                                v-model="snack.warehouseTrackable"
                                            />
                                        </div>
                                    </td>
                                </tr>
                                <tr v-if="!snacks.length">
                                    <td colspan="3" class="text-center text-muted py-3">
                                        Chưa có snack nào. Vui lòng tạo snack trước.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="col-12" v-show="activeSection === 'warehouse'">
                <div class="panel">
                    <div class="panel-head d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">Tồn kho snack thành phẩm</h6>
                        <div class="d-flex flex-wrap align-items-center gap-2">
                            <small class="text-muted">Áp dụng cho snack có bật theo dõi kho</small>
                            <button class="btn btn-sm btn-primary" @click="openCreateSnack">+ Thêm sản phẩm</button>
                        </div>
                    </div>
                    <div class="table-responsive mt-2">
                        <table class="table table-sm align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Snack</th>
                                    <th>Loại</th>
                                    <th>Tồn kho</th>
                                    <th>Cảnh báo</th>
                                    <th class="text-end">Điều chỉnh</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="snack in snackWarehouseStocks" :key="`wh-${snack.snackId}`">
                                    <td>{{ snack.snackName }}</td>
                                    <td>{{ snack.category }}</td>
                                    <td>
                                        <span
                                            class="badge"
                                            :class="snack.lowStock ? 'bg-warning text-dark' : 'bg-success'"
                                        >
                                            {{ formatQty(snack.warehouseStock) }} phần
                                        </span>
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            class="form-control form-control-sm"
                                            style="width: 110px"
                                            v-model.number="warehouseAdjustments[snack.snackId].reorderLevel"
                                        />
                                    </td>
                                    <td class="text-end">
                                        <div class="d-flex flex-wrap gap-2 justify-content-end">
                                            <select
                                                class="form-select form-select-sm"
                                                style="width: 120px"
                                                v-model="warehouseAdjustments[snack.snackId].operation"
                                            >
                                                <option value="SET">Set</option>
                                                <option value="ADD">Add</option>
                                                <option value="SUBTRACT">Subtract</option>
                                            </select>
                                            <input
                                                type="number"
                                                min="0"
                                                step="1"
                                                class="form-control form-control-sm"
                                                style="width: 110px"
                                                placeholder="Số lượng"
                                                v-model.number="warehouseAdjustments[snack.snackId].quantity"
                                            />
                                            <input
                                                type="text"
                                                class="form-control form-control-sm"
                                                style="width: 160px"
                                                placeholder="Ghi chú"
                                                v-model="warehouseAdjustments[snack.snackId].note"
                                            />
                                            <button
                                                class="btn btn-sm btn-outline-primary"
                                                :disabled="savingWarehouse[snack.snackId]"
                                                @click="updateSnackWarehouse(snack)"
                                            >
                                                <span
                                                    v-if="savingWarehouse[snack.snackId]"
                                                    class="spinner-border spinner-border-sm me-1"
                                                ></span>
                                                Cập nhật
                                            </button>
                                            <button
                                                class="btn btn-sm btn-outline-secondary"
                                                @click="viewSnackWarehouseMovements(snack)"
                                            >
                                                Lịch sử
                                            </button>
                                            <button
                                                class="btn btn-sm btn-outline-danger"
                                                :disabled="!!deletingSnackIds[snack.snackId]"
                                                @click="deleteSnack(snack)"
                                            >
                                                <span v-if="deletingSnackIds[snack.snackId]" class="spinner-border spinner-border-sm me-1"></span>
                                                Xóa
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                <tr v-if="!snackWarehouseStocks.length">
                                    <td colspan="5" class="text-center text-muted py-3">
                                        Chưa có snack nào được theo dõi kho thành phẩm.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="col-12" v-show="activeSection === 'batches'">
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

            <div class="col-12" v-show="activeSection === 'batches'">
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

        <div class="modal fade" id="snackModal" tabindex="-1" ref="snackModalEl" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <form class="modal-content" @submit.prevent="submitSnack">
                    <div class="modal-header">
                        <h5 class="modal-title">Thêm sản phẩm bắp nước</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label">Tên sản phẩm</label>
                                <input
                                    class="form-control"
                                    v-model.trim="snackForm.snackName"
                                    placeholder="Ví dụ: Bắp 2 Ngăn 64OZ Phô Mai + Caramel"
                                    required
                                />
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">Loại</label>
                                <select class="form-select" v-model="snackForm.category" required>
                                    <option value="COMBO">Combo</option>
                                    <option value="DRINK">Nước</option>
                                    <option value="SNACK">Snack/Bắp</option>
                                    <option value="OTHER">Khác</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">Giá bán</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    class="form-control"
                                    v-model.number="snackForm.price"
                                    required
                                />
                            </div>
                            <div class="col-12">
                                <label class="form-label">Mô tả</label>
                                <textarea class="form-control" rows="2" v-model="snackForm.description"></textarea>
                            </div>
                            <div class="col-12">
                                <label class="form-label">Ảnh sản phẩm</label>
                                <input
                                    type="file"
                                    class="form-control"
                                    accept="image/*"
                                    :disabled="uploadingSnackImage"
                                    @change="handleSnackImageUpload"
                                />
                                <div v-if="uploadingSnackImage" class="form-text text-primary">Đang upload ảnh...</div>
                                <div v-else-if="snackForm.imageUrl" class="form-text">
                                    Đã chọn ảnh:
                                    <a :href="snackForm.imageUrl" target="_blank" rel="noopener">Xem ảnh</a>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Tồn ban đầu</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    class="form-control"
                                    v-model.number="snackForm.warehouseStock"
                                    :disabled="!snackForm.warehouseTrackable"
                                />
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Mức cảnh báo</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    class="form-control"
                                    v-model.number="snackForm.warehouseReorderLevel"
                                    :disabled="!snackForm.warehouseTrackable"
                                />
                            </div>
                            <div class="col-md-4 d-flex align-items-end">
                                <div>
                                    <div class="form-check form-switch">
                                        <input
                                            class="form-check-input"
                                            type="checkbox"
                                            id="newSnackWarehouseTrackable"
                                            v-model="snackForm.warehouseTrackable"
                                        />
                                        <label class="form-check-label" for="newSnackWarehouseTrackable">
                                            Theo dõi kho thành phẩm
                                        </label>
                                    </div>
                                    <div class="form-check mt-2">
                                        <input
                                            class="form-check-input"
                                            type="checkbox"
                                            id="newSnackAvailable"
                                            v-model="snackForm.available"
                                        />
                                        <label class="form-check-label" for="newSnackAvailable">
                                            Hiển thị cho customer
                                        </label>
                                    </div>
                                    <small class="text-muted d-block mt-1">
                                        Tắt mục này nếu chỉ dùng cho staff/kho, ví dụ: Bắp riêng.
                                    </small>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Hạn dùng</label>
                                <input type="date" class="form-control" v-model="snackForm.expiryDate" />
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
                        <button class="btn btn-primary" type="submit" :disabled="savingSnack || uploadingSnackImage">
                            <span v-if="savingSnack" class="spinner-border spinner-border-sm me-1"></span>
                            Lưu sản phẩm
                        </button>
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

        <div class="modal fade" id="snackMovementModal" tabindex="-1" ref="snackMovementModalEl" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Lịch sử tồn kho: {{ selectedSnackWarehouse?.snackName }}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div v-if="loadingSnackWarehouseMovements" class="text-center text-muted py-3">
                            Đang tải lịch sử tồn kho...
                        </div>
                        <div v-else-if="snackWarehouseMovementError" class="alert alert-danger py-2">
                            {{ snackWarehouseMovementError }}
                        </div>
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
                                        <th>Ghi chú</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="m in snackWarehouseMovements" :key="m.movementId">
                                        <td>{{ formatDateTime(m.createdAt) }}</td>
                                        <td>{{ m.action }}</td>
                                        <td :class="m.quantityChange >= 0 ? 'text-success' : 'text-danger'">
                                            {{ m.quantityChange >= 0 ? "+" : "" }}{{ formatQty(m.quantityChange) }}
                                        </td>
                                        <td>{{ formatQty(m.quantityBefore) }}</td>
                                        <td>{{ formatQty(m.quantityAfter) }}</td>
                                        <td>{{ m.performedBy }}</td>
                                        <td>{{ m.note || "-" }}</td>
                                    </tr>
                                    <tr v-if="!loadingSnackWarehouseMovements && !snackWarehouseMovements.length">
                                        <td colspan="7" class="text-center text-muted py-3">
                                            Chưa có lịch sử tồn kho cho sản phẩm này.
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
import { ref, computed, onMounted } from "vue";
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
const recipeSnacks = computed(() => {
    return snacks.value.filter(sn => sn.category === "SNACK" && sn.snackName && sn.snackName.toLowerCase().includes('bắp'));
});
const snackWarehouseStocks = ref([]);
const deletingSnackIds = ref({});
const selectedSnackWarehouse = ref(null);
const snackWarehouseMovements = ref([]);
const loadingSnackWarehouseMovements = ref(false);
const snackWarehouseMovementError = ref("");
const warehouseAdjustments = ref({});
const savingWarehouse = ref({});
const uploadingSnackImage = ref(false);
const activeSection = ref("warehouse");

const lowStockThreshold = 10;
const expiringDays = 7;
const sectionTabs = [
    {
        key: "warehouse",
        label: "Tồn kho snack",
        description: "Bắp nước thành phẩm",
    },
    {
        key: "ingredients",
        label: "Nguyên liệu",
        description: "Danh sách & nhập xuất",
    },
    {
        key: "recipes",
        label: "Công thức",
        description: "Định mức nguyên liệu",
    },
    {
        key: "batches",
        label: "Lô & hạn dùng",
        description: "Sắp hết hạn / hết hạn",
    },
];

const selectedSnackId = ref("");
const recipeDraft = ref([]);
const savingRecipe = ref(false);
const recipeInstructionsDraft = ref("");
const savingRecipeInstructions = ref(false);
const showInstructionsPreview = ref(false);
const instructionsError = ref("");
const snackTrackableDraft = ref(false);
const savingSnackTrackable = ref(false);
const savingAllSnackTrackable = ref(false);

const selectedIngredient = ref(null);
const selectedIngredientBatches = ref([]);
const ingredientMovements = ref([]);

const savingIngredient = ref(false);
const savingSnack = ref(false);
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

const snackForm = ref({
    snackName: "",
    description: "",
    price: 0,
    imageUrl: "",
    category: "SNACK",
    available: true,
    warehouseTrackable: true,
    warehouseStock: 0,
    warehouseReorderLevel: 10,
    expiryDate: "",
    recipeInstructions: "",
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
const snackModalEl = ref(null);
const batchModalEl = ref(null);
const batchesListModalEl = ref(null);
const consumeModalEl = ref(null);
const movementModalEl = ref(null);
const snackMovementModalEl = ref(null);
let ingredientModal = null;
let snackModal = null;
let batchModal = null;
let batchesListModal = null;
let consumeModal = null;
let movementModal = null;
let snackMovementModal = null;

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
        const [ingRes, lowRes, expRes, expiredRes, snackRes, snackWarehouseRes] = await Promise.all([
            api.get("/admin/inventory/ingredients"),
            api.get(`/admin/inventory/ingredients/low-stock?threshold=${lowStockThreshold}`),
            api.get(`/admin/inventory/ingredients/expiring-batches?days=${expiringDays}`),
            api.get("/admin/inventory/ingredients/expired-batches"),
            api.get("/snacks/admin/all"),
            api.get("/snacks/admin/warehouse-stocks"),
        ]);

        ingredients.value = ingRes.data || [];
        lowStockIngredients.value = lowRes.data || [];
        expiringBatches.value = expRes.data || [];
        expiredBatches.value = expiredRes.data || [];
        snacks.value = snackRes.data || [];
        snackWarehouseStocks.value = snackWarehouseRes.data || [];
        warehouseAdjustments.value = snackWarehouseStocks.value.reduce((acc, item) => {
            acc[item.snackId] = {
                operation: "SET",
                quantity: null,
                reorderLevel: toNumber(item.warehouseReorderLevel),
                note: "",
            };
            return acc;
        }, {});
    } catch (err) {
        await showAlert({
            icon: "error",
            title: "Lỗi",
            text: err?.response?.data?.error || "Không thể tải dữ liệu inventory.",
        });
    }
};

const updateSnackWarehouse = async (snack) => {
    const draft = warehouseAdjustments.value?.[snack.snackId];
    if (!draft) {
        await showAlert({ icon: "warning", title: "Thiếu dữ liệu", text: "Không tìm thấy dữ liệu cập nhật." });
        return;
    }
    const hasQuantity = draft.quantity !== null && draft.quantity !== "" && !Number.isNaN(Number(draft.quantity));
    if (draft.quantity !== null && draft.quantity !== "" && Number.isNaN(Number(draft.quantity))) {
        await showAlert({ icon: "warning", title: "Số lượng không hợp lệ", text: "Số lượng phải >= 0." });
        return;
    }
    if (hasQuantity && Number(draft.quantity) < 0) {
        await showAlert({ icon: "warning", title: "Số lượng không hợp lệ", text: "Số lượng phải >= 0." });
        return;
    }
    if (draft.reorderLevel === null || Number.isNaN(Number(draft.reorderLevel)) || Number(draft.reorderLevel) < 0) {
        await showAlert({ icon: "warning", title: "Cảnh báo không hợp lệ", text: "Mức cảnh báo phải >= 0." });
        return;
    }

    savingWarehouse.value = { ...savingWarehouse.value, [snack.snackId]: true };
    try {
        const payload = {
            reorderLevel: Number(draft.reorderLevel),
            operation: draft.operation,
            note: draft.note,
        };
        if (hasQuantity) {
            payload.quantity = Number(draft.quantity);
        }
        await api.patch(`/snacks/admin/${snack.snackId}/warehouse-stock`, payload);
        await loadAll();
        await showAlert({ icon: "success", title: "Hoàn tất", text: "Đã cập nhật tồn kho snack." });
    } catch (err) {
        await showAlert({
            icon: "error",
            title: "Lỗi",
            text: err?.response?.data?.error || "Không thể cập nhật tồn kho snack.",
        });
    } finally {
        savingWarehouse.value = { ...savingWarehouse.value, [snack.snackId]: false };
    }
};

const deleteSnack = async (snack) => {
    if (!snack || !snack.snackId) return;
    const ok = await showConfirm(`Bạn có chắc muốn xóa sản phẩm "${snack.snackName}"? Hành động này không thể hoàn tác.`);
    if (!ok) return;

    deletingSnackIds.value = { ...deletingSnackIds.value, [snack.snackId]: true };
    try {
        await api.delete(`/snacks/${snack.snackId}`);
        await loadAll();
        await showAlert({ icon: "success", title: "Đã xóa", text: "Đã xóa sản phẩm." });
    } catch (err) {
        await showAlert({ icon: "error", title: "Lỗi", text: err?.response?.data?.error || "Không thể xóa sản phẩm." });
    } finally {
        deletingSnackIds.value = { ...deletingSnackIds.value, [snack.snackId]: false };
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

const openCreateSnack = () => {
    snackForm.value = {
        snackName: "",
        description: "",
        price: 0,
        imageUrl: "",
        category: "SNACK",
        available: true,
        warehouseTrackable: true,
        warehouseStock: 0,
        warehouseReorderLevel: 10,
        expiryDate: "",
        recipeInstructions: "",
    };

    if (!snackModal && snackModalEl.value) {
        snackModal = new Modal(snackModalEl.value);
    }
    snackModal?.show();
};

const handleSnackImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
        await showAlert({ icon: "warning", title: "File không hợp lệ", text: "Vui lòng chọn file ảnh." });
        event.target.value = "";
        return;
    }

    const formData = new FormData();
    formData.append("file", file);
    uploadingSnackImage.value = true;
    try {
        const res = await api.post("/snacks/admin/upload-image", formData);
        snackForm.value.imageUrl = res.data?.imageUrl || "";
    } catch (err) {
        await showAlert({
            icon: "error",
            title: "Lỗi upload ảnh",
            text: err?.response?.data?.error || "Không thể upload ảnh sản phẩm.",
        });
        event.target.value = "";
    } finally {
        uploadingSnackImage.value = false;
    }
};

const submitSnack = async () => {
    if (!snackForm.value.snackName || snackForm.value.price === null || snackForm.value.price < 0) {
        await showAlert({
            icon: "warning",
            title: "Thông tin không hợp lệ",
            text: "Vui lòng nhập tên sản phẩm và giá bán hợp lệ.",
        });
        return;
    }

    savingSnack.value = true;
    try {
        const payload = {
            ...snackForm.value,
            warehouseStock: snackForm.value.warehouseTrackable ? toNumber(snackForm.value.warehouseStock) : 0,
            warehouseReorderLevel: snackForm.value.warehouseTrackable
                ? toNumber(snackForm.value.warehouseReorderLevel)
                : 0,
            expiryDate: snackForm.value.expiryDate || null,
        };
        await api.post("/snacks", payload);
        snackModal?.hide();
        await loadAll();
        await showAlert({ icon: "success", title: "Hoàn tất", text: "Đã thêm sản phẩm bắp nước." });
    } catch (err) {
        await showAlert({
            icon: "error",
            title: "Lỗi",
            text: err?.response?.data?.error || "Không thể thêm sản phẩm.",
        });
    } finally {
        savingSnack.value = false;
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

const viewSnackWarehouseMovements = async (snack) => {
    selectedSnackWarehouse.value = snack;
    snackWarehouseMovements.value = [];
    snackWarehouseMovementError.value = "";

    if (!snackMovementModal && snackMovementModalEl.value) {
        snackMovementModal = new Modal(snackMovementModalEl.value);
    }
    snackMovementModal?.show();

    loadingSnackWarehouseMovements.value = true;
    try {
        const res = await api.get(`/snacks/admin/${snack.snackId}/warehouse-movements`);
        snackWarehouseMovements.value = res.data || [];
    } catch (err) {
        snackWarehouseMovementError.value = err?.response?.data?.error || "Không thể tải lịch sử tồn kho snack.";
        await showAlert({
            icon: "error",
            title: "Lỗi",
            text: snackWarehouseMovementError.value,
        });
    } finally {
        loadingSnackWarehouseMovements.value = false;
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

const deleteIngredient = async (item) => {
    if (!item?.ingredientId) return;
    const ok = await showConfirm(`Xóa nguyên liệu "${item.ingredientName}"? Hành động này không thể hoàn tác.`);
    if (!ok) return;

    try {
        await api.delete(`/admin/inventory/ingredients/${item.ingredientId}`);
        await loadAll();
        await showAlert({ icon: "success", title: "Hoàn tất", text: "Đã xóa nguyên liệu." });
    } catch (err) {
        await showAlert({
            icon: "error",
            title: "Lỗi",
            text: err?.response?.data?.error || "Không thể xóa nguyên liệu.",
        });
    }
};

const loadRecipe = async () => {
    if (!selectedSnackId.value) {
        recipeDraft.value = [];
        snackTrackableDraft.value = false;
        return;
    }

    const currentSnack = snacks.value.find((snack) => snack.snackId === selectedSnackId.value);
    snackTrackableDraft.value = !!currentSnack?.warehouseTrackable;

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

const buildSnackPayload = (snack, warehouseTrackableValue) => ({
    snackName: snack.snackName,
    description: snack.description,
    price: snack.price,
    imageUrl: snack.imageUrl,
    category: snack.category,
    available: snack.available,
    warehouseTrackable: warehouseTrackableValue ?? snack.warehouseTrackable,
    expiryDate: snack.expiryDate,
    recipeInstructions: snack.recipeInstructions,
});

const saveSnackTrackable = async () => {
    if (!selectedSnackId.value) return;
    const currentSnack = snacks.value.find((snack) => snack.snackId === selectedSnackId.value);
    if (!currentSnack) {
        await showAlert({ icon: "warning", title: "Thiếu snack", text: "Không tìm thấy snack đã chọn." });
        return;
    }
    if (!currentSnack.snackName || currentSnack.price == null || !currentSnack.category) {
        await showAlert({
            icon: "warning",
            title: "Thiếu thông tin snack",
            text: "Vui lòng kiểm tra tên, giá và loại snack trước khi lưu.",
        });
        return;
    }

    savingSnackTrackable.value = true;
    try {
        await api.put(`/snacks/${currentSnack.snackId}`, buildSnackPayload(currentSnack, snackTrackableDraft.value));
        await loadAll();
        await showAlert({ icon: "success", title: "Hoàn tất", text: "Đã cập nhật trạng thái kho." });
    } catch (err) {
        await showAlert({
            icon: "error",
            title: "Lỗi",
            text: err?.response?.data?.error || "Không thể cập nhật trạng thái kho.",
        });
    } finally {
        savingSnackTrackable.value = false;
    }
};

const saveAllSnackTrackable = async () => {
    if (!snacks.value.length) return;

    const invalid = snacks.value.find((snack) => !snack.snackName || snack.price == null || !snack.category);
    if (invalid) {
        await showAlert({
            icon: "warning",
            title: "Thiếu thông tin snack",
            text: "Vui lòng kiểm tra tên, giá và loại snack trước khi lưu.",
        });
        return;
    }

    savingAllSnackTrackable.value = true;
    try {
        await Promise.all(snacks.value.map((snack) => api.put(`/snacks/${snack.snackId}`, buildSnackPayload(snack))));
        await loadAll();
        await showAlert({ icon: "success", title: "Hoàn tất", text: "Đã lưu trạng thái kho cho tất cả snack." });
    } catch (err) {
        await showAlert({
            icon: "error",
            title: "Lỗi",
            text: err?.response?.data?.error || "Không thể lưu trạng thái kho cho tất cả snack.",
        });
    } finally {
        savingAllSnackTrackable.value = false;
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

.section-tabs {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
}

.section-widget {
    border: 1px solid #eee2dc;
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 4px 12px rgba(103, 58, 43, 0.05);
    color: #4b403b;
    cursor: pointer;
    min-height: 74px;
    padding: 12px 14px;
    text-align: left;
    transition:
        background-color 0.2s ease,
        border-color 0.2s ease,
        box-shadow 0.2s ease,
        transform 0.2s ease;
}

.section-widget:hover {
    background-color: #f8fbff;
    border-color: #9cc5fe;
    box-shadow: 0 6px 14px rgba(13, 110, 253, 0.1);
    transform: translateY(-1px);
}

.section-widget.active {
    border-color: #0d6efd;
    background-color: #f3f8ff;
    box-shadow: 0 6px 14px rgba(13, 110, 253, 0.12);
}

.section-widget-top {
    align-items: center;
    display: flex;
    justify-content: space-between;
    gap: 10px;
}

.section-widget-label,
.section-widget-desc {
    display: block;
}

.section-widget-label {
    color: #3f3732;
    font-size: 14px;
    font-weight: 700;
}

.section-widget-arrow {
    align-items: center;
    color: #0d6efd;
    display: inline-flex;
    font-size: 20px;
    font-weight: 700;
    height: 24px;
    justify-content: center;
    line-height: 1;
    width: 24px;
}

.section-widget-desc {
    color: #7c716b;
    font-size: 12px;
    margin-top: 4px;
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
    .section-tabs {
        grid-template-columns: 1fr;
    }

    .recipe-row {
        grid-template-columns: 1fr;
    }
}
</style>
