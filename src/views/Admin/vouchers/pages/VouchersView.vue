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

        <div v-else>
            <div class="table-wrap">
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
                        <tr v-for="voucher in paginatedVouchers" :key="voucher.voucherId">
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
                                <div v-if="voucher.newMemberOnly" class="badge new-member">Chỉ khách mới</div>
                                <div v-if="voucher.newMemberOnly" class="condition-note">Chưa từng thanh toán</div>
                                <div v-if="looksLikeNewMemberVoucher(voucher) && !voucher.newMemberOnly" class="badge warning">
                                    Chưa bật điều kiện khách mới
                                </div>
                                <div v-if="voucher.requiredTotalSpent" class="badge points">
                                    Đã tiêu từ {{ formatCurrency(voucher.requiredTotalSpent) }} trong
                                    {{ formatWindowYears(voucher.spendingWindowDays) }}
                                </div>
                                <div v-if="voucher.requiredTotalSpent" class="badge spend-only">Theo mốc chi tiêu</div>
                                <div v-if="!voucher.minOrder && !voucher.newMemberOnly && !voucher.requiredTotalSpent" class="muted">
                                    Không yêu cầu
                                </div>
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
            <AdminPagination
                v-if="vouchers.length"
                v-model="currentPage"
                v-model:page-size="pageSize"
                :total-items="vouchers.length"
                item-label="voucher"
                aria-label="Phân trang voucher"
            />
        </div>

        <div v-if="modalOpen" class="voucher-modal-backdrop" @click="closeModal">
            <div class="voucher-modal" @click.stop>
                <div class="voucher-modal-header">
                    <h4>{{ isEditing ? "Cập nhật voucher" : "Tạo voucher" }}</h4>
                    <button class="btn-close" @click="closeModal">×</button>
                </div>
                <div class="voucher-modal-body">
                    <div class="form-grid">
                        <div class="field-guide full">
                            <div class="field-guide-title">Giải thích các trường</div>
                            <ul>
                                <li><strong>Mã voucher:</strong> mã khách nhập hoặc hệ thống hiển thị khi thanh toán.</li>
                                <li><strong>Tên, mô tả:</strong> nội dung khách nhìn thấy trong hồ sơ và danh sách ưu đãi.</li>
                                <li><strong>Loại, giá trị:</strong> chọn giảm theo phần trăm hoặc số tiền cố định.</li>
                                <li><strong>Giảm tối đa:</strong> giới hạn số tiền giảm khi loại là phần trăm; để trống nếu không giới hạn.</li>
                                <li><strong>Đơn tối thiểu:</strong> đơn hàng phải đạt số tiền này mới áp dụng được voucher.</li>
                                <li><strong>Mốc chi tiêu để khách nhận:</strong> tổng tiền khách đã thanh toán đủ mốc này thì voucher tự hiện ở trang thanh toán.</li>
                                <li><strong>Thời gian tính chi tiêu:</strong> tính theo năm dương lịch; 1 năm là năm hiện tại, 2 năm là năm hiện tại và năm trước.</li>
                                <li><strong>Giới hạn lượt dùng:</strong> tổng số lần voucher được dùng trên toàn hệ thống.</li>
                                <li><strong>Giới hạn mỗi user:</strong> số lần một tài khoản được dùng voucher này.</li>
                                <li><strong>Bắt đầu, kết thúc:</strong> khoảng thời gian voucher có hiệu lực.</li>
                                <li><strong>Kích hoạt:</strong> tắt/bật voucher mà không cần xóa.</li>
                                <li><strong>Chỉ khách mới:</strong> chỉ áp dụng cho tài khoản chưa từng có giao dịch thanh toán.</li>
                            </ul>
                        </div>
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
                            Mốc chi tiêu để khách nhận
                            <input
                                v-model.number="form.requiredTotalSpent"
                                type="number"
                                min="0"
                                placeholder="Để trống nếu không dùng"
                            />
                        </label>
                        <label>
                            Thời gian tính chi tiêu (số năm)
                            <input
                                v-model.number="form.spendingWindowYears"
                                type="number"
                                min="1"
                                placeholder="1"
                                :disabled="!form.requiredTotalSpent"
                            />
                        </label>
                        <p class="condition-help full">
                            Nhập mốc chi tiêu nếu muốn khách đạt mốc thì tự mở voucher ở trang thanh toán.
                        </p>
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
                            <span>
                                Chỉ khách mới
                                <small>Khách chưa từng thanh toán vé.</small>
                            </span>
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
import { computed, onMounted, ref, watch } from "vue";
import api from "@/api";
import AdminPagination from "@/views/Admin/components/AdminPagination.vue";
import { getApiErrorMessage, showCinemaAlert } from "@/utils/cinemaAlert";

const vouchers = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const modalOpen = ref(false);
const isEditing = ref(false);
const editingId = ref(null);
const DAYS_PER_YEAR = 365;

const emptyForm = () => ({
    code: "",
    name: "",
    description: "",
    type: "PERCENT",
    value: 0,
    maxDiscount: null,
    minOrder: null,
    requiredTotalSpent: null,
    spendingWindowYears: 1,
    usageLimit: null,
    perUserLimit: 1,
    startAt: "",
    endAt: "",
    active: true,
    newMemberOnly: false,
});

const form = ref(emptyForm());
const totalPages = computed(() => Math.max(1, Math.ceil(vouchers.value.length / pageSize.value)));
const paginatedVouchers = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    return vouchers.value.slice(start, start + pageSize.value);
});

watch([pageSize, totalPages], () => {
    if (currentPage.value > totalPages.value) {
        currentPage.value = totalPages.value;
    }
});

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
        requiredTotalSpent: voucher.requiredTotalSpent,
        spendingWindowYears: daysToYears(voucher.spendingWindowDays),
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

const nullableNumber = (value) => {
    return value === null || value === undefined || value === "" ? null : Number(value);
};

const yearsToDays = (years) => Math.max(1, Math.round(Number(years || 1))) * DAYS_PER_YEAR;

const daysToYears = (days) => {
    const value = Number(days || DAYS_PER_YEAR);
    return Math.max(1, Math.round(value / DAYS_PER_YEAR));
};

const normalizeText = (value) => {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
};

const looksLikeNewMemberVoucher = (voucher) => {
    const text = normalizeText(`${voucher?.code || ""} ${voucher?.name || ""}`);
    return (
        text.includes("newbie") ||
        text.includes("new member") ||
        text.includes("khach hang moi") ||
        text.includes("nguoi moi")
    );
};

const saveVoucher = async () => {
    try {
        const requiredTotalSpent = nullableNumber(form.value.requiredTotalSpent);
        const spendingWindowDays = requiredTotalSpent && requiredTotalSpent > 0
            ? yearsToDays(nullableNumber(form.value.spendingWindowYears) || 1)
            : null;

        const looksNewMember = looksLikeNewMemberVoucher(form.value);
        if (looksNewMember && !form.value.newMemberOnly) {
            const confirmed = await showCinemaAlert({
                icon: "warning",
                title: "Voucher có vẻ dành cho khách mới",
                text: "Bạn chưa bật điều kiện Chỉ khách mới. Nếu lưu như vậy, mọi khách đủ điều kiện khác vẫn có thể dùng voucher này.",
                showCancelButton: true,
                confirmButtonText: "Vẫn lưu",
                cancelButtonText: "Quay lại bật điều kiện",
            });

            if (!confirmed.isConfirmed) return;
        }

        const payload = {
            code: form.value.code?.trim(),
            name: form.value.name?.trim(),
            description: form.value.description?.trim() || null,
            type: form.value.type,
            value: Number(form.value.value || 0),
            maxDiscount: nullableNumber(form.value.maxDiscount),
            minOrder: nullableNumber(form.value.minOrder),
            requiredTotalSpent,
            spendingWindowDays,
            usageLimit: nullableNumber(form.value.usageLimit),
            perUserLimit: nullableNumber(form.value.perUserLimit),
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

const formatWindowYears = (days) => {
    const years = daysToYears(days);
    const endYear = new Date().getFullYear();
    const startYear = endYear - years + 1;
    if (years === 1) return `năm ${endYear}`;
    return `từ năm ${startYear} đến năm ${endYear}`;
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

.badge.points {
    background: #e8f7ed;
    color: #1f8f3b;
}

.badge.new-member {
    background: #fff3cd;
    color: #8a5a00;
}

.badge.spend-only {
    background: #eef2ff;
    color: #4338ca;
}

.badge.warning {
    background: #fdecec;
    color: #d33939;
}

.condition-note {
    color: #8a5a00;
    font-size: 0.78rem;
    margin-top: 0.25rem;
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

.form-grid label.inline small {
    display: block;
    color: #777;
    font-weight: 400;
    margin-top: 0.15rem;
}

.condition-help {
    grid-column: 1 / -1;
    margin: 0;
    color: #8a5a44;
    font-size: 0.85rem;
}

.field-guide {
    grid-column: 1 / -1;
    border: 1px solid #ffe0d1;
    border-radius: 10px;
    background: #fff8f4;
    padding: 0.9rem 1rem;
}

.field-guide-title {
    font-weight: 700;
    color: #7c2d12;
    margin-bottom: 0.5rem;
}

.field-guide ul {
    margin: 0;
    padding-left: 1.1rem;
    columns: 2;
    column-gap: 1.5rem;
}

.field-guide li {
    break-inside: avoid;
    margin-bottom: 0.35rem;
    color: #5f5048;
    font-size: 0.84rem;
    line-height: 1.4;
}

.field-guide strong {
    color: #2f2926;
}

@media (max-width: 720px) {
    .header {
        flex-direction: column;
        align-items: flex-start;
    }

    .voucher-table {
        min-width: 600px;
    }

    .field-guide ul {
        columns: 1;
    }
}
</style>

