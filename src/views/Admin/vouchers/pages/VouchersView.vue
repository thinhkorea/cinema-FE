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
                            <th>Trạng thái</th>
                            <th></th>
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
                            <td>
                                <span :class="['status', getVoucherStatusClass(voucher)]">
                                    {{ getVoucherStatusText(voucher) }}
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

    .voucher-stats {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .voucher-table {
        min-width: 980px;
    }

    .field-guide ul {
        columns: 1;
    }
}

@media (max-width: 520px) {
    .voucher-stats {
        grid-template-columns: 1fr;
    }
}
</style>

