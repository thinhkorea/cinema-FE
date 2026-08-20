<template>
    <div class="voucher-page">
        <div class="header">
            <div>
                <h3 class="title">Kho voucher</h3>
                <p class="subtitle">Lưu trữ mã giảm giá, theo dõi lượt dùng, HSD và điều kiện áp dụng.</p>
            </div>
            <button class="btn-primary" @click="openCreate">
                <i class="bi bi-plus-lg"></i>
                <span>Tạo voucher</span>
            </button>
        </div>

        <div v-if="loading" class="loading">Đang tải dữ liệu...</div>

        <div v-else>
            <div class="voucher-stats">
                <div class="voucher-stat-card">
                    <span>Tổng voucher</span>
                    <strong>{{ voucherStats.total }}</strong>
                </div>
                <div class="voucher-stat-card">
                    <span>Đang bật</span>
                    <strong>{{ voucherStats.active }}</strong>
                </div>
                <div class="voucher-stat-card">
                    <span>Còn lượt dùng</span>
                    <strong>{{ voucherStats.available }}</strong>
                </div>
                <div class="voucher-stat-card warning">
                    <span>Sắp hết hạn</span>
                    <strong>{{ voucherStats.expiringSoon }}</strong>
                </div>
            </div>

            <div class="table-wrap">
                <table class="voucher-table">
                    <thead>
                        <tr>
                            <th>Voucher</th>
                            <th>Giá trị</th>
                            <th>Điều kiện</th>
                            <th>Lượt dùng</th>
                            <th>HSD</th>
                            <th class="status-heading">Trạng thái</th>
                            <th class="actions-heading">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="voucher in paginatedVouchers" :key="voucher.voucherId">
                            <td>
                                <div class="voucher-identity">
                                    <div class="code">{{ voucher.code }}</div>
                                    <strong>{{ voucher.name }}</strong>
                                    <span v-if="voucher.description">{{ voucher.description }}</span>
                                </div>
                            </td>
                            <td class="value-cell">
                                <strong>{{ formatValue(voucher) }}</strong>
                                <span>{{ voucher.type === "PERCENT" ? "Theo phần trăm" : "Giảm cố định" }}</span>
                            </td>
                            <td>
                                <div class="condition-stack">
                                    <span
                                        v-for="condition in getConditionLabels(voucher)"
                                        :key="condition"
                                        class="condition-pill"
                                    >
                                        {{ condition }}
                                    </span>
                                    <span
                                        v-if="looksLikeNewMemberVoucher(voucher) && !voucher.newMemberOnly"
                                        class="condition-pill danger"
                                    >
                                        Chưa bật điều kiện khách mới
                                    </span>
                                </div>
                            </td>
                            <td>
                                <div class="usage-cell">
                                    <div class="usage-text">
                                        <strong>{{ Number(voucher.usedCount || 0) }}</strong>
                                        <span>/ {{ formatUsageLimit(voucher) }}</span>
                                    </div>
                                    <div v-if="hasUsageLimit(voucher)" class="usage-track">
                                        <div :style="{ width: `${getUsagePercent(voucher)}%` }"></div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div class="expiry-cell">
                                    <strong>{{ formatDateRange(voucher) }}</strong>
                                    <span :class="['expiry-status', getExpiryState(voucher)]">
                                        {{ getExpiryText(voucher) }}
                                    </span>
                                </div>
                            </td>
                            <td class="status-cell">
                                <span :class="['status', getVoucherStatusClass(voucher)]">
                                    {{ getVoucherStatusText(voucher) }}
                                </span>
                            </td>
                            <td class="actions">
                                <div class="action-buttons">
                                    <button
                                        class="btn-icon-action gift"
                                        :disabled="!canAssignVoucher(voucher)"
                                        :title="canAssignVoucher(voucher) ? 'Tặng voucher' : 'Voucher chưa thể tặng'"
                                        :aria-label="canAssignVoucher(voucher) ? 'Tặng voucher' : 'Voucher chưa thể tặng'"
                                        @click="openAssign(voucher)"
                                    >
                                        <i class="bi bi-gift-fill"></i>
                                    </button>
                                    <button
                                        class="btn-icon-action edit"
                                        title="Sửa voucher"
                                        aria-label="Sửa voucher"
                                        @click="openEdit(voucher)"
                                    >
                                        <i class="bi bi-pencil-square"></i>
                                    </button>
                                    <button
                                        class="btn-icon-action toggle"
                                        :class="{ inactive: !voucher.active }"
                                        :title="voucher.active ? 'Tắt voucher' : 'Bật voucher'"
                                        :aria-label="voucher.active ? 'Tắt voucher' : 'Bật voucher'"
                                        @click="toggleActive(voucher)"
                                    >
                                        <i :class="voucher.active ? 'bi bi-toggle-on' : 'bi bi-toggle-off'"></i>
                                    </button>
                                    <button
                                        class="btn-icon-action danger"
                                        title="Xóa voucher"
                                        aria-label="Xóa voucher"
                                        @click="removeVoucher(voucher)"
                                    >
                                        <i class="bi bi-trash3-fill"></i>
                                    </button>
                                </div>
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

        <div v-if="assignModalOpen" class="voucher-modal-backdrop" @click="closeAssignModal">
            <div class="voucher-modal assign-modal" @click.stop>
                <div class="voucher-modal-header">
                    <h4>Tặng voucher cho khách hàng</h4>
                    <button class="btn-close" @click="closeAssignModal">×</button>
                </div>
                <div class="voucher-modal-body">
                    <div v-if="assignVoucherTarget" class="assign-voucher-summary">
                        <div>
                            <div class="code">{{ assignVoucherTarget.code }}</div>
                            <strong>{{ assignVoucherTarget.name }}</strong>
                            <span>{{ formatValue(assignVoucherTarget) }} · {{ formatDateRange(assignVoucherTarget) }}</span>
                        </div>
                        <span :class="['status', getVoucherStatusClass(assignVoucherTarget)]">
                            {{ getVoucherStatusText(assignVoucherTarget) }}
                        </span>
                    </div>

                    <div class="assign-section">
                        <div class="assign-section-head">
                            <strong>Khách mua nhiều trong tháng này</strong>
                            <small v-if="topCustomersLoading">Đang tải...</small>
                        </div>
                        <div v-if="topMonthlyCustomers.length" class="top-customer-list">
                            <button
                                v-for="customer in topMonthlyCustomers"
                                :key="customer.userId || customer.customerId || customer.rank"
                                type="button"
                                class="top-customer-item"
                                :class="{ selected: isSelectedCustomer(customer) }"
                                @click="selectAssignCustomer(customer)"
                            >
                                <span class="rank-label" :class="getAssignRankClass(customer.rank)">
                                    {{ getAssignRankLabel(customer.rank) }}
                                </span>
                                <span class="customer-info">
                                    <strong>{{ getCustomerName(customer) }}</strong>
                                    <small>
                                        {{ formatCustomerContact(customer) }} · {{ formatCurrency(customer.totalSpent) }}
                                    </small>
                                </span>
                            </button>
                        </div>
                        <div v-else-if="!topCustomersLoading" class="assign-empty">
                            Chưa có khách hàng mua vé trong tháng này.
                        </div>
                    </div>

                    <div class="assign-section">
                        <label class="assign-search">
                            Tìm khách hàng
                            <input
                                v-model.trim="assignCustomerKeyword"
                                type="search"
                                placeholder="Tên, email hoặc số điện thoại"
                            />
                        </label>

                        <div v-if="customersLoading" class="assign-loading">Đang tải danh sách khách hàng...</div>
                        <div v-else-if="filteredAssignCustomers.length" class="assign-customer-list">
                            <label
                                v-for="customer in filteredAssignCustomers"
                                :key="customer.userId"
                                class="assign-customer-option"
                                :class="{
                                    selected: isSelectedCustomer(customer),
                                    locked: customer.isActive === false,
                                }"
                            >
                                <input
                                    v-model.number="selectedCustomerId"
                                    type="radio"
                                    :value="customer.userId"
                                    :disabled="customer.isActive === false"
                                />
                                <span class="customer-info">
                                    <strong>{{ getCustomerName(customer) }}</strong>
                                    <small>
                                        {{ formatCustomerContact(customer) }}
                                        <template v-if="customer.isActive === false"> · Tài khoản bị khóa</template>
                                    </small>
                                </span>
                            </label>
                        </div>
                        <div v-else class="assign-empty">
                            Không tìm thấy khách hàng phù hợp.
                        </div>
                    </div>

                    <div v-if="selectedAssignCustomer" class="assign-selected">
                        <span>Người nhận</span>
                        <strong>{{ getCustomerName(selectedAssignCustomer) }}</strong>
                        <small>{{ formatCustomerContact(selectedAssignCustomer) }}</small>
                    </div>
                </div>
                <div class="voucher-modal-footer">
                    <button class="btn-outline" :disabled="assigningVoucher" @click="closeAssignModal">Hủy</button>
                    <button
                        class="btn-primary"
                        :disabled="assigningVoucher || !selectedCustomerId"
                        @click="assignVoucherToCustomer"
                    >
                        <i class="bi bi-gift"></i>
                        <span>{{ assigningVoucher ? "Đang tặng..." : "Tặng voucher" }}</span>
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
const assignModalOpen = ref(false);
const assignVoucherTarget = ref(null);
const customers = ref([]);
const topMonthlyCustomers = ref([]);
const customersLoading = ref(false);
const topCustomersLoading = ref(false);
const assignCustomerKeyword = ref("");
const selectedCustomerId = ref("");
const assigningVoucher = ref(false);
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
const voucherStats = computed(() => {
    const now = new Date();
    const soon = new Date(now);
    soon.setDate(soon.getDate() + 14);

    return vouchers.value.reduce(
        (stats, voucher) => {
            stats.total += 1;
            if (voucher.active) stats.active += 1;
            if (isVoucherUsableStock(voucher, now)) stats.available += 1;

            const endAt = parseDate(voucher.endAt);
            if (endAt && endAt >= now && endAt <= soon) {
                stats.expiringSoon += 1;
            }

            return stats;
        },
        { total: 0, active: 0, available: 0, expiringSoon: 0 },
    );
});
const topMonthlyCustomerIds = computed(() => {
    return new Set(topMonthlyCustomers.value.map((customer) => Number(customer.userId || 0)).filter(Boolean));
});
const filteredAssignCustomers = computed(() => {
    const keyword = normalizeText(assignCustomerKeyword.value);
    const topIds = topMonthlyCustomerIds.value;

    return customers.value
        .filter((customer) => {
            if (topIds.has(Number(customer.userId || 0))) return false;
            if (!keyword) return true;
            return normalizeText(
                `${customer.fullName || ""} ${customer.email || ""} ${customer.phone || ""}`,
            ).includes(keyword);
        })
        .sort((left, right) => Number(right.isActive === true) - Number(left.isActive === true))
        .slice(0, 12);
});
const selectedAssignCustomer = computed(() => {
    const selectedId = Number(selectedCustomerId.value || 0);
    if (!selectedId) return null;

    return (
        customers.value.find((customer) => Number(customer.userId) === selectedId) ||
        topMonthlyCustomers.value.find((customer) => Number(customer.userId) === selectedId) ||
        null
    );
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

const openAssign = async (voucher) => {
    if (!canAssignVoucher(voucher)) {
        await showCinemaAlert({
            icon: "warning",
            title: "Voucher chưa thể tặng",
            text: "Chỉ có thể tặng voucher đang bật, chưa hết hạn và còn lượt dùng.",
        });
        return;
    }

    assignVoucherTarget.value = voucher;
    assignCustomerKeyword.value = "";
    selectedCustomerId.value = "";
    assignModalOpen.value = true;
    await Promise.allSettled([fetchAssignCustomers(), fetchTopMonthlyCustomers()]);
};

const closeAssignModal = (force = false) => {
    if (assigningVoucher.value && !force) return;
    assignModalOpen.value = false;
    assignVoucherTarget.value = null;
    assignCustomerKeyword.value = "";
    selectedCustomerId.value = "";
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

const fetchAssignCustomers = async () => {
    if (customers.value.length) return;

    try {
        customersLoading.value = true;
        const { data } = await api.get("/admin/users");
        customers.value = Array.isArray(data) ? data : [];
    } catch (err) {
        await showCinemaAlert({
            icon: "error",
            title: "Không thể tải khách hàng",
            text: getApiErrorMessage(err),
        });
    } finally {
        customersLoading.value = false;
    }
};

const fetchTopMonthlyCustomers = async () => {
    const now = new Date();

    try {
        topCustomersLoading.value = true;
        const { data } = await api.get("/admin/revenue/customers/monthly", {
            params: {
                year: now.getFullYear(),
                month: now.getMonth() + 1,
                page: 1,
                pageSize: 5,
            },
        });

        topMonthlyCustomers.value = (data?.items || [])
            .filter((customer) => customer.userId)
            .map((customer, index) => ({
                ...customer,
                rank: Number(customer.rank || index + 1),
                userId: Number(customer.userId),
                totalSpent: Number(customer.totalSpent || 0),
            }));
    } catch (err) {
        console.error("Top monthly customers load failed:", err);
        topMonthlyCustomers.value = [];
    } finally {
        topCustomersLoading.value = false;
    }
};

const assignVoucherToCustomer = async () => {
    if (!assignVoucherTarget.value || !selectedCustomerId.value) {
        await showCinemaAlert({
            icon: "warning",
            title: "Chọn khách hàng",
            text: "Vui lòng chọn khách hàng cần tặng voucher.",
        });
        return;
    }

    const customer = selectedAssignCustomer.value;
    const confirmed = await showCinemaAlert({
        icon: "question",
        title: "Tặng voucher?",
        text: `Tặng voucher ${assignVoucherTarget.value.code} cho ${getCustomerName(customer)}?`,
        showCancelButton: true,
        confirmButtonText: "Tặng",
        cancelButtonText: "Hủy",
    });

    if (!confirmed.isConfirmed) return;

    try {
        assigningVoucher.value = true;
        const { data } = await api.post(`/admin/vouchers/${assignVoucherTarget.value.voucherId}/assign`, {
            userId: Number(selectedCustomerId.value),
        });

        await showCinemaAlert({
            icon: data?.alreadyAssigned ? "info" : "success",
            title: data?.alreadyAssigned ? "Khách đã có voucher này" : "Đã tặng voucher",
            text: `${data?.voucherCode || assignVoucherTarget.value.code} · ${data?.customerName || getCustomerName(customer)}`,
            timer: 1500,
        });

        closeAssignModal(true);
    } catch (err) {
        await showCinemaAlert({
            icon: "error",
            title: "Không thể tặng voucher",
            text: getApiErrorMessage(err),
        });
    } finally {
        assigningVoucher.value = false;
    }
};

const selectAssignCustomer = (customer) => {
    if (!customer?.userId) return;
    selectedCustomerId.value = Number(customer.userId);
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

const formatDate = (value) => {
    const date = parseDate(value);
    if (!date) return "";
    return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

const formatDateRange = (voucher) => {
    const start = formatDate(voucher.startAt);
    const end = formatDate(voucher.endAt);
    if (start && end) return `${start} - ${end}`;
    if (end) return `Đến ${end}`;
    if (start) return `Từ ${start}`;
    return "Không giới hạn";
};

const formatWindowYears = (days) => {
    const years = daysToYears(days);
    const endYear = new Date().getFullYear();
    const startYear = endYear - years + 1;
    if (years === 1) return `năm ${endYear}`;
    return `từ năm ${startYear} đến năm ${endYear}`;
};

const parseDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
};

const hasUsageLimit = (voucher) => Number(voucher.usageLimit || 0) > 0;

const formatUsageLimit = (voucher) => {
    return hasUsageLimit(voucher) ? Number(voucher.usageLimit || 0) : "Không giới hạn";
};

const getUsagePercent = (voucher) => {
    if (!hasUsageLimit(voucher)) return 0;
    const used = Number(voucher.usedCount || 0);
    const limit = Number(voucher.usageLimit || 0);
    return Math.min(100, Math.max(0, Math.round((used / limit) * 100)));
};

const isUsageSoldOut = (voucher) => {
    return hasUsageLimit(voucher) && Number(voucher.usedCount || 0) >= Number(voucher.usageLimit || 0);
};

const getExpiryState = (voucher) => {
    const now = new Date();
    const start = parseDate(voucher.startAt);
    const end = parseDate(voucher.endAt);
    if (end && now > end) return "expired";
    if (start && now < start) return "upcoming";
    if (end) {
        const soon = new Date(now);
        soon.setDate(soon.getDate() + 14);
        if (end <= soon) return "ending";
    }
    return "active";
};

const getExpiryText = (voucher) => {
    const state = getExpiryState(voucher);
    if (state === "expired") return "Đã hết hạn";
    if (state === "upcoming") return "Sắp diễn ra";
    if (state === "ending") return "Sắp hết hạn";
    return "Đang hiệu lực";
};

const isVoucherUsableStock = (voucher, now = new Date()) => {
    if (!voucher.active || isUsageSoldOut(voucher)) return false;
    const start = parseDate(voucher.startAt);
    const end = parseDate(voucher.endAt);
    if (start && now < start) return false;
    if (end && now > end) return false;
    return true;
};

const canAssignVoucher = (voucher) => {
    if (!voucher?.active || isUsageSoldOut(voucher)) return false;
    return getExpiryState(voucher) !== "expired";
};

const getVoucherStatusClass = (voucher) => {
    if (!voucher.active) return "inactive";
    if (isUsageSoldOut(voucher)) return "sold-out";
    if (getExpiryState(voucher) === "expired") return "expired";
    if (getExpiryState(voucher) === "upcoming") return "upcoming";
    return "active";
};

const getVoucherStatusText = (voucher) => {
    const status = getVoucherStatusClass(voucher);
    if (status === "inactive") return "Đã tắt";
    if (status === "sold-out") return "Hết lượt";
    if (status === "expired") return "Hết hạn";
    if (status === "upcoming") return "Chưa đến hạn";
    return "Đang bán";
};

const getConditionLabels = (voucher) => {
    const conditions = [];
    if (voucher.minOrder) conditions.push(`Đơn từ ${formatCurrency(voucher.minOrder)}`);
    if (voucher.maxDiscount && voucher.type === "PERCENT") {
        conditions.push(`Giảm tối đa ${formatCurrency(voucher.maxDiscount)}`);
    }
    if (voucher.requiredTotalSpent) {
        conditions.push(`Đã tiêu từ ${formatCurrency(voucher.requiredTotalSpent)} trong ${formatWindowYears(voucher.spendingWindowDays)}`);
    }
    if (voucher.newMemberOnly) conditions.push("Chỉ khách mới");
    if (Number(voucher.perUserLimit || 0) > 0) conditions.push(`${voucher.perUserLimit} lượt / tài khoản`);
    return conditions.length ? conditions : ["Không yêu cầu"];
};

const getCustomerName = (customer) => {
    return customer?.fullName || customer?.customerName || customer?.email || customer?.phone || "Khách hàng";
};

const formatCustomerContact = (customer) => {
    return customer?.email || customer?.phone || "Chưa có liên hệ";
};

const isSelectedCustomer = (customer) => {
    return Number(customer?.userId || 0) === Number(selectedCustomerId.value || 0);
};

const getAssignRankClass = (rank) => {
    const rankNumber = Number(rank || 0);
    return rankNumber >= 1 && rankNumber <= 3 ? `rank-${rankNumber}` : "rank-default";
};

const getAssignRankLabel = (rank) => {
    const rankNumber = Number(rank || 0);
    return rankNumber >= 1 && rankNumber <= 3 ? `TOP ${rankNumber}` : `#${rankNumber}`;
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
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    background: #ff6b35;
    color: #fff;
    border: none;
    padding: 0.6rem 1.2rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
}

.btn-primary:disabled,
.btn-outline:disabled {
    opacity: 0.65;
    cursor: not-allowed;
}

.voucher-stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
}

.voucher-stat-card {
    background: #fff;
    border: 1px solid #f0ddd5;
    border-radius: 10px;
    padding: 1rem;
    box-shadow: 0 8px 20px rgba(255, 107, 53, 0.08);
}

.voucher-stat-card span {
    display: block;
    color: #6f6159;
    font-size: 0.82rem;
    font-weight: 700;
    margin-bottom: 0.35rem;
}

.voucher-stat-card strong {
    color: #2f2926;
    font-size: 1.6rem;
    line-height: 1;
}

.voucher-stat-card.warning strong {
    color: #d97706;
}

.btn-outline {
    background: #fff;
    border: 1px solid #ddd;
    padding: 0.6rem 1.2rem;
    border-radius: 8px;
    cursor: pointer;
}

.btn-icon-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border: 1px solid #f0ddd5;
    border-radius: 8px;
    background: #fffdfb;
    color: #ff6b35;
    cursor: pointer;
    vertical-align: middle;
    transition:
        background 0.18s ease,
        border-color 0.18s ease,
        box-shadow 0.18s ease,
        color 0.18s ease,
        transform 0.18s ease;
}

.btn-icon-action i {
    font-size: 1.25rem;
    line-height: 1;
}

.btn-icon-action:hover:not(:disabled) {
    background: #fff1e8;
    border-color: #ffd4c2;
    box-shadow: 0 8px 18px rgba(255, 107, 53, 0.12);
    transform: translateY(-1px);
}

.btn-icon-action.gift {
    color: #1f8f3b;
    background: #f4fbf6;
    border-color: #d8f0df;
}

.btn-icon-action.gift:hover:not(:disabled) {
    background: #eefaf1;
    border-color: #c8edd3;
    box-shadow: 0 8px 18px rgba(31, 143, 59, 0.12);
}

.btn-icon-action.edit {
    color: #ff6b35;
}

.btn-icon-action.toggle {
    color: #1f8f3b;
    background: #f4fbf6;
    border-color: #d8f0df;
}

.btn-icon-action.toggle i {
    font-size: 1.55rem;
}

.btn-icon-action.toggle.inactive {
    color: #8a5a00;
    background: #fff9e8;
    border-color: #f4df9b;
}

.btn-icon-action.danger {
    color: #dc3545;
    background: #fffafa;
    border-color: #f6d4d4;
}

.btn-icon-action.danger:hover:not(:disabled) {
    background: #fdecec;
    border-color: #f6bcbc;
    box-shadow: 0 8px 18px rgba(220, 53, 69, 0.12);
}

.btn-icon-action:disabled {
    color: #aaa;
    cursor: not-allowed;
    opacity: 0.65;
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
    min-width: 1120px;
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
    color: #ff6b35;
    letter-spacing: 0.04em;
}

.voucher-identity {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 190px;
}

.voucher-identity strong {
    color: #2f2926;
}

.voucher-identity span,
.value-cell span,
.expiry-cell span {
    color: #7a6b63;
    font-size: 0.82rem;
}

.value-cell {
    min-width: 120px;
}

.value-cell strong {
    display: block;
    color: #2f2926;
    margin-bottom: 0.2rem;
}

.condition-stack {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    max-width: 360px;
}

.condition-pill {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    border: 1px solid #f6d7ca;
    border-radius: 999px;
    background: #fff8f4;
    color: #6b4c3b;
    padding: 0.22rem 0.55rem;
    font-size: 0.76rem;
    font-weight: 700;
    line-height: 1.2;
}

.condition-pill.danger {
    background: #fdecec;
    border-color: #f6bcbc;
    color: #b42323;
}

.usage-cell {
    min-width: 120px;
}

.usage-text {
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
    color: #6f6159;
}

.usage-text strong {
    color: #2f2926;
    font-size: 1rem;
}

.usage-track {
    height: 6px;
    margin-top: 0.45rem;
    border-radius: 999px;
    overflow: hidden;
    background: #f2e0d8;
}

.usage-track > div {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #ff6b35, #ffb18f);
}

.expiry-cell {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 150px;
}

.expiry-cell strong {
    color: #2f2926;
    font-size: 0.9rem;
}

.expiry-status {
    width: fit-content;
    border-radius: 999px;
    padding: 0.18rem 0.5rem;
    font-weight: 700;
}

.expiry-status.active {
    background: #e8f7ed;
    color: #1f8f3b;
}

.expiry-status.ending,
.expiry-status.upcoming {
    background: #fff3cd;
    color: #8a5a00;
}

.expiry-status.expired {
    background: #fdecec;
    color: #d33939;
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
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 82px;
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 600;
    line-height: 1.2;
    white-space: nowrap;
}

.status-cell,
.status-heading {
    min-width: 112px;
    white-space: nowrap;
}

.status.active {
    background: #e8f7ed;
    color: #1f8f3b;
}

.status.inactive {
    background: #fdecec;
    color: #d33939;
}

.status.sold-out,
.status.expired {
    background: #f3f4f6;
    color: #4b5563;
}

.status.upcoming {
    background: #fff3cd;
    color: #8a5a00;
}

.actions {
    min-width: 210px;
    text-align: right;
    white-space: nowrap;
}

.actions-heading {
    text-align: right;
}

.action-buttons {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.45rem;
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
    display: flex;
    flex-direction: column;
    background: #fff;
    border-radius: 16px;
    max-width: 760px;
    max-height: calc(100vh - 2rem);
    width: 100%;
    overflow: hidden;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
}

.voucher-modal.assign-modal {
    max-width: 820px;
}

.voucher-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
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
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    padding: 1rem 1.5rem 0.5rem;
}

.voucher-modal-footer {
    flex-shrink: 0;
    padding: 1rem 1.5rem 1.5rem;
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    border-top: 1px solid #f0f0f0;
    background: #fff;
}

.assign-voucher-summary {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    border: 1px solid #f0ddd5;
    border-radius: 10px;
    background: #fffaf7;
    padding: 0.9rem 1rem;
    margin-bottom: 1rem;
}

.assign-voucher-summary > div {
    display: grid;
    gap: 0.2rem;
}

.assign-voucher-summary strong {
    color: #2f2926;
}

.assign-voucher-summary span:not(.status) {
    color: #6f6159;
    font-size: 0.85rem;
}

.assign-section {
    border: 1px solid #eee2dc;
    border-radius: 10px;
    padding: 0.9rem;
    margin-bottom: 1rem;
}

.assign-section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.75rem;
}

.assign-section-head strong {
    color: #2f2926;
}

.assign-section-head small {
    color: #7a6b63;
}

.top-customer-list,
.assign-customer-list {
    display: grid;
    gap: 0.55rem;
}

.top-customer-item,
.assign-customer-option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    border: 1px solid #eee2dc;
    border-radius: 8px;
    background: #fff;
    color: #2f2926;
    padding: 0.7rem 0.8rem;
    text-align: left;
}

.top-customer-item {
    cursor: pointer;
}

.top-customer-item:hover,
.assign-customer-option:hover {
    border-color: #ffc7ad;
    background: #fff8f4;
}

.top-customer-item.selected,
.assign-customer-option.selected {
    border-color: #ff6b35;
    background: #fff1e8;
}

.assign-customer-option.locked {
    opacity: 0.68;
}

.assign-customer-option input {
    width: 16px;
    height: 16px;
    accent-color: #ff6b35;
}

.customer-info {
    display: grid;
    gap: 0.15rem;
    min-width: 0;
}

.customer-info strong,
.customer-info small {
    overflow-wrap: anywhere;
}

.customer-info small {
    color: #7a6b63;
    font-size: 0.8rem;
}

.rank-label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 48px;
    height: 28px;
    border-radius: 999px;
    background: #f3f4f6;
    color: #4b5563;
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0;
    white-space: nowrap;
}

.rank-label.rank-1 {
    background: #fff7d6;
    color: #8a5a00;
}

.rank-label.rank-2 {
    background: #eef4ff;
    color: #24579d;
}

.rank-label.rank-3 {
    background: #fff0e3;
    color: #9d420d;
}

.assign-search {
    display: grid;
    gap: 0.4rem;
    color: #333;
    font-size: 0.9rem;
    margin-bottom: 0.75rem;
}

.assign-search input {
    border: 1px solid #d9d9d9;
    border-radius: 8px;
    padding: 0.55rem 0.65rem;
    font-size: 0.95rem;
}

.assign-loading,
.assign-empty {
    border: 1px dashed #d8cbc4;
    border-radius: 8px;
    background: #fffdfb;
    color: #7a6b63;
    padding: 1rem;
    text-align: center;
}

.assign-selected {
    display: grid;
    gap: 0.15rem;
    border: 1px solid #d8f0df;
    border-radius: 10px;
    background: #f0fbf3;
    padding: 0.85rem 1rem;
}

.assign-selected span {
    color: #1f8f3b;
    font-size: 0.78rem;
    font-weight: 800;
    text-transform: uppercase;
}

.assign-selected strong {
    color: #1f3f2a;
}

.assign-selected small {
    color: #4f6f58;
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

    .voucher-stats {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .voucher-table {
        min-width: 980px;
    }
}

@media (max-width: 520px) {
    .voucher-stats {
        grid-template-columns: 1fr;
    }
}
</style>

