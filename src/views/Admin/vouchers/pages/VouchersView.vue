<template>
    <div class="voucher-page">
        <div class="header">
            <div>
                <h3 class="title">Quản lý voucher</h3>
                <p class="subtitle">Tạo, chỉnh sửa, bật/tắt voucher khuyến mãi.</p>
            </div>
            <button class="btn-primary" @click="openCreate">+ Tạo voucher</button>
        </div>

        <div v-if="loading" class="loading">Đang tải dữ liệu...</div>

        <div v-else class="table-wrap">
            <table class="voucher-table">
                <thead>
                    <tr>
                        <th>Mã</th>
                        <th>Tên</th>
                        <th>Loại</th>
                        <th>Giá trị</th>
                        <th>Điều kiện</th>
                        <th>Trạng thái</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="voucher in vouchers" :key="voucher.voucherId">
                        <td class="code">{{ voucher.code }}</td>
                        <td>{{ voucher.name }}</td>
                        <td>{{ voucher.type === "PERCENT" ? "%" : "Fixed" }}</td>
                        <td>
                            {{ formatValue(voucher) }}
                        </td>
                        <td>
                            <div v-if="voucher.minOrder">
                                Tối thiểu {{ formatCurrency(voucher.minOrder) }}
                            </div>
                            <div v-else class="muted">Không yêu cầu</div>
                            <div v-if="voucher.newMemberOnly" class="badge">New member</div>
                        </td>
                        <td>
                            <span :class="['status', voucher.active ? 'active' : 'inactive']">
                                {{ voucher.active ? "Đang bật" : "Đã tắt" }}
                            </span>
                        </td>
                        <td class="actions">
                            <button class="btn-text" @click="openEdit(voucher)">Sửa</button>
                            <button class="btn-text" @click="toggleActive(voucher)">
                                {{ voucher.active ? "Tắt" : "Bật" }}
                            </button>
                            <button class="btn-text danger" @click="removeVoucher(voucher)">Xóa</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-if="modalOpen" class="voucher-modal-backdrop" @click="closeModal">
            <div class="voucher-modal" @click.stop>
                <div class="voucher-modal-header">
                    <h4>{{ isEditing ? "Cập nhật voucher" : "Tạo voucher" }}</h4>
                    <button class="btn-close" @click="closeModal">×</button>
                </div>
                <div class="voucher-modal-body">
                    <div class="form-grid">
                        <label>
                            Mã voucher
                            <input v-model.trim="form.code" type="text" placeholder="VD: SALE10" />
                        </label>
                        <label>
                            Tên voucher
                            <input v-model.trim="form.name" type="text" placeholder="Giảm 10%" />
                        </label>
                        <label class="full">
                            Mô tả
                            <textarea v-model.trim="form.description" rows="3" placeholder="Mô tả ưu đãi"></textarea>
                        </label>
                        <label>
                            Loại
                            <select v-model="form.type">
                                <option value="PERCENT">Phần trăm (%)</option>
                                <option value="FIXED">Giảm cố định</option>
                            </select>
                        </label>
                        <label>
                            Giá trị
                            <input v-model.number="form.value" type="number" min="0" />
                        </label>
                        <label>
                            Giảm tối đa
                            <input v-model.number="form.maxDiscount" type="number" min="0" />
                        </label>
                        <label>
                            Đơn tối thiểu
                            <input v-model.number="form.minOrder" type="number" min="0" />
                        </label>
                        <label>
                            Giới hạn lượt dùng
                            <input v-model.number="form.usageLimit" type="number" min="0" />
                        </label>
                        <label>
                            Giới hạn mỗi user
                            <input v-model.number="form.perUserLimit" type="number" min="1" />
                        </label>
                        <label>
                            Bắt đầu
                            <input v-model="form.startAt" type="datetime-local" />
                        </label>
                        <label>
                            Kết thúc
                            <input v-model="form.endAt" type="datetime-local" />
                        </label>
                        <label class="inline">
                            <input v-model="form.active" type="checkbox" />
                            Kích hoạt
                        </label>
                        <label class="inline">
                            <input v-model="form.newMemberOnly" type="checkbox" />
                            Chỉ khách mới
                        </label>
                    </div>
                </div>
                <div class="voucher-modal-footer">
                    <button class="btn-outline" @click="closeModal">Hủy</button>
                    <button class="btn-primary" @click="saveVoucher">
                        {{ isEditing ? "Lưu" : "Tạo" }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import api from "@/api";
import { getApiErrorMessage, showCinemaAlert } from "@/utils/cinemaAlert";

const vouchers = ref([]);
const loading = ref(false);
const modalOpen = ref(false);
const isEditing = ref(false);
const editingId = ref(null);

const emptyForm = () => ({
    code: "",
    name: "",
    description: "",
    type: "PERCENT",
    value: 0,
    maxDiscount: null,
    minOrder: null,
    usageLimit: null,
    perUserLimit: 1,
    startAt: "",
    endAt: "",
    active: true,
    newMemberOnly: false,
});

const form = ref(emptyForm());

const fetchVouchers = async () => {
    try {
        loading.value = true;
        const { data } = await api.get("/admin/vouchers");
        vouchers.value = data || [];
    } catch (err) {
        await showCinemaAlert({
            icon: "error",
            title: "Không thể tải voucher",
            text: getApiErrorMessage(err),
        });
    } finally {
        loading.value = false;
    }
};

const openCreate = () => {
    form.value = emptyForm();
    isEditing.value = false;
    editingId.value = null;
    modalOpen.value = true;
};

const openEdit = (voucher) => {
    form.value = {
        code: voucher.code || "",
        name: voucher.name || "",
        description: voucher.description || "",
        type: voucher.type || "PERCENT",
        value: voucher.value ?? 0,
        maxDiscount: voucher.maxDiscount,
        minOrder: voucher.minOrder,
        usageLimit: voucher.usageLimit,
        perUserLimit: voucher.perUserLimit ?? 1,
        startAt: toInputDateTime(voucher.startAt),
        endAt: toInputDateTime(voucher.endAt),
        active: voucher.active ?? true,
        newMemberOnly: voucher.newMemberOnly ?? false,
    };
    isEditing.value = true;
    editingId.value = voucher.voucherId;
    modalOpen.value = true;
};

const closeModal = () => {
    modalOpen.value = false;
};

const normalizeDateTime = (value) => {
    if (!value) return null;
    if (value.length === 16) return `${value}:00`;
    return value;
};

const toInputDateTime = (value) => {
    if (!value) return "";
    return String(value).slice(0, 16);
};

const saveVoucher = async () => {
    try {
        const payload = {
            code: form.value.code?.trim(),
            name: form.value.name?.trim(),
            description: form.value.description?.trim() || null,
            type: form.value.type,
            value: Number(form.value.value || 0),
            maxDiscount: form.value.maxDiscount !== null ? Number(form.value.maxDiscount) : null,
            minOrder: form.value.minOrder !== null ? Number(form.value.minOrder) : null,
            usageLimit: form.value.usageLimit !== null ? Number(form.value.usageLimit) : null,
            perUserLimit: form.value.perUserLimit !== null ? Number(form.value.perUserLimit) : null,
            startAt: normalizeDateTime(form.value.startAt),
            endAt: normalizeDateTime(form.value.endAt),
            active: form.value.active,
            newMemberOnly: form.value.newMemberOnly,
        };

        if (isEditing.value && editingId.value) {
            await api.put(`/admin/vouchers/${editingId.value}`, payload);
            await showCinemaAlert({
                icon: "success",
                title: "Đã cập nhật voucher",
                timer: 1200,
            });
        } else {
            await api.post("/admin/vouchers", payload);
            await showCinemaAlert({
                icon: "success",
                title: "Đã tạo voucher",
                timer: 1200,
            });
        }

        modalOpen.value = false;
        await fetchVouchers();
    } catch (err) {
        await showCinemaAlert({
            icon: "error",
            title: "Không thể lưu voucher",
            text: getApiErrorMessage(err),
        });
    }
};

const toggleActive = async (voucher) => {
    try {
        await api.patch(`/admin/vouchers/${voucher.voucherId}/active`, {
            active: !voucher.active,
        });
        await fetchVouchers();
    } catch (err) {
        await showCinemaAlert({
            icon: "error",
            title: "Không thể cập nhật trạng thái",
            text: getApiErrorMessage(err),
        });
    }
};

const removeVoucher = async (voucher) => {
    const confirmed = await showCinemaAlert({
        icon: "warning",
        title: "Xóa voucher?",
        text: `Bạn chắc chắn muốn xóa voucher ${voucher.code}?`,
        showCancelButton: true,
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
    });

    if (!confirmed.isConfirmed) return;

    try {
        await api.delete(`/admin/vouchers/${voucher.voucherId}`);
        await showCinemaAlert({
            icon: "success",
            title: "Đã xóa voucher",
            timer: 1200,
        });
        await fetchVouchers();
    } catch (err) {
        await showCinemaAlert({
            icon: "error",
            title: "Không thể xóa voucher",
            text: getApiErrorMessage(err),
        });
    }
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(amount || 0);
};

const formatValue = (voucher) => {
    if (voucher.type === "PERCENT") return `${voucher.value || 0}%`;
    return formatCurrency(voucher.value || 0);
};

onMounted(fetchVouchers);
</script>

<style scoped>
.voucher-page {
    padding: 1.5rem;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    gap: 1rem;
}

.title {
    margin: 0;
    font-size: 1.4rem;
}

.subtitle {
    margin: 0.2rem 0 0;
    color: #666;
}

.btn-primary {
    background: #ff6b35;
    color: #fff;
    border: none;
    padding: 0.6rem 1.2rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
}

.btn-outline {
    background: #fff;
    border: 1px solid #ddd;
    padding: 0.6rem 1.2rem;
    border-radius: 8px;
    cursor: pointer;
}

.btn-text {
    background: transparent;
    border: none;
    color: #ff6b35;
    cursor: pointer;
    margin-right: 0.5rem;
}

.btn-text.danger {
    color: #dc3545;
}

.table-wrap {
    background: #fff;
    border-radius: 12px;
    border: 1px solid #eee;
    overflow: auto;
}

.voucher-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 900px;
}

.voucher-table th,
.voucher-table td {
    padding: 0.9rem 1rem;
    border-bottom: 1px solid #f0f0f0;
    text-align: left;
    font-size: 0.95rem;
}

.voucher-table th {
    background: #fff8f4;
    color: #6b4c3b;
}

.code {
    font-weight: 700;
}

.muted {
    color: #888;
    font-size: 0.85rem;
}

.badge {
    display: inline-block;
    background: #ffe7dd;
    color: #ff6b35;
    padding: 0.15rem 0.5rem;
    border-radius: 999px;
    font-size: 0.75rem;
    margin-top: 0.4rem;
}

.status {
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 600;
}

.status.active {
    background: #e8f7ed;
    color: #1f8f3b;
}

.status.inactive {
    background: #fdecec;
    color: #d33939;
}

.actions {
    white-space: nowrap;
}

.loading {
    color: #666;
}

.voucher-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
}

.voucher-modal {
    background: #fff;
    border-radius: 16px;
    max-width: 760px;
    width: 100%;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
}

.voucher-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #f0f0f0;
}

.btn-close {
    border: none;
    background: transparent;
    font-size: 1.5rem;
    cursor: pointer;
}

.voucher-modal-body {
    padding: 1rem 1.5rem 0.5rem;
}

.voucher-modal-footer {
    padding: 1rem 1.5rem 1.5rem;
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
}

.form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
}

.form-grid label {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    font-size: 0.9rem;
    color: #333;
}

.form-grid input,
.form-grid textarea,
.form-grid select {
    border: 1px solid #d9d9d9;
    border-radius: 8px;
    padding: 0.5rem 0.6rem;
    font-size: 0.95rem;
}

.form-grid label.full {
    grid-column: 1 / -1;
}

.form-grid label.inline {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
}

@media (max-width: 720px) {
    .header {
        flex-direction: column;
        align-items: flex-start;
    }

    .voucher-table {
        min-width: 600px;
    }
}
</style>
