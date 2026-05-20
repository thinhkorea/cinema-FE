<template>
    <div class="container py-4">
    <div class="d-flex justify-content-end align-items-center mb-3">
        <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#showtimeModal" @click="openCreate">
            + Thêm suất chiếu
        </button>
    </div>

    <div class="card shadow-sm">
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
                <tbody v-if="showtimes.length">
                    <tr v-for="(st, i) in showtimes" :key="st.showtimeId">
                        <td>{{ i + 1 }}</td>
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
                            <button class="btn btn-sm btn-outline-danger" @click="remove(st.showtimeId)">Xóa</button>
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
    </div>

    <!-- Modal thêm/sửa suất chiếu -->
    <div class="modal fade" id="showtimeModal" tabindex="-1" aria-hidden="true" ref="modalEl">
        <div class="modal-dialog">
            <form class="modal-content" @submit.prevent="save">
                <div class="modal-header">
                    <h5 class="modal-title">{{ form.showtimeId ? "Sửa suất chiếu" : "Thêm suất chiếu" }}</h5>
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
                        <small class="text-muted">Chỉ hiển thị phim Đang chiếu hoặc Suất đặc biệt</small>
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
                            type="datetime-local"
                            v-model="form.startTime"
                            class="form-control"
                            :class="{ 'is-invalid': timeError }"
                            required
                            @change="onStartTimeChange"
                        />
                        <div v-if="timeError" class="invalid-feedback">{{ timeError }}</div>
                        <small v-else class="text-muted">Suất chiếu chỉ được bắt đầu từ 08:30 đến 23:59</small>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Thời gian kết thúc</label>
                        <input type="datetime-local" v-model="form.endTime" class="form-control" :class="{ 'is-invalid': scheduleError }" readonly />
                        <div v-if="scheduleError" class="invalid-feedback">{{ scheduleError }}</div>
                        <small class="text-muted">Tự tính dựa theo thời lượng phim. Phòng cần nghỉ 10 phút trước suất kế tiếp.</small>
                    </div>

                    <div class="mb-3">
                        <small class="text-muted"
                            >Giá vé sẽ tự set theo ngày chiếu: Thứ 2-5 = 65.000đ, Thứ 6-CN = 80.000đ</small
                        >
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="btn btn-secondary" type="button" data-bs-dismiss="modal">Hủy</button>
                    <button class="btn btn-primary" type="submit" :disabled="saving || !!timeError || !!scheduleError">
                        <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>Lưu
                    </button>
                </div>
            </form>
        </div>
    </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import api from "@/api";
import { Modal } from "bootstrap";
import { getApiErrorMessage, showCinemaAlert, showCinemaConfirm } from "@/utils/cinemaAlert";

const showtimes = ref([]);
const movies = ref([]);
const rooms = ref([]);
const saving = ref(false);
const modalEl = ref(null);
let modal;

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

const form = reactive({
    showtimeId: null,
    movieId: "",
    roomId: "",
    startTime: "",
    endTime: "",
    price: 0,
});

// ==================== LOAD DATA ====================
const fetchShowtimes = async () => {
    const { data } = await api.get("/showtimes");
    showtimes.value = data;
};
const fetchMovies = async () => {
    const { data } = await api.get("/movies");
    movies.value = data;
};

const availableMovies = computed(() => {
    return movies.value.filter((movie) => {
        if (movie.movieId === form.movieId) return true;
        return ALLOWED_MOVIE_STATUSES.includes(movie.status);
    });
});

const movieSelectGroups = computed(() => {
    const selectedMovie = movies.value.find((movie) => movie.movieId === form.movieId);
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
    if (!form.roomId || !form.startTime || !form.endTime) return "";

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
const fetchRooms = async () => {
    const { data } = await api.get("/rooms");
    rooms.value = data;
};

// ==================== CALCULATE END TIME ====================
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

// ==================== MODAL LOGIC ====================
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

// ==================== SAVE / DELETE ====================
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

// ==================== INIT ====================
onMounted(async () => {
    modal = new Modal(modalEl.value);
    await Promise.all([fetchShowtimes(), fetchMovies(), fetchRooms()]);
});
</script>
