<template>
    <div class="container py-4">
        <!-- Tabs: Customers & Staffs -->
        <div class="mb-4">
            <ul class="nav nav-tabs" role="tablist">
                <li class="nav-item" role="presentation">
                    <button
                        class="nav-link"
                        :class="{ active: activeTab === 'customers' }"
                        @click="activeTab = 'customers'"
                        type="button"
                    >
                        <i class="bi bi-person-circle me-2"></i> Khách hàng
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button
                        class="nav-link"
                        :class="{ active: activeTab === 'staffs' }"
                        @click="activeTab = 'staffs'"
                        type="button"
                    >
                        <i class="bi bi-person-workspace me-2"></i> Nhân viên
                    </button>
                </li>
            </ul>
        </div>

        <!-- Tab Content: Customers -->
        <div v-show="activeTab === 'customers'" class="full-width-section">
            <h5 class="mb-4">Danh sách khách hàng</h5>

            <div class="filter-bar mb-3">
                <div class="filter-search">
                    <i class="bi bi-search"></i>
                    <input
                        v-model.trim="customerFilters.keyword"
                        type="search"
                        class="form-control"
                        placeholder="Tìm theo tên, email, số điện thoại"
                    />
                </div>
                <select v-model="customerFilters.status" class="form-select filter-select">
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">Hoạt động</option>
                    <option value="locked">Bị khóa</option>
                </select>
                <button class="btn btn-outline-secondary filter-reset" @click="resetCustomerFilters">
                    <i class="bi bi-arrow-counterclockwise"></i>
                </button>
            </div>
            <div class="advanced-filter mb-3">
                <select v-model="customerFilters.gender" class="form-select">
                    <option value="all">Tất cả giới tính</option>
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                </select>
                <input
                    v-model.number="customerFilters.minPoints"
                    type="number"
                    min="0"
                    class="form-control"
                    placeholder="Điểm từ"
                />
                <input
                    v-model.number="customerFilters.maxPoints"
                    type="number"
                    min="0"
                    class="form-control"
                    placeholder="Điểm đến"
                />
            </div>

            <div v-if="loadingUsers" class="text-center py-5">
                <div class="spinner-border text-primary"></div>
            </div>

            <div v-else-if="customers.length === 0" class="text-muted py-3">Chưa có khách hàng nào</div>
            <div v-else-if="filteredCustomers.length === 0" class="text-muted py-3">
                Không có khách hàng phù hợp với bộ lọc.
            </div>

            <div v-else class="table-responsive">
                <table class="table table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>#</th>
                            <th>Email</th>
                            <th>Tên đầy đủ</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(user, index) in filteredCustomers" :key="user.userId">
                            <td>{{ index + 1 }}</td>
                            <td class="fw-semibold">{{ user.email || "N/A" }}</td>
                            <td>{{ user.fullName || "N/A" }}</td>
                            <td>
                                <span class="badge" :class="user.isActive ? 'bg-success' : 'bg-danger'">
                                    {{ user.isActive ? "Hoạt động" : "Bị khóa" }}
                                </span>
                            </td>
                            <td>
                                <button
                                    class="btn btn-sm btn-outline-secondary me-2"
                                    @click="openAccountDetail(user, 'customer')"
                                    title="Xem chi tiết"
                                >
                                    <i class="bi bi-eye"></i> Chi tiết
                                </button>
                                <button
                                    class="btn btn-sm btn-outline-primary me-2"
                                    @click="openBookingHistory(user)"
                                    title="Xem lịch sử giao dịch"
                                >
                                    <i class="bi bi-receipt"></i> Lịch sử
                                </button>
                                <button
                                    v-if="user.isActive"
                                    class="btn btn-sm btn-warning me-2"
                                    @click="lockUser(user.userId)"
                                    title="Khóa tài khoản"
                                >
                                    <i class="bi bi-lock"></i> Khóa
                                </button>
                                <button
                                    v-else
                                    class="btn btn-sm btn-info me-2"
                                    @click="unlockUser(user.userId)"
                                    title="Mở khóa tài khoản"
                                >
                                    <i class="bi bi-unlock"></i> Mở khóa
                                </button>
                                <button
                                    class="btn btn-sm btn-outline-danger"
                                    @click="deleteUser(user.userId, user.email)"
                                    title="Xóa tài khoản"
                                >
                                    <i class="bi bi-trash"></i> Xóa
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Tab Content: Staffs -->
        <div v-show="activeTab === 'staffs'" class="full-width-section">
            <h5 class="mb-4">Danh sách nhân viên</h5>

            <div class="filter-bar mb-3">
                <div class="filter-search">
                    <i class="bi bi-search"></i>
                    <input
                        v-model.trim="staffFilters.keyword"
                        type="search"
                        class="form-control"
                        placeholder="Tìm theo tên, email, số điện thoại"
                    />
                </div>
                <select v-model="staffFilters.status" class="form-select filter-select">
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">Hoạt động</option>
                    <option value="locked">Bị khóa</option>
                </select>
                <button class="btn btn-outline-secondary filter-reset" @click="resetStaffFilters">
                    <i class="bi bi-arrow-counterclockwise"></i>
                </button>
            </div>
            <div class="advanced-filter mb-3">
                <select v-model="staffFilters.gender" class="form-select">
                    <option value="all">Tất cả giới tính</option>
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                </select>
                <input v-model.trim="staffFilters.position" type="search" class="form-control" placeholder="Chức vụ" />
                <input
                    v-model.number="staffFilters.minSalary"
                    type="number"
                    min="0"
                    class="form-control"
                    placeholder="Lương từ"
                />
                <input
                    v-model.number="staffFilters.maxSalary"
                    type="number"
                    min="0"
                    class="form-control"
                    placeholder="Lương đến"
                />
            </div>

            <div v-if="loadingStaffs" class="text-center py-5">
                <div class="spinner-border text-primary"></div>
            </div>

            <div v-else-if="staffs.length === 0" class="text-muted py-3">Chưa có nhân viên nào</div>
            <div v-else-if="filteredStaffs.length === 0" class="text-muted py-3">
                Không có nhân viên phù hợp với bộ lọc.
            </div>

            <div v-else class="table-responsive">
                <table class="table table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>#</th>
                            <th>Tên đầy đủ</th>
                            <th>Email</th>
                            <th>Điện thoại</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(staff, index) in filteredStaffs" :key="staff.staffId">
                            <td>{{ index + 1 }}</td>
                            <td>{{ staff.fullName || "N/A" }}</td>
                            <td>{{ staff.email || "N/A" }}</td>
                            <td>{{ staff.phone || "N/A" }}</td>
                            <td>
                                <span class="badge" :class="staff.isActive ? 'bg-success' : 'bg-danger'">
                                    {{ staff.isActive ? "Hoạt động" : "Bị khóa" }}
                                </span>
                            </td>
                            <td>
                                <button
                                    class="btn btn-sm btn-outline-secondary me-2"
                                    @click="openAccountDetail(staff, 'staff')"
                                    title="Xem chi tiết"
                                >
                                    <i class="bi bi-eye"></i> Chi tiết
                                </button>
                                <button
                                    v-if="staff.isActive"
                                    class="btn btn-sm btn-warning me-2"
                                    @click="lockStaff(staff.email, staff.userId)"
                                    title="Khóa tài khoản"
                                >
                                    <i class="bi bi-lock"></i> Khóa
                                </button>
                                <button
                                    v-else
                                    class="btn btn-sm btn-info me-2"
                                    @click="unlockStaff(staff.email, staff.userId)"
                                    title="Mở khóa tài khoản"
                                >
                                    <i class="bi bi-unlock"></i> Mở khóa
                                </button>
                                <button
                                    class="btn btn-sm btn-outline-danger"
                                    @click="deleteStaff(staff.email, staff.userId)"
                                    title="Xóa tài khoản"
                                >
                                    <i class="bi bi-trash"></i> Xóa
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div v-if="selectedAccount" class="detail-backdrop" @click="closeAccountDetail">
            <div class="detail-modal" @click.stop>
                <div class="detail-head">
                    <div>
                        <p class="text-muted small mb-1">
                            {{ selectedAccount.type === "staff" ? "Nhân viên" : "Khách hàng" }}
                        </p>
                        <h5 class="mb-0">
                            {{ selectedAccount.data.fullName || selectedAccount.data.email }}
                        </h5>
                    </div>
                    <button type="button" class="btn-close" @click="closeAccountDetail"></button>
                </div>

                <div class="detail-grid mt-3">
                    <div v-for="item in accountDetailRows" :key="item.label" class="detail-item">
                        <span>{{ item.label }}</span>
                        <strong>{{ item.value }}</strong>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="historyCustomer" class="detail-backdrop" @click="closeBookingHistory">
            <div class="detail-modal history-modal" @click.stop>
                <div class="detail-head">
                    <div>
                        <p class="text-muted small mb-1">Lịch sử giao dịch</p>
                        <h5 class="mb-0">{{ historyCustomer.fullName || historyCustomer.email }}</h5>
                    </div>
                    <button type="button" class="btn-close" @click="closeBookingHistory"></button>
                </div>

                <div v-if="loadingHistory" class="text-center py-5">
                    <div class="spinner-border text-primary"></div>
                </div>

                <div v-else-if="bookingHistory.length === 0" class="empty-history">
                    Khách hàng này chưa có giao dịch nào.
                </div>

                <div v-else>
                    <div class="filter-bar history-filter mt-3">
                        <div class="filter-search">
                            <i class="bi bi-search"></i>
                            <input
                                v-model.trim="historyFilters.keyword"
                                type="search"
                                class="form-control"
                                placeholder="Tìm mã giao dịch, phim, ghế"
                            />
                        </div>
                        <select v-model="historyFilters.status" class="form-select filter-select">
                            <option value="all">Tất cả trạng thái</option>
                            <option value="PAID">Đã thanh toán</option>
                            <option value="PENDING">Chờ thanh toán</option>
                            <option value="CANCELLED">Đã hủy</option>
                        </select>
                        <button class="btn btn-outline-secondary filter-reset" @click="resetHistoryFilters">
                            <i class="bi bi-arrow-counterclockwise"></i>
                        </button>
                    </div>
                    <div class="advanced-filter history-advanced-filter mt-2">
                        <select v-model="historyFilters.datePreset" class="form-select">
                            <option value="all">Tất cả ngày</option>
                            <option value="today">Hôm nay</option>
                            <option value="thisWeek">Tuần này</option>
                            <option value="thisMonth">Tháng này</option>
                            <option value="custom">Tự chọn ngày</option>
                        </select>
                        <select v-model="historyFilters.paymentMethod" class="form-select">
                            <option value="all">Tất cả thanh toán</option>
                            <option value="VNPAY">VNPay</option>
                            <option value="CASH">Tiền mặt</option>
                            <option value="BANK">Chuyển khoản</option>
                        </select>
                        <input
                            v-model="historyFilters.fromDate"
                            type="date"
                            class="form-control"
                            :disabled="historyFilters.datePreset !== 'custom'"
                        />
                        <input
                            v-model="historyFilters.toDate"
                            type="date"
                            class="form-control"
                            :disabled="historyFilters.datePreset !== 'custom'"
                        />
                        <input
                            v-model.number="historyFilters.minTotal"
                            type="number"
                            min="0"
                            class="form-control"
                            placeholder="Tiền từ"
                        />
                        <input
                            v-model.number="historyFilters.maxTotal"
                            type="number"
                            min="0"
                            class="form-control"
                            placeholder="Tiền đến"
                        />
                    </div>

                    <div v-if="filteredHistoryGroups.length === 0" class="empty-history">
                        Không có giao dịch phù hợp với bộ lọc.
                    </div>

                    <div v-else class="history-list">
                    <div v-for="group in filteredHistoryGroups" :key="group.txnRef" class="history-item">
                        <div class="history-main">
                            <div>
                                <h6 class="mb-1">{{ group.movieTitle || "N/A" }}</h6>
                                <p class="mb-0 text-muted">
                                    Mã GD: {{ group.txnRef || "-" }} · {{ group.ticketCount }} vé · Ghế {{ group.seats || "-" }}
                                </p>
                            </div>
                            <div class="history-actions">
                                <span class="badge" :class="getBookingStatusClass(group.status)">
                                    {{ formatBookingStatus(group.status) }}
                                </span>
                                <button class="btn btn-sm btn-outline-primary" @click="toggleHistoryDetail(group.txnRef)">
                                    <i :class="expandedTxn === group.txnRef ? 'bi bi-chevron-up' : 'bi bi-chevron-down'"></i>
                                    Chi tiết
                                </button>
                            </div>
                        </div>

                        <div class="history-meta">
                            <span><i class="bi bi-door-open me-1"></i>{{ group.roomName || "-" }}</span>
                            <span><i class="bi bi-calendar-event me-1"></i>{{ formatDateTime(group.startTime) }}</span>
                            <span><i class="bi bi-credit-card me-1"></i>{{ group.paymentMethod || "-" }}</span>
                            <span><i class="bi bi-cash-stack me-1"></i>{{ formatCurrency(group.grandTotal) }}</span>
                            <span><i class="bi bi-clock-history me-1"></i>{{ formatDateTime(group.createdAt) }}</span>
                        </div>

                        <div v-if="expandedTxn === group.txnRef" class="history-detail">
                            <div>
                                <h6>Vé đã mua</h6>
                                <div class="detail-table">
                                    <div v-for="ticket in group.bookings" :key="ticket.bookingId" class="detail-row">
                                        <span>{{ ticket.seatNumber || "-" }}</span>
                                        <span>{{ formatCurrency(ticket.total) }}</span>
                                        <span>{{ ticket.pointsUsed ? `${ticket.pointsUsed} điểm` : "Không dùng điểm" }}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h6>Bắp nước / Snack</h6>
                                <div v-if="group.snacks.length" class="detail-table">
                                    <div v-for="snack in group.snacks" :key="snack.id || snack.snackId" class="detail-row">
                                        <span>{{ snack.snackName }}</span>
                                        <span>x{{ snack.quantity }}</span>
                                        <span>{{ formatCurrency(snack.subtotal) }}</span>
                                    </div>
                                </div>
                                <p v-else class="text-muted mb-0">Không mua thêm snack.</p>
                            </div>

                            <div class="history-total">
                                <span>Tiền vé: {{ formatCurrency(group.ticketTotal) }}</span>
                                <span>Snack: {{ formatCurrency(group.snackTotal) }}</span>
                                <strong>Tổng: {{ formatCurrency(group.grandTotal) }}</strong>
                            </div>
                        </div>
                    </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, ref, onMounted } from "vue";
import api from "@/api";
import { getApiErrorMessage, showCinemaAlert, showCinemaConfirm, showCinemaToast } from "@/utils/cinemaAlert";

const activeTab = ref("customers");
const customers = ref([]);
const staffs = ref([]);
const loadingUsers = ref(true);
const loadingStaffs = ref(true);
const notifiedEmptyUsers = ref(false);
const notifiedEmptyStaffs = ref(false);
const selectedAccount = ref(null);
const historyCustomer = ref(null);
const bookingHistory = ref([]);
const snacksByTxn = ref({});
const expandedTxn = ref(null);
const loadingHistory = ref(false);
const defaultCustomerFilters = () => ({ keyword: "", status: "all", gender: "all", minPoints: null, maxPoints: null });
const defaultStaffFilters = () => ({
    keyword: "",
    status: "all",
    gender: "all",
    position: "",
    minSalary: null,
    maxSalary: null,
});
const defaultHistoryFilters = () => ({
    keyword: "",
    status: "all",
    datePreset: "all",
    paymentMethod: "all",
    fromDate: "",
    toDate: "",
    minTotal: null,
    maxTotal: null,
});
const customerFilters = ref(defaultCustomerFilters());
const staffFilters = ref(defaultStaffFilters());
const historyFilters = ref(defaultHistoryFilters());

const normalizeText = (value) => String(value || "").toLowerCase().trim();

const matchesAccountKeyword = (account, keyword) => {
    const q = normalizeText(keyword);
    if (!q) return true;
    return [account.fullName, account.email, account.phone, account.userPhone, account.username]
        .some((value) => normalizeText(value).includes(q));
};

const matchesStatus = (account, status) => {
    if (status === "all") return true;
    return status === "active" ? account.isActive : !account.isActive;
};

const matchesGender = (account, gender) => {
    return gender === "all" || account.gender === gender;
};

const matchesNumberRange = (value, min, max) => {
    const number = Number(value || 0);
    const minNumber = min === null || min === "" || min === undefined ? null : Number(min);
    const maxNumber = max === null || max === "" || max === undefined ? null : Number(max);
    if (minNumber !== null && number < minNumber) return false;
    if (maxNumber !== null && number > maxNumber) return false;
    return true;
};

const getPresetDateRange = (preset) => {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    if (preset === "today") {
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return { from: start.getTime(), to: end.getTime() };
    }

    if (preset === "thisWeek") {
        const day = start.getDay() || 7;
        start.setDate(start.getDate() - day + 1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return { from: start.getTime(), to: end.getTime() };
    }

    if (preset === "thisMonth") {
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return { from: start.getTime(), to: end.getTime() };
    }

    return { from: null, to: null };
};

const filteredCustomers = computed(() => {
    return customers.value.filter((user) =>
        matchesAccountKeyword(user, customerFilters.value.keyword) &&
        matchesStatus(user, customerFilters.value.status) &&
        matchesGender(user, customerFilters.value.gender) &&
        matchesNumberRange(user.loyaltyPoints, customerFilters.value.minPoints, customerFilters.value.maxPoints)
    );
});

const filteredStaffs = computed(() => {
    return staffs.value.filter((staff) =>
        matchesAccountKeyword(staff, staffFilters.value.keyword) &&
        matchesStatus(staff, staffFilters.value.status) &&
        matchesGender(staff, staffFilters.value.gender) &&
        (!staffFilters.value.position || normalizeText(staff.position).includes(normalizeText(staffFilters.value.position))) &&
        matchesNumberRange(staff.salary, staffFilters.value.minSalary, staffFilters.value.maxSalary)
    );
});

const filteredBookingHistory = computed(() => {
    const status = historyFilters.value.status;
    const paymentMethod = historyFilters.value.paymentMethod;
    const presetRange = getPresetDateRange(historyFilters.value.datePreset);
    const fromDate = historyFilters.value.datePreset === "custom" && historyFilters.value.fromDate
        ? new Date(`${historyFilters.value.fromDate}T00:00:00`).getTime()
        : presetRange.from;
    const toDate = historyFilters.value.datePreset === "custom" && historyFilters.value.toDate
        ? new Date(`${historyFilters.value.toDate}T23:59:59`).getTime()
        : presetRange.to;
    return bookingHistory.value.filter((booking) => {
        const matchStatus = status === "all" || booking.status === status;
        const matchPayment = paymentMethod === "all" || normalizeText(booking.paymentMethod) === normalizeText(paymentMethod);
        const bookingTime = booking.createdAt ? new Date(booking.createdAt).getTime() : null;
        const matchDate =
            (fromDate === null || (bookingTime !== null && bookingTime >= fromDate)) &&
            (toDate === null || (bookingTime !== null && bookingTime <= toDate));
        return matchStatus && matchPayment && matchDate;
    });
});

const filteredHistoryGroups = computed(() => {
    const keyword = normalizeText(historyFilters.value.keyword);
    const groups = new Map();
    filteredBookingHistory.value.forEach((booking) => {
        const txnRef = booking.txnRef || `BOOKING-${booking.bookingId}`;
        if (!groups.has(txnRef)) {
            groups.set(txnRef, {
                txnRef,
                movieTitle: booking.movieTitle,
                roomName: booking.roomName,
                startTime: booking.startTime,
                paymentMethod: booking.paymentMethod,
                status: booking.status,
                createdAt: booking.createdAt,
                bookings: [],
                seats: "",
                ticketCount: 0,
                ticketTotal: 0,
                snackTotal: 0,
                grandTotal: 0,
                snacks: [],
            });
        }

        const group = groups.get(txnRef);
        group.bookings.push(booking);
        group.ticketTotal += Number(booking.total || 0);
        if (booking.createdAt && (!group.createdAt || new Date(booking.createdAt) > new Date(group.createdAt))) {
            group.createdAt = booking.createdAt;
        }
    });

    return Array.from(groups.values())
        .map((group) => {
            const snacks = snacksByTxn.value[group.txnRef] || [];
            const snackTotal = snacks.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
            return {
                ...group,
                bookings: [...group.bookings].sort((a, b) => String(a.seatNumber || "").localeCompare(String(b.seatNumber || ""))),
                seats: group.bookings.map((booking) => booking.seatNumber).filter(Boolean).join(", "),
                ticketCount: group.bookings.length,
                snacks,
                snackTotal,
                grandTotal: group.ticketTotal + snackTotal,
            };
        })
        .filter((group) => {
            const matchTotal = matchesNumberRange(group.grandTotal, historyFilters.value.minTotal, historyFilters.value.maxTotal);
            const matchKeyword =
                !keyword ||
                [
                    group.txnRef,
                    group.movieTitle,
                    group.seats,
                    group.roomName,
                    group.paymentMethod,
                    ...group.snacks.map((snack) => snack.snackName),
                ].some((value) => normalizeText(value).includes(keyword));
            return matchTotal && matchKeyword;
        })
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
});

const resetCustomerFilters = () => {
    customerFilters.value = defaultCustomerFilters();
};

const resetStaffFilters = () => {
    staffFilters.value = defaultStaffFilters();
};

const resetHistoryFilters = () => {
    historyFilters.value = defaultHistoryFilters();
};

const formatEmpty = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    return value;
};

const formatRole = (role) => {
    if (role === "CUSTOMER") return "Khách hàng";
    if (role === "STAFF") return "Nhân viên";
    if (role === "ADMIN") return "Quản trị viên";
    return formatEmpty(role);
};

const formatGender = (gender) => {
    if (gender === "MALE") return "Nam";
    if (gender === "FEMALE") return "Nữ";
    return formatEmpty(gender);
};

const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("vi-VN");
};

const formatDateTime = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

const formatCurrency = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
};

const openAccountDetail = (data, type) => {
    selectedAccount.value = { data, type };
};

const closeAccountDetail = () => {
    selectedAccount.value = null;
};

const openBookingHistory = async (user) => {
    historyCustomer.value = user;
    bookingHistory.value = [];
    snacksByTxn.value = {};
    expandedTxn.value = null;
    resetHistoryFilters();
    loadingHistory.value = true;
    try {
        const { data } = await api.get(`/admin/users/${user.userId}/bookings`);
        bookingHistory.value = data || [];
        await loadSnacksForHistory(bookingHistory.value);
    } catch (err) {
        console.error("Error loading booking history:", err);
        await showCinemaAlert({
            icon: "error",
            title: "Không thể tải lịch sử giao dịch",
            text: getApiErrorMessage(err),
        });
        closeBookingHistory();
    } finally {
        loadingHistory.value = false;
    }
};

const closeBookingHistory = () => {
    historyCustomer.value = null;
    bookingHistory.value = [];
    snacksByTxn.value = {};
    expandedTxn.value = null;
    resetHistoryFilters();
};

const loadSnacksForHistory = async (bookings) => {
    const txnRefs = [...new Set((bookings || []).map((booking) => booking.txnRef).filter(Boolean))];
    const results = await Promise.all(
        txnRefs.map(async (txnRef) => {
            try {
                const { data } = await api.get(`/snacks/txn/${txnRef}`);
                return [txnRef, data || []];
            } catch (err) {
                console.error("Error loading snacks for txn:", txnRef, err);
                return [txnRef, []];
            }
        })
    );
    snacksByTxn.value = Object.fromEntries(results);
};

const toggleHistoryDetail = (txnRef) => {
    expandedTxn.value = expandedTxn.value === txnRef ? null : txnRef;
};

const formatBookingStatus = (status) => {
    if (status === "PAID") return "Đã thanh toán";
    if (status === "PENDING") return "Chờ thanh toán";
    if (status === "CANCELLED") return "Đã hủy";
    return status || "-";
};

const getBookingStatusClass = (status) => {
    if (status === "PAID") return "bg-success";
    if (status === "PENDING") return "bg-warning text-dark";
    if (status === "CANCELLED") return "bg-danger";
    return "bg-secondary";
};

const accountDetailRows = computed(() => {
    if (!selectedAccount.value) return [];
    const { data, type } = selectedAccount.value;
    const commonRows = [
        { label: "Mã người dùng", value: formatEmpty(data.userId) },
        { label: "Họ tên", value: formatEmpty(data.fullName) },
        { label: "Email", value: formatEmpty(data.email) },
        { label: "Số điện thoại", value: formatEmpty(data.phone || data.userPhone) },
        { label: "Vai trò", value: formatRole(data.role) },
        { label: "Trạng thái tài khoản", value: data.isActive ? "Hoạt động" : "Bị khóa" },
    ];

    if (type === "staff") {
        return [
            ...commonRows,
            { label: "Mã nhân viên", value: formatEmpty(data.staffId) },
            { label: "CCCD", value: formatEmpty(data.cccd) },
            { label: "Giới tính", value: formatGender(data.gender) },
            { label: "Chức vụ", value: formatEmpty(data.position) },
            { label: "Lương", value: formatCurrency(data.salary) },
            { label: "Ngày vào làm", value: formatDate(data.hireDate || data.createdAt) },
            { label: "Trạng thái nhân viên", value: formatEmpty(data.staffStatus) },
        ];
    }

    return [
        ...commonRows,
        { label: "Mã khách hàng", value: formatEmpty(data.customerId) },
        { label: "Giới tính", value: formatGender(data.gender) },
        { label: "Địa chỉ", value: formatEmpty(data.address) },
        { label: "Điểm thành viên", value: formatEmpty(data.loyaltyPoints) },
    ];
});

const confirmAction = async (message) => {
    return showCinemaConfirm({
        title: "Xác nhận",
        text: message,
        confirmButtonText: "Xác nhận",
    });
};

// Fetch khách hàng
const fetchUsers = async () => {
    loadingUsers.value = true;
    try {
        const { data } = await api.get("/admin/users");
        customers.value = data;
        if (customers.value.length === 0 && !notifiedEmptyUsers.value) {
            notifiedEmptyUsers.value = true;
            await showCinemaToast({
                icon: "info",
                title: "Chưa có khách hàng",
                text: "Danh sách khách hàng đang trống.",
            });
        }
    } catch (err) {
        console.error("Error loading users:", err);
        await showCinemaAlert({
            icon: "error",
            title: "Không thể tải danh sách khách hàng",
            text: "Vui lòng thử lại sau ít phút.",
        });
    } finally {
        loadingUsers.value = false;
    }
};

// Fetch nhân viên
const fetchStaffs = async () => {
    loadingStaffs.value = true;
    try {
        const { data } = await api.get("/admin/staffs");
        staffs.value = data;
        if (staffs.value.length === 0 && !notifiedEmptyStaffs.value) {
            notifiedEmptyStaffs.value = true;
            await showCinemaToast({
                icon: "info",
                title: "Chưa có nhân viên",
                text: "Danh sách nhân viên đang trống.",
            });
        }
    } catch (err) {
        console.error("Error loading staffs:", err);
        await showCinemaAlert({
            icon: "error",
            title: "Không thể tải danh sách nhân viên",
            text: "Vui lòng thử lại sau ít phút.",
        });
    } finally {
        loadingStaffs.value = false;
    }
};

// Khóa tài khoản khách hàng
const lockUser = (userId) => {
    const user = customers.value.find((u) => u.userId === userId);
    const message = `Bạn có chắc chắn muốn khóa tài khoản "${user.email || user.userEmail}" không?`;
    confirmAction(message).then(async (confirmed) => {
        if (!confirmed) return;
        try {
            await api.put(`/admin/users/${userId}/lock`);
            await fetchUsers();
            await showCinemaAlert({ icon: "success", title: "Khóa tài khoản thành công", timer: 1500 });
        } catch (err) {
            console.error("Error locking user:", err);
            await showCinemaAlert({
                icon: "error",
                title: "Lỗi khi khóa tài khoản",
                text: getApiErrorMessage(err),
            });
        }
    });
};

// Mở khóa tài khoản khách hàng
const unlockUser = (userId) => {
    const user = customers.value.find((u) => u.userId === userId);
    const message = `Bạn có chắc chắn muốn mở khóa tài khoản "${user.email}" không?`;
    confirmAction(message).then(async (confirmed) => {
        if (!confirmed) return;
        try {
            await api.put(`/admin/users/${userId}/unlock`);
            await fetchUsers();
            await showCinemaAlert({ icon: "success", title: "Mở khóa tài khoản thành công", timer: 1500 });
        } catch (err) {
            console.error("Error unlocking user:", err);
            await showCinemaAlert({
                icon: "error",
                title: "Lỗi khi mở khóa tài khoản",
                text: getApiErrorMessage(err),
            });
        }
    });
};

// Xóa tài khoản khách hàng
const deleteUser = (userId, email) => {
    const message = `Bạn có chắc chắn muốn xóa tài khoản "${email}" không? Hành động này không thể hoàn tác.`;
    confirmAction(message).then(async (confirmed) => {
        if (!confirmed) return;
        try {
            const { data } = await api.delete(`/admin/users/${userId}`);
            await fetchUsers();
            await showCinemaAlert({
                icon: "success",
                title: data?.message || "Xóa tài khoản thành công",
                timer: 1800,
            });
        } catch (err) {
            console.error("Error deleting user:", err);
            await showCinemaAlert({
                icon: "error",
                title: "Lỗi khi xóa tài khoản",
                text: getApiErrorMessage(err),
            });
        }
    });
};

// Khóa tài khoản nhân viên
const lockStaff = (email, userId) => {
    const message = `Bạn có chắc chắn muốn khóa tài khoản nhân viên "${email}" không?`;
    confirmAction(message).then(async (confirmed) => {
        if (!confirmed) return;
        try {
            console.log("Locking staff with userId:", userId);
            await api.put(`/admin/users/${userId}/lock`);
            console.log("Lock successful");
            await fetchStaffs();
            await showCinemaAlert({ icon: "success", title: "Khóa tài khoản nhân viên thành công", timer: 1500 });
        } catch (err) {
            console.error("Error locking staff:", err);
            await showCinemaAlert({
                icon: "error",
                title: "Lỗi khi khóa tài khoản nhân viên",
                text: getApiErrorMessage(err),
            });
        }
    });
};

// Mở khóa tài khoản nhân viên
const unlockStaff = (email, userId) => {
    const message = `Bạn có chắc chắn muốn mở khóa tài khoản nhân viên "${email}" không?`;
    confirmAction(message).then(async (confirmed) => {
        if (!confirmed) return;
        try {
            console.log("Unlocking staff with userId:", userId);
            await api.put(`/admin/users/${userId}/unlock`);
            console.log("Unlock successful");
            await fetchStaffs();
            await showCinemaAlert({ icon: "success", title: "Mở khóa tài khoản nhân viên thành công", timer: 1500 });
        } catch (err) {
            console.error("Error unlocking staff:", err);
            await showCinemaAlert({
                icon: "error",
                title: "Lỗi khi mở khóa tài khoản nhân viên",
                text: getApiErrorMessage(err),
            });
        }
    });
};

// Xóa tài khoản nhân viên
const deleteStaff = (email, userId) => {
    const message = `Bạn có chắc chắn muốn xóa tài khoản nhân viên "${email}" không? Hành động này không thể hoàn tác.`;
    confirmAction(message).then(async (confirmed) => {
        if (!confirmed) return;
        try {
            console.log("Deleting staff with userId:", userId);
            const { data } = await api.delete(`/admin/users/${userId}`);
            console.log("Delete successful");
            await fetchStaffs();
            await showCinemaAlert({
                icon: "success",
                title: data?.message || "Xóa tài khoản nhân viên thành công",
                timer: 1800,
            });
        } catch (err) {
            console.error("Error deleting staff:", err);
            await showCinemaAlert({
                icon: "error",
                title: "Lỗi khi xóa tài khoản nhân viên",
                text: getApiErrorMessage(err),
            });
        }
    });
};

// Khi component mount
onMounted(async () => {
    await fetchUsers();
    await fetchStaffs();
});
</script>

<style scoped>
.full-width-section {
    width: 100%;
    background: #fff;
    padding: 2rem;
    border-radius: 14px;
    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.1);
}

.table-responsive {
    max-width: 100%;
    overflow-x: auto;
}

.filter-bar {
    display: grid;
    grid-template-columns: minmax(220px, 1fr) 190px 44px;
    gap: 10px;
    align-items: center;
}

.filter-search {
    position: relative;
}

.filter-search i {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #8b8079;
    pointer-events: none;
}

.filter-search .form-control {
    padding-left: 36px;
}

.filter-select,
.filter-reset {
    min-height: 38px;
}

.filter-reset {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding-inline: 0;
}

.history-filter {
    grid-template-columns: minmax(220px, 1fr) 180px 44px;
}

.advanced-filter {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
}

.history-advanced-filter {
    grid-template-columns: 150px 150px repeat(2, minmax(0, 1fr)) repeat(2, minmax(120px, 1fr));
}

.nav-tabs .nav-link {
    color: #6c757d;
    border: none;
    border-bottom: 3px solid transparent;
    cursor: pointer;
    transition: all 0.3s ease;
}

.nav-tabs .nav-link:hover {
    color: #495057;
}

.nav-tabs .nav-link.active {
    color: #ff6b35;
    border-bottom-color: #ff6b35;
    background: none;
}

.btn-sm {
    padding: 0.35rem 0.65rem;
    font-size: 0.85rem;
}

.detail-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1050;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 18px;
    background: rgba(32, 24, 20, 0.45);
}

.detail-modal {
    width: min(720px, 100%);
    max-height: calc(100vh - 36px);
    overflow: auto;
    border-radius: 12px;
    background: #fff;
    padding: 18px;
    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.22);
}

.history-modal {
    width: min(980px, 100%);
}

.detail-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    border-bottom: 1px solid #eee2dc;
    padding-bottom: 12px;
}

.detail-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
}

.detail-item {
    border: 1px solid #eee2dc;
    border-radius: 8px;
    padding: 10px 12px;
    background: #fffdfb;
}

.detail-item span {
    display: block;
    color: #7c716b;
    font-size: 12px;
    margin-bottom: 4px;
}

.detail-item strong {
    color: #3f3732;
    font-size: 14px;
    overflow-wrap: anywhere;
}

.empty-history {
    margin-top: 18px;
    border: 1px dashed #d8cbc4;
    border-radius: 8px;
    padding: 22px;
    color: #7c716b;
    text-align: center;
    background: #fffdfb;
}

.history-list {
    display: grid;
    gap: 12px;
    margin-top: 16px;
}

.history-item {
    border: 1px solid #eee2dc;
    border-radius: 8px;
    padding: 14px;
    background: #fffdfb;
}

.history-main {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
}

.history-actions {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    flex-wrap: wrap;
}

.history-meta {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 8px;
    margin-top: 12px;
    color: #5f5651;
    font-size: 13px;
}

.history-meta span {
    min-width: 0;
    overflow-wrap: anywhere;
}

.history-detail {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-top: 14px;
    border-top: 1px solid #eee2dc;
    padding-top: 14px;
}

.history-detail h6 {
    color: #3f3732;
    font-weight: 700;
    margin-bottom: 8px;
}

.detail-table {
    display: grid;
    gap: 6px;
}

.detail-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: 10px;
    align-items: center;
    border: 1px solid #f0e5df;
    border-radius: 8px;
    padding: 8px 10px;
    background: #fff;
    color: #4f453f;
    font-size: 13px;
}

.detail-row span {
    min-width: 0;
    overflow-wrap: anywhere;
}

.history-total {
    grid-column: 1 / -1;
    display: flex;
    justify-content: flex-end;
    gap: 16px;
    flex-wrap: wrap;
    border-top: 1px dashed #d8cbc4;
    padding-top: 12px;
    color: #5f5651;
}

.history-total strong {
    color: #2f2925;
}

@media (max-width: 576px) {
    .filter-bar,
    .history-filter,
    .advanced-filter,
    .history-advanced-filter {
        grid-template-columns: 1fr;
    }

    .filter-reset {
        width: 100%;
        padding-inline: 12px;
    }

    .detail-grid {
        grid-template-columns: 1fr;
    }

    .history-main {
        display: block;
    }

    .history-actions {
        justify-content: flex-start;
        margin-top: 10px;
    }

    .history-meta {
        grid-template-columns: 1fr;
    }

    .history-detail {
        grid-template-columns: 1fr;
    }

    .detail-row {
        grid-template-columns: 1fr;
    }
}
</style>
