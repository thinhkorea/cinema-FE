<template>
    <div class="container py-4">
        <div class="d-flex justify-content-end align-items-center gap-2 mb-3">
            <button
                class="btn btn-outline-primary"
                data-bs-toggle="modal"
                data-bs-target="#bulkShowtimeModal"
                @click="openBulkCreate"
            >
                Tạo hàng loạt
            </button>
            <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#showtimeModal" @click="openCreate">
                + Thêm suất chiếu
            </button>
        </div>

        <div class="card shadow-sm">
            <div class="card-body border-bottom">
                <div class="row g-3">
                    <div class="col-xl-3 col-lg-4 col-md-6">
                        <label class="form-label">Từ khóa</label>
                        <input
                            v-model.trim="filterForm.keyword"
                            type="text"
                            class="form-control"
                            placeholder="Tên phim hoặc phòng"
                        />
                    </div>
                    <div class="col-xl-2 col-lg-2 col-md-6">
                        <label class="form-label">Phim</label>
                        <select v-model="filterForm.movieId" class="form-select">
                            <option value="">Tất cả</option>
                            <option
                                v-for="movie in movies"
                                :key="`filter-movie-${movie.movieId}`"
                                :value="String(movie.movieId)"
                            >
                                {{ movie.title }}
                            </option>
                        </select>
                    </div>
                    <div class="col-xl-2 col-lg-2 col-md-6">
                        <label class="form-label">Ngày chiếu</label>
                        <input v-model="filterForm.showDate" type="date" class="form-control" />
                    </div>
                    <div class="col-xl-2 col-lg-2 col-md-6">
                        <label class="form-label">Buổi chiếu</label>
                        <select v-model="filterForm.session" class="form-select">
                            <option value="">Tất cả</option>
                            <option
                                v-for="session in SESSION_OPTIONS"
                                :key="`filter-session-${session.value}`"
                                :value="session.value"
                            >
                                {{ session.shortLabel || session.label }}
                            </option>
                        </select>
                    </div>
                    <div class="col-xl-2 col-lg-2 col-md-6">
                        <label class="form-label">Trạng thái</label>
                        <select v-model="filterForm.progress" class="form-select">
                            <option value="">Tất cả</option>
                            <option value="upcoming">Sắp chiếu</option>
                            <option value="showing">Đang chiếu</option>
                            <option value="finished">Đã chiếu</option>
                        </select>
                    </div>
                    <div class="col-xl-1 col-lg-2 col-md-6 d-flex align-items-end">
                        <button class="btn btn-outline-secondary w-100" type="button" @click="resetFilters">Xóa</button>
                    </div>
                </div>
                <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
                    <small class="text-muted"
                        >Hiển thị {{ paginatedShowtimes.length }} / {{ filteredShowtimes.length }} suất chiếu đã
                        lọc</small
                    >
                    <div class="d-flex align-items-center gap-2">
                        <label class="form-label mb-0">Mỗi trang</label>
                        <select
                            v-model.number="pagination.pageSize"
                            class="form-select form-select-sm page-size-select"
                        >
                            <option :value="5">5</option>
                            <option :value="10">10</option>
                            <option :value="20">20</option>
                            <option :value="50">50</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="card-body table-responsive">
                <table class="table table-hover align-middle">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Phim</th>
                            <th>Phòng</th>
                            <th>Bắt đầu</th>
                            <th>Kết thúc</th>
                            <th>Giá vé (VNĐ)</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody v-if="paginatedShowtimes.length">
                        <tr v-for="(st, i) in paginatedShowtimes" :key="st.showtimeId">
                            <td>{{ pagination.startIndex + i + 1 }}</td>
                            <td>{{ st.movie?.title }}</td>
                            <td>{{ st.room?.roomName }}</td>
                            <td>{{ formatTime(st.startTime) }}</td>
                            <td>{{ formatTime(st.endTime) }}</td>
                            <td>{{ st.price?.toLocaleString("vi-VN") }}</td>
                            <td>
                                <button
                                    class="btn btn-sm btn-outline-secondary me-2"
                                    data-bs-toggle="modal"
                                    data-bs-target="#showtimeModal"
                                    @click="openEdit(st)"
                                >
                                    Sửa
                                </button>
                                <button class="btn btn-sm btn-outline-danger" @click="remove(st.showtimeId)">
                                    Xóa
                                </button>
                            </td>
                        </tr>
                    </tbody>
                    <tbody v-else>
                        <tr>
                            <td colspan="7" class="text-center text-muted">Chưa có dữ liệu</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div v-if="totalPages > 1" class="card-footer bg-white">
                <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
                    <small class="text-muted">Trang {{ pagination.currentPage }} / {{ totalPages }}</small>
                    <div class="btn-group" role="group" aria-label="Pagination">
                        <button
                            class="btn btn-outline-secondary btn-sm"
                            type="button"
                            :disabled="pagination.currentPage === 1"
                            @click="goToPage(pagination.currentPage - 1)"
                        >
                            Trước
                        </button>
                        <button
                            v-for="page in visiblePages"
                            :key="`page-${page}`"
                            class="btn btn-sm"
                            :class="page === pagination.currentPage ? 'btn-primary' : 'btn-outline-secondary'"
                            type="button"
                            @click="goToPage(page)"
                        >
                            {{ page }}
                        </button>
                        <button
                            class="btn btn-outline-secondary btn-sm"
                            type="button"
                            :disabled="pagination.currentPage === totalPages"
                            @click="goToPage(pagination.currentPage + 1)"
                        >
                            Sau
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal fade" id="showtimeModal" tabindex="-1" aria-hidden="true" ref="modalEl">
            <div class="modal-dialog">
                <form class="modal-content" @submit.prevent="save">
                    <div class="modal-header">
                        <h5 v-if="form.showtimeId" class="modal-title">Sửa suất chiếu</h5>
                        <h5 v-else class="modal-title">Thêm suất chiếu</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>

                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">Phim</label>
                            <select v-model="form.movieId" class="form-select" required @change="autoCalculateEndTime">
                                <option disabled value="">Chọn phim</option>
                                <optgroup v-for="group in movieSelectGroups" :key="group.key" :label="group.label">
                                    <option v-for="m in group.movies" :key="m.movieId" :value="m.movieId">
                                        {{ m.title }} ({{ m.duration }} phút)
                                    </option>
                                </optgroup>
                            </select>
                            <small class="text-muted">Chỉ hiển thị phim đang chiếu hoặc Suất đặc biệt</small>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Phòng</label>
                            <select v-model="form.roomId" class="form-select" required>
                                <option disabled value="">Chọn phòng</option>
                                <option v-for="r in rooms" :key="r.roomId" :value="r.roomId">{{ r.roomName }}</option>
                            </select>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Thời gian bắt đầu</label>
                            <input
                                v-model="form.startTime"
                                type="datetime-local"
                                class="form-control"
                                :class="{ 'is-invalid': timeError }"
                                required
                                @change="onStartTimeChange"
                            />
                            <div v-if="timeError" class="invalid-feedback">{{ timeError }}</div>
                            <small v-else class="text-muted">Suất chiếu chỉ được bắt đầu từ 08:30 đến 23:59.</small>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Thời gian kết thúc</label>
                            <input
                                v-model="form.endTime"
                                type="datetime-local"
                                class="form-control"
                                :class="{ 'is-invalid': scheduleError }"
                                readonly
                            />
                            <div v-if="scheduleError" class="invalid-feedback">{{ scheduleError }}</div>
                            <small class="text-muted"
                                >Tự tính dựa theo thời lượng phim. Phòng cần nghỉ 10 phút trước suất kế tiếp.</small
                            >
                        </div>

                        <div class="mb-3">
                            <small class="text-muted"
                                >Giá vé sẽ được tính theo ngày chiếu: Thứ 2-5 = 65.000đ, Thứ 6-CN = 80.000đ.</small
                            >
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button class="btn btn-secondary" type="button" data-bs-dismiss="modal">Hủy</button>
                        <button
                            class="btn btn-primary"
                            type="submit"
                            :disabled="saving || !!timeError || !!scheduleError"
                        >
                            <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>Lưu
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <div class="modal fade" id="bulkShowtimeModal" tabindex="-1" aria-hidden="true" ref="bulkModalEl">
            <div class="modal-dialog modal-lg">
                <form class="modal-content" @submit.prevent="saveBulk">
                    <div class="modal-header">
                        <h5 class="modal-title">Tạo hàng loạt suất chiếu</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>

                    <div class="modal-body">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label">Phim</label>
                                <select v-model="bulkForm.movieId" class="form-select" required>
                                    <option disabled value="">Chọn phim</option>
                                    <optgroup
                                        v-for="group in movieSelectGroups"
                                        :key="`bulk-${group.key}`"
                                        :label="group.label"
                                    >
                                        <option
                                            v-for="m in group.movies"
                                            :key="`bulk-movie-${m.movieId}`"
                                            :value="m.movieId"
                                        >
                                            {{ m.title }} ({{ m.duration }} phút)
                                        </option>
                                    </optgroup>
                                </select>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label d-block">Phòng</label>
                                <div class="bulk-room-grid">
                                    <label v-for="r in rooms" :key="`bulk-room-${r.roomId}`" class="bulk-room-item">
                                        <input
                                            v-model="bulkForm.roomIds"
                                            class="form-check-input me-2"
                                            type="checkbox"
                                            :value="r.roomId"
                                        />
                                        <span>{{ r.roomName }}</span>
                                    </label>
                                </div>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label">Ngày chiếu</label>
                                <input
                                    v-model="bulkForm.showDate"
                                    :min="todayDate"
                                    type="date"
                                    class="form-control"
                                    required
                                />
                            </div>

                            <div class="col-md-6">
                                <label class="form-label">Giới hạn số suất</label>
                                <input
                                    v-model.number="bulkForm.maxCreatedCount"
                                    type="number"
                                    min="1"
                                    class="form-control"
                                    placeholder="Để trống để tạo tất cả"
                                />
                                <small class="text-muted"
                                    >Nếu nhập, hệ thống chỉ tạo tối đa
                                    số suất này.</small
                                >
                            </div>
                        </div>

                        <div class="mt-4">
                            <label class="form-label d-block">Buổi chiếu</label>
                            <div class="bulk-slot-grid">
                                <label v-for="session in SESSION_OPTIONS" :key="session.value" class="bulk-slot-item">
                                    <input
                                        class="form-check-input me-2"
                                        type="radio"
                                        name="bulk-session"
                                        :checked="bulkForm.sessions[0] === session.value"
                                        @change="selectBulkSession(session.value)"
                                    />
                                    <span>{{ session.label }}</span>
                                </label>
                            </div>
                            <small class="text-muted d-block mt-2">
                                Mỗi buổi có khung giờ cố định, hệ thống sẽ tự tính giờ chiếu phù hợp trong buổi đó và tự
                                bỏ qua suất bị trùng lịch hoặc giờ đã qua.
                            </small>
                            <small class="text-muted d-block mt-1">
                                Nếu số suất mong muốn nhiều hơn số buổi đã chọn, hệ thống sẽ tự thêm các giờ phù hợp
                                trong các buổi đó trước khi mở rộng tiếp.
                            </small>
                        </div>

                        <div class="bulk-preview-card mt-3">
                            <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
                                <div>
                                    <div class="fw-semibold">Xem trước kết quả tạo suất</div>
                                    <small class="text-muted">Ước tính số suất hợp lệ trước khi tạo thật.</small>
                                </div>
                                <button
                                    type="button"
                                    class="btn btn-outline-primary"
                                    :disabled="previewingBulk || !!bulkValidationError"
                                    @click="previewBulk"
                                >
                                    <span v-if="previewingBulk" class="spinner-border spinner-border-sm me-2"></span>Xem
                                    trước
                                </button>
                            </div>

                            <div v-if="bulkPreview" class="mt-3">
                                <div class="row g-2">
                                    <div class="col-sm-4">
                                        <div class="bulk-preview-stat">
                                            <span class="bulk-preview-label">Có thể tạo</span>
                                            <strong>{{ bulkPreview.createdCount }}</strong>
                                        </div>
                                    </div>
                                    <div class="col-sm-4">
                                        <div class="bulk-preview-stat">
                                            <span class="bulk-preview-label">Bị bỏ qua</span>
                                            <strong>{{ bulkPreview.skippedCount }}</strong>
                                        </div>
                                    </div>
                                    <div class="col-sm-4">
                                        <div class="bulk-preview-stat">
                                            <span class="bulk-preview-label">Còn có thể tạo</span>
                                            <strong>{{ bulkPreview.remainingCreatableCount || 0 }}</strong>
                                        </div>
                                    </div>
                                </div>

                                <div v-if="bulkPreview.limitReached" class="alert alert-info mt-3 mb-0">
                                    Đã chạm giới hạn
                                    {{ bulkPreview.limitApplied }} suất. Còn
                                    {{ bulkPreview.remainingCreatableCount }} suất hợp lệ nếu
                                    muốn nâng giới hạn.
                                </div>

                                <div v-if="previewShowtimeDetails.length" class="mt-3">
                                    <div class="fw-semibold mb-2">Chi tiết suất chiếu dự kiến</div>
                                    <div class="table-responsive">
                                        <table class="table table-sm align-middle preview-table mb-0">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Phòng</th>
                                                    <th>Bắt đầu</th>
                                                    <th>Kết thúc</th>
                                                    <th>Giá vé</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr
                                                    v-for="(item, index) in previewShowtimeDetails"
                                                    :key="`${item.roomId}-${item.startTime}-${index}`"
                                                >
                                                    <td>{{ index + 1 }}</td>
                                                    <td>{{ resolveRoomName(item.roomId) }}</td>
                                                    <td>{{ formatTime(item.startTime) }}</td>
                                                    <td>{{ formatTime(item.endTime) }}</td>
                                                    <td>{{ item.price?.toLocaleString("vi-VN") }} VNĐ</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <small
                                        v-if="bulkPreview.createdShowtimes?.length > previewShowtimeDetails.length"
                                        class="text-muted d-block mt-2"
                                    >
                                        Đang hiển thị {{ previewShowtimeDetails.length }} /
                                        {{ bulkPreview.createdShowtimes.length }} suất dự kiến
                                        đầu tiên.
                                    </small>
                                </div>

                                <div v-if="previewSkippedMessages.length" class="mt-3">
                                    <div class="fw-semibold mb-2">
                                        Một số suất bị bỏ qua
                                    </div>
                                    <ul class="preview-skipped-list mb-0">
                                        <li
                                            v-for="(message, index) in previewSkippedMessages"
                                            :key="`${index}-${message}`"
                                        >
                                            {{ message }}
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div v-if="bulkValidationError" class="alert alert-warning mt-3 mb-0">
                            {{ bulkValidationError }}
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button class="btn btn-secondary" type="button" data-bs-dismiss="modal">Hủy</button>
                        <button class="btn btn-primary" type="submit" :disabled="savingBulk || !!bulkValidationError">
                            <span v-if="savingBulk" class="spinner-border spinner-border-sm me-2"></span>Tạo
                            suất
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import api from "@/api";
import { Modal } from "bootstrap";
import { getApiErrorMessage, showCinemaAlert, showCinemaConfirm } from "@/utils/cinemaAlert";

const showtimes = ref([]);
const movies = ref([]);
const rooms = ref([]);
const saving = ref(false);
const savingBulk = ref(false);
const previewingBulk = ref(false);
const modalEl = ref(null);
const bulkModalEl = ref(null);
const bulkPreview = ref(null);
let modal;
let bulkModal;

const ROOM_TURNAROUND_MINUTES = 10;
const WEEKDAY_PRICE = 65000;
const WEEKEND_PRICE = 80000;
const ALLOWED_MOVIE_STATUSES = ["NOW_SHOWING", "SPECIAL_RELEASE"];
const MOVIE_STATUS_GROUPS = [
    { key: "NOW_SHOWING", label: "Đang chiếu" },
    { key: "SPECIAL_RELEASE", label: "Suất đặc biệt" },
];
const OPENING_MINUTES = 8 * 60 + 30;
const LAST_SHOWTIME_START_MINUTES = 23 * 60 + 59;
const SESSION_OPTIONS = [
    { value: "morning", label: "Sáng (08:30 - 11:59)" },
    { value: "afternoon", label: "Chiều (12:00 - 17:59)" },
    { value: "evening", label: "Tối (18:00 - 22:59)" },
    { value: "late", label: "Suất muộn (23:00 - 23:59)" },
];
const todayDate = new Date().toISOString().slice(0, 10);

const form = reactive({
    showtimeId: null,
    movieId: "",
    roomId: "",
    startTime: "",
    endTime: "",
    price: 0,
});

const filterForm = reactive({
    keyword: "",
    movieId: "",
    roomId: "",
    showDate: "",
    session: "",
    progress: "",
});

const pagination = reactive({
    currentPage: 1,
    pageSize: 10,
    startIndex: 0,
});

const bulkForm = reactive({
    movieId: "",
    roomIds: [],
    showDate: "",
    sessions: ["evening"],
    maxCreatedCount: null,
});

const fetchShowtimes = async () => {
    const { data } = await api.get("/showtimes");
    showtimes.value = data;
};

const fetchMovies = async () => {
    const { data } = await api.get("/movies");
    movies.value = data;
};

const fetchRooms = async () => {
    const { data } = await api.get("/rooms");
    rooms.value = data;
};

const selectedMovieId = computed(() => form.movieId || bulkForm.movieId);

const availableMovies = computed(() =>
    movies.value.filter((movie) => {
        if (movie.movieId === selectedMovieId.value) return true;
        return ALLOWED_MOVIE_STATUSES.includes(movie.status);
    }),
);

const movieSelectGroups = computed(() => {
    const selectedMovie = movies.value.find((movie) => movie.movieId === selectedMovieId.value);
    const groups = MOVIE_STATUS_GROUPS.map((group) => ({
        ...group,
        movies: availableMovies.value.filter((movie) => movie.status === group.key),
    })).filter((group) => group.movies.length > 0);

    if (selectedMovie && !ALLOWED_MOVIE_STATUSES.includes(selectedMovie.status)) {
        groups.push({
            key: "CURRENT",
            label: "Phim đang chọn",
            movies: [selectedMovie],
        });
    }
    return groups;
});

const filteredShowtimes = computed(() => {
    const keyword = filterForm.keyword.trim().toLowerCase();

    return showtimes.value
        .filter((showtime) => {
            if (filterForm.movieId && String(showtime.movie?.movieId) !== filterForm.movieId) {
                return false;
            }
            if (filterForm.roomId && String(showtime.room?.roomId) !== filterForm.roomId) {
                return false;
            }
            if (filterForm.showDate && !showtime.startTime?.startsWith(filterForm.showDate)) {
                return false;
            }
            if (filterForm.session && getSessionKey(showtime.startTime) !== filterForm.session) {
                return false;
            }
            if (filterForm.progress) {
                const progress = getShowtimeProgress(showtime.startTime, showtime.endTime);
                if (progress !== filterForm.progress) {
                    return false;
                }
            }
            if (keyword) {
                const movieTitle = showtime.movie?.title?.toLowerCase() || "";
                const roomName = showtime.room?.roomName?.toLowerCase() || "";
                if (!movieTitle.includes(keyword) && !roomName.includes(keyword)) {
                    return false;
                }
            }
            return true;
        })
        .slice()
        .sort((left, right) => {
            const leftStart = left.startTime ? new Date(left.startTime).getTime() : 0;
            const rightStart = right.startTime ? new Date(right.startTime).getTime() : 0;
            const leftEnd = left.endTime ? new Date(left.endTime).getTime() : leftStart;
            const rightEnd = right.endTime ? new Date(right.endTime).getTime() : rightStart;
            const now = Date.now();
            const leftIsActive = leftEnd >= now;
            const rightIsActive = rightEnd >= now;

            if (leftIsActive !== rightIsActive) {
                return leftIsActive ? -1 : 1;
            }

            if (leftStart !== rightStart) {
                return rightStart - leftStart;
            }

            const leftMovieTitle = left.movie?.title || "";
            const rightMovieTitle = right.movie?.title || "";
            const movieCompare = leftMovieTitle.localeCompare(rightMovieTitle, "vi");
            if (movieCompare !== 0) {
                return movieCompare;
            }

            const leftRoomName = left.room?.roomName || "";
            const rightRoomName = right.room?.roomName || "";
            return leftRoomName.localeCompare(rightRoomName, "vi");
        });
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredShowtimes.value.length / pagination.pageSize)));

const paginatedShowtimes = computed(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    pagination.startIndex = startIndex;
    return filteredShowtimes.value.slice(startIndex, startIndex + pagination.pageSize);
});

const visiblePages = computed(() => {
    const pages = [];
    const start = Math.max(1, pagination.currentPage - 2);
    const end = Math.min(totalPages.value, start + 4);

    for (let page = start; page <= end; page += 1) {
        pages.push(page);
    }
    return pages;
});

const previewShowtimeDetails = computed(() => (bulkPreview.value?.createdShowtimes || []).slice(0, 12));
const previewSkippedMessages = computed(() => (bulkPreview.value?.skippedMessages || []).slice(0, 5));

const timeError = computed(() => {
    if (!form.startTime) return "";
    const start = new Date(form.startTime);
    if (start < new Date()) {
        return "Không thể tạo suất chiếu có giờ bắt đầu nhỏ hơn thời điểm hiện tại.";
    }
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    if (startMinutes < OPENING_MINUTES || startMinutes > LAST_SHOWTIME_START_MINUTES) {
        return "Suất chiếu chỉ được bắt đầu trong khung giờ hoạt động của rạp: 08:30 - 23:59.";
    }
    return "";
});

const scheduleError = computed(() => {
    if (!form.startTime || !form.endTime) return "";

    const sameStartConflict = showtimes.value.find((showtime) => {
        if (form.showtimeId && showtime.showtimeId === form.showtimeId) return false;
        return showtime.startTime === form.startTime;
    });
    if (sameStartConflict) {
        const movieTitle = sameStartConflict.movie?.title || "một phim khác";
        const roomName = sameStartConflict.room?.roomName || "phòng khác";
        return `Đã có suất chiếu của ${movieTitle} tại ${roomName} bắt đầu lúc ${formatTime(sameStartConflict.startTime)}. Không thể để nhiều phòng có cùng một giờ bắt đầu suất chiếu.`;
    }

    if (!form.roomId) return "";
    const start = new Date(form.startTime);
    const end = new Date(form.endTime);
    const guardedStart = new Date(start.getTime() - ROOM_TURNAROUND_MINUTES * 60000);
    const guardedEnd = new Date(end.getTime() + ROOM_TURNAROUND_MINUTES * 60000);
    const conflict = showtimes.value.find((showtime) => {
        if (form.showtimeId && showtime.showtimeId === form.showtimeId) return false;
        if (String(showtime.room?.roomId) !== String(form.roomId)) return false;
        const existingStart = new Date(showtime.startTime);
        const existingEnd = new Date(showtime.endTime);
        return existingStart < guardedEnd && existingEnd > guardedStart;
    });
    if (!conflict) return "";

    const movieTitle = conflict.movie?.title || "phim khác";
    return `Phòng này đã có suất chiếu ${movieTitle} từ ${formatTime(conflict.startTime)} đến ${formatTime(conflict.endTime)}. Cần nghỉ ít nhất ${ROOM_TURNAROUND_MINUTES} phút giữa hai suất.`;
});

const bulkValidationError = computed(() => {
    if (!bulkForm.movieId || !bulkForm.showDate) return "";
    if (!bulkForm.roomIds.length) {
        return "Vui lòng chọn ít nhất một phòng chiếu.";
    }
    if (bulkForm.showDate < todayDate) {
        return "Ngày chiếu không được nhỏ hơn ngày hiện tại.";
    }
    if (!bulkForm.sessions.length) {
        return "Vui lòng chọn ít nhất một buổi chiếu.";
    }
    if (bulkForm.maxCreatedCount !== null && bulkForm.maxCreatedCount !== "" && bulkForm.maxCreatedCount <= 0) {
        return "Giới hạn số suất phải lớn hơn 0.";
    }
    return "";
});

const autoCalculateEndTime = () => {
    if (!form.startTime || !form.movieId) return;
    const movie = movies.value.find((m) => m.movieId === form.movieId);
    if (!movie?.duration) return;
    const start = new Date(form.startTime);
    const end = new Date(start.getTime() + movie.duration * 60000);
    form.endTime = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const autoSetPrice = () => {
    if (!form.startTime) {
        form.price = 0;
        return;
    }
    const day = new Date(form.startTime).getDay();
    form.price = day >= 1 && day <= 4 ? WEEKDAY_PRICE : WEEKEND_PRICE;
};

const onStartTimeChange = () => {
    autoCalculateEndTime();
    autoSetPrice();
};

const resetFilters = () => {
    Object.assign(filterForm, {
        keyword: "",
        movieId: "",
        roomId: "",
        showDate: "",
        session: "",
        progress: "",
    });
    pagination.currentPage = 1;
};

const goToPage = (page) => {
    if (page < 1 || page > totalPages.value) return;
    pagination.currentPage = page;
};

const openCreate = () => {
    Object.assign(form, { showtimeId: null, movieId: "", roomId: "", startTime: "", endTime: "", price: 0 });
};

const openEdit = (st) => {
    Object.assign(form, {
        showtimeId: st.showtimeId,
        movieId: st.movie.movieId,
        roomId: st.room.roomId,
        startTime: st.startTime.slice(0, 16),
        endTime: st.endTime.slice(0, 16),
        price: st.price,
    });
};

const openBulkCreate = () => {
    Object.assign(bulkForm, {
        movieId: "",
        roomIds: [],
        showDate: todayDate,
        sessions: ["evening"],
        maxCreatedCount: null,
    });
    bulkPreview.value = null;
};

const selectBulkSession = (sessionValue) => {
    bulkForm.sessions = sessionValue ? [sessionValue] : [];
};

const buildBulkPayload = () => ({
    movieId: bulkForm.movieId,
    roomId: bulkForm.roomIds[0] || null,
    roomIds: [...bulkForm.roomIds],
    showDate: bulkForm.showDate,
    sessions: [...bulkForm.sessions],
    maxCreatedCount: bulkForm.maxCreatedCount || null,
});

const previewBulk = async () => {
    if (bulkValidationError.value) {
        await showCinemaAlert({
            icon: "warning",
            title: "Thông tin chưa hợp lệ",
            text: bulkValidationError.value,
        });
        return;
    }

    previewingBulk.value = true;
    try {
        const { data } = await api.post("/showtimes/bulk/preview", buildBulkPayload());
        bulkPreview.value = data;
    } catch (err) {
        bulkPreview.value = null;
        await showCinemaAlert({
            icon: "error",
            title: "Không thể xem trước",
            text: getApiErrorMessage(
                err,
                "Vui lòng kiểm tra lại dữ liệu tạo hàng loạt.",
            ),
        });
    } finally {
        previewingBulk.value = false;
    }
};

const save = async () => {
    if (timeError.value) {
        await showCinemaAlert({
            icon: "warning",
            title: "Giờ chiếu không hợp lệ",
            text: timeError.value,
        });
        return;
    }
    if (scheduleError.value) {
        await showCinemaAlert({
            icon: "warning",
            title: "Phòng chiếu đã có lịch",
            text: scheduleError.value,
        });
        return;
    }

    saving.value = true;
    try {
        const payload = {
            movieId: form.movieId,
            roomId: form.roomId,
            startTime: form.startTime,
            endTime: form.endTime,
            price: form.price,
        };
        if (form.showtimeId) await api.put(`/showtimes/${form.showtimeId}`, payload);
        else await api.post("/showtimes", payload);

        await fetchShowtimes();
        modal.hide();
    } catch (err) {
        await showCinemaAlert({
            icon: "error",
            title: "Không thể lưu suất chiếu",
            text: getApiErrorMessage(err, "Vui lòng kiểm tra lại thông tin suất chiếu."),
        });
    } finally {
        saving.value = false;
    }
};

const saveBulk = async () => {
    if (bulkValidationError.value) {
        await showCinemaAlert({
            icon: "warning",
            title: "Thông tin chưa hợp lệ",
            text: bulkValidationError.value,
        });
        return;
    }

    savingBulk.value = true;
    try {
        const { data } = await api.post("/showtimes/bulk", buildBulkPayload());
        await fetchShowtimes();
        bulkModal.hide();
        bulkPreview.value = null;
        const requestedCount = bulkForm.maxCreatedCount || data.createdCount;
        await showCinemaAlert({
            icon: data.createdCount > 0 ? "success" : "warning",
            title: "Đã xử lý tạo hàng loạt",
            text: `Đã tạo thành công ${data.createdCount}/${requestedCount} suất chiếu`,
            confirmButtonText: "Đã hiểu",
        });
    } catch (err) {
        await showCinemaAlert({
            icon: "error",
            title: "Không thể tạo hàng loạt",
            text: getApiErrorMessage(
                err,
                "Vui lòng kiểm tra lại dữ liệu tạo hàng loạt.",
            ),
        });
    } finally {
        savingBulk.value = false;
    }
};

const remove = async (id) => {
    const confirmed = await showCinemaConfirm({
        title: "Xóa suất chiếu",
        text: "Bạn có chắc muốn xóa suất chiếu này?",
        confirmButtonText: "Xóa",
    });
    if (!confirmed) return;
    await api.delete(`/showtimes/${id}`);
    await fetchShowtimes();
};

const formatTime = (time) => new Date(time).toLocaleString("vi-VN");

const getSessionKey = (time) => {
    if (!time) return "";
    const date = new Date(time);
    const totalMinutes = date.getHours() * 60 + date.getMinutes();
    if (totalMinutes >= 8 * 60 + 30 && totalMinutes < 12 * 60) return "morning";
    if (totalMinutes >= 12 * 60 && totalMinutes < 18 * 60) return "afternoon";
    if (totalMinutes >= 18 * 60 && totalMinutes < 23 * 60) return "evening";
    if (totalMinutes >= 23 * 60 && totalMinutes < 24 * 60) return "late";
    return "";
};

const getShowtimeProgress = (startTime, endTime) => {
    const now = new Date();
    const start = startTime ? new Date(startTime) : null;
    const end = endTime ? new Date(endTime) : null;
    if (!start || !end) return "";
    if (end < now) return "finished";
    if (start > now) return "upcoming";
    return "showing";
};

const resolveRoomName = (roomId) => {
    const room = rooms.value.find((item) => String(item.roomId) === String(roomId));
    return room?.roomName || `Phòng #${roomId}`;
};

watch(
    () => ({
        movieId: bulkForm.movieId,
        roomIds: [...bulkForm.roomIds],
        showDate: bulkForm.showDate,
        sessions: [...bulkForm.sessions],
        maxCreatedCount: bulkForm.maxCreatedCount,
    }),
    () => {
        bulkPreview.value = null;
    },
    { deep: true },
);

watch(
    () => ({
        keyword: filterForm.keyword,
        movieId: filterForm.movieId,
        roomId: filterForm.roomId,
        showDate: filterForm.showDate,
        session: filterForm.session,
        progress: filterForm.progress,
        total: filteredShowtimes.value.length,
        pageSize: pagination.pageSize,
    }),
    () => {
        if (pagination.currentPage > totalPages.value) {
            pagination.currentPage = totalPages.value;
            return;
        }
        pagination.currentPage = 1;
    },
    { deep: true },
);

onMounted(async () => {
    modal = new Modal(modalEl.value);
    bulkModal = new Modal(bulkModalEl.value);
    await Promise.all([fetchShowtimes(), fetchMovies(), fetchRooms()]);
});
</script>

<style scoped>
.bulk-slot-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 0.75rem;
}

.bulk-room-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.75rem;
}

.bulk-slot-item,
.bulk-room-item {
    display: flex;
    align-items: center;
    padding: 0.65rem 0.75rem;
    border: 1px solid #d9dee7;
    border-radius: 0.85rem;
    background: #f8fafc;
    cursor: pointer;
}

.bulk-preview-card {
    border: 1px solid #d9dee7;
    border-radius: 1rem;
    background: #f8fafc;
    padding: 1rem;
}

.bulk-preview-stat {
    height: 100%;
    border-radius: 0.85rem;
    background: white;
    border: 1px solid #e5e7eb;
    padding: 0.85rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.bulk-preview-label {
    color: #64748b;
    font-size: 0.9rem;
}

.preview-table th {
    white-space: nowrap;
}

.preview-skipped-list {
    padding-left: 1rem;
    color: #475569;
}
</style>
