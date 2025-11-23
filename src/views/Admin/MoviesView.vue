<template>
    <div class="container py-4">
        <!-- Header -->
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h4 class="mb-0 d-flex align-items-center"><i class="bi bi-film me-2"></i> Quản lý phim</h4>
            <button class="btn btn-primary" @click="openCreate" data-bs-toggle="modal" data-bs-target="#movieModal">
                + Thêm phim
            </button>
        </div>

        <!-- Bộ lọc -->
        <div class="mb-3 d-flex align-items-center gap-3">
            <label class="fw-bold">Trạng thái:</label>
            <select v-model="selectedStatus" class="form-select w-auto">
                <option value="">Tất cả</option>
                <option value="NOW_SHOWING">Đang chiếu</option>
                <option value="COMING_SOON">Sắp chiếu</option>
                <option value="SPECIAL_RELEASE">Suất đặc biệt</option>
                <option value="ENDED">Đã ngừng</option>
            </select>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary"></div>
        </div>

        <!-- Danh sách phim -->
        <div v-else>
            <table class="table table-hover align-middle">
                <thead class="table-light">
                    <tr>
                        <th>#</th>
                        <th>Poster</th>
                        <th>Tiêu đề</th>
                        <th>Thể loại</th>
                        <th>Thời lượng</th>
                        <th>Mô tả</th>
                        <th>Diễn viên</th>
                        <th>Phân loại</th>
                        <th>Trailer</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                    </tr>
                </thead>

                <tbody v-if="filteredMovies.length">
                    <tr v-for="(m, i) in filteredMovies" :key="m.movieId">
                        <td>{{ i + 1 }}</td>
                        <td>
                            <img
                                v-if="m.posterUrl"
                                :src="m.posterUrl"
                                alt="Poster"
                                class="rounded shadow-sm"
                                width="60"
                                height="85"
                            />
                            <span v-else class="text-muted">N/A</span>
                        </td>
                        <td>{{ m.title }}</td>
                        <td>{{ m.genre || "-" }}</td>
                        <td>{{ m.duration }} phút</td>
                        <td class="text-truncate" style="max-width: 220px">{{ m.description || "-" }}</td>
                        <td class="text-truncate" style="max-width: 200px">{{ m.actors || "-" }}</td>
                        <td>
                            <span class="badge bg-info">{{ m.ageRating || "-" }}</span>
                        </td>
                        <td>
                            <a
                                v-if="m.trailerUrl"
                                :href="m.trailerUrl"
                                target="_blank"
                                class="btn btn-sm btn-outline-primary"
                            >
                                <i class="bi bi-play-circle"></i>
                            </a>
                            <span v-else class="text-muted">N/A</span>
                        </td>
                        <td>
                            <span
                                class="badge"
                                :class="{
                                    'bg-success': m.status === 'NOW_SHOWING',
                                    'bg-info': m.status === 'COMING_SOON',
                                    'bg-warning text-dark': m.status === 'SPECIAL_RELEASE',
                                    'bg-secondary': m.status === 'ENDED',
                                }"
                            >
                                {{ statusLabel(m.status) }}
                            </span>
                        </td>
                        <td>
                            <button
                                class="btn btn-sm btn-outline-secondary me-2"
                                data-bs-toggle="modal"
                                data-bs-target="#movieModal"
                                @click="openEdit(m)"
                            >
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" @click="remove(m.movieId)">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                </tbody>

                <tbody v-else>
                    <tr>
                        <td colspan="9" class="text-center text-muted py-3">Không có phim nào</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Modal thêm/sửa -->
    <div class="modal fade" id="movieModal" tabindex="-1" aria-hidden="true" ref="modalEl">
        <div class="modal-dialog modal-lg">
            <form class="modal-content" @submit.prevent="save">
                <div class="modal-header">
                    <h5 class="modal-title">{{ form.movieId ? "Chỉnh sửa phim" : "Thêm phim mới" }}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" @click="resetForm"></button>
                </div>

                <div class="modal-body">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label">Tiêu đề</label>
                            <input v-model="form.title" class="form-control" required />
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Thể loại</label>
                            <input v-model="form.genre" class="form-control" placeholder="VD: Action, Comedy" />
                        </div>

                        <div class="col-md-4">
                            <label class="form-label">Thời lượng (phút)</label>
                            <input type="number" v-model.number="form.duration" class="form-control" required />
                        </div>

                        <div class="col-md-8">
                            <label class="form-label">Poster URL</label>
                            <input v-model="form.posterUrl" class="form-control" placeholder="Đường dẫn ảnh poster" />
                        </div>

                        <div class="col-md-12">
                            <label class="form-label">Trailer URL</label>
                            <input v-model="form.trailerUrl" class="form-control" placeholder="Đường dẫn YouTube" />
                        </div>

                        <div class="col-md-12">
                            <label class="form-label">Mô tả</label>
                            <textarea v-model="form.description" rows="3" class="form-control"></textarea>
                        </div>

                        <div class="col-md-12">
                            <label class="form-label">Diễn viên</label>
                            <input
                                v-model="form.actors"
                                class="form-control"
                                placeholder="VD: Tom Hanks, Emma Watson"
                            />
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Phân loại độ tuổi</label>
                            <select v-model="form.ageRating" class="form-select">
                                <option value="P">Phổ thông</option>
                                <option value="C13">13+</option>
                                <option value="C16">16+</option>
                                <option value="C18">18+</option>
                            </select>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Trạng thái phim</label>
                            <select v-model="form.status" class="form-select">
                                <option value="NOW_SHOWING">Đang chiếu</option>
                                <option value="COMING_SOON">Sắp chiếu</option>
                                <option value="SPECIAL_RELEASE">Suất đặc biệt</option>
                                <option value="ENDED">Đã ngừng</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="btn btn-secondary" type="button" data-bs-dismiss="modal" @click="resetForm">
                        Hủy
                    </button>
                    <button class="btn btn-primary" type="submit" :disabled="saving">
                        <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
                        Lưu
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { Modal } from "bootstrap";
import api from "@/api";

const movies = ref([]);
const loading = ref(true);
const saving = ref(false);
const modalEl = ref(null);
let modal = null;

const selectedStatus = ref("");
const filteredMovies = computed(() => {
    if (!selectedStatus.value) return movies.value;
    return movies.value.filter((m) => m.status === selectedStatus.value);
});

const form = reactive({
    movieId: null,
    title: "",
    genre: "",
    duration: 0,
    description: "",
    posterUrl: "",
    trailerUrl: "",
    status: "NOW_SHOWING",
    ageRating: "P",
    actors: "",
});

const fetchMovies = async () => {
    loading.value = true;
    try {
        const res = await api.get("/movies");
        movies.value = res.data;
    } finally {
        loading.value = false;
    }
};

const openCreate = () => resetForm();
const openEdit = (movie) => {
    // Gán dữ liệu mới trực tiếp, không reset trước
    form.movieId = movie.movieId;
    form.title = movie.title;
    form.genre = movie.genre;
    form.duration = movie.duration;
    form.description = movie.description;
    form.posterUrl = movie.posterUrl;
    form.trailerUrl = movie.trailerUrl;
    form.status = movie.status;
    form.ageRating = movie.ageRating;
    form.actors = movie.actors;
    console.log("Form after assign:", form);
};

const save = async () => {
    saving.value = true;
    try {
        // Convert Proxy object to plain object
        const payload = {
            movieId: form.movieId,
            title: form.title,
            genre: form.genre,
            duration: form.duration,
            description: form.description,
            posterUrl: form.posterUrl,
            trailerUrl: form.trailerUrl,
            status: form.status,
            ageRating: form.ageRating,
            actors: form.actors,
        };
        console.log("Saving payload:", payload);
        const response = form.movieId ? await api.put(`/movies/${form.movieId}`, payload) : await api.post("/movies", payload);
        console.log("Save response:", response);
        modal.hide();
        await fetchMovies();
        alert("Lưu phim thành công!");
    } catch (error) {
        console.error("Save error:", error);
        alert("Lỗi khi lưu phim: " + error.message);
    } finally {
        saving.value = false;
    }
};

const remove = async (id) => {
    if (confirm("Bạn có chắc muốn xóa phim này?")) {
        await api.delete(`/movies/${id}`);
        await fetchMovies();
    }
};

const statusLabel = (s) => {
    return (
        {
            NOW_SHOWING: "Đang chiếu",
            COMING_SOON: "Sắp chiếu",
            SPECIAL_RELEASE: "Suất đặc biệt",
            ENDED: "Đã ngừng",
        }[s] || "Không xác định"
    );
};

const resetForm = () => {
    Object.assign(form, {
        movieId: null,
        title: "",
        genre: "",
        duration: 0,
        description: "",
        posterUrl: "",
        trailerUrl: "",
        status: "NOW_SHOWING",
        ageRating: "P",
        actors: "",
    });
};

onMounted(async () => {
    modal = new Modal(modalEl.value);
    await fetchMovies();
});
</script>

<style scoped>
.table th,
.table td {
    vertical-align: middle;
}
img {
    object-fit: cover;
}
</style>
