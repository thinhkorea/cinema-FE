<template>
    <div class="container py-4">
        <!-- Header -->
        <div class="d-flex justify-content-end align-items-center mb-3">
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
                                :src="resolveMediaUrl(m.posterUrl)"
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
                            <input
                                type="number"
                                v-model.number="form.duration"
                                class="form-control"
                                required
                                min="1"
                                @input="validateDuration"
                            />
                        </div>

                        <div class="col-md-8">
                            <label class="form-label">Poster phim</label>
                            <input
                                ref="posterInputEl"
                                type="file"
                                class="form-control"
                                accept="image/*"
                                :disabled="uploadingPoster"
                                @change="handlePosterUpload"
                            />
                            <div v-if="uploadingPoster" class="form-text text-primary">Đang upload poster...</div>
                            <div v-else-if="form.posterUrl" class="form-text poster-file-link">
                                Poster:
                                <a :href="resolveMediaUrl(form.posterUrl)" target="_blank" rel="noopener">
                                    <strong>{{ posterFileName }}</strong>
                                </a>.
                                Bấm lưu để ghi vào phim.
                                <a :href="resolveMediaUrl(form.posterUrl)" target="_blank" rel="noopener">Xem ảnh</a>
                            </div>
                            <div v-if="posterPreviewUrl || form.posterUrl" class="poster-preview mt-2">
                                <div v-if="showPosterLoading" class="poster-preview-state">Đang tải ảnh...</div>
                                <div v-if="posterError" class="poster-preview-state text-danger">Không tải được ảnh.</div>
                                <img
                                    v-show="!posterError"
                                    :key="posterPreviewUrl || form.posterUrl"
                                    :src="posterPreviewUrl || resolveMediaUrl(form.posterUrl)"
                                    alt="Poster phim"
                                    @load="posterLoading = false"
                                    @error="handlePosterError"
                                />
                            </div>
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
                    <button class="btn btn-primary" type="submit" :disabled="saving || uploadingPoster">
                        <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
                        Lưu
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import { Modal } from "bootstrap";
import api from "@/api";
import { getApiErrorMessage, showCinemaAlert, showCinemaConfirm } from "@/utils/cinemaAlert";
import { getMediaFileName, resolveMediaUrl } from "@/utils/mediaUrl";

const movies = ref([]);
const loading = ref(true);
const saving = ref(false);
const modalEl = ref(null);
const posterInputEl = ref(null);
const uploadingPoster = ref(false);
const posterLoading = ref(false);
const posterError = ref(false);
const posterPreviewUrl = ref("");
const posterFileName = ref("");
const posterUploadToken = ref(0);
let modal = null;

const showPosterLoading = computed(() => posterLoading.value && !posterPreviewUrl.value);

const selectedStatus = ref("");
const filteredMovies = computed(() => {
    if (!selectedStatus.value) return movies.value;
    return movies.value.filter((m) => m.status === selectedStatus.value);
});

const form = reactive({
    movieId: null,
    title: "",
    genre: "",
    duration: 1,
    description: "",
    posterUrl: "",
    trailerUrl: "",
    status: "NOW_SHOWING",
    ageRating: "P",
    actors: "",
});

const POSTER_MAX_DIMENSION = 1400;
const POSTER_QUALITY = 0.84;
const POSTER_SKIP_COMPRESS_BYTES = 450 * 1024;

const clearPosterPreview = () => {
    if (posterPreviewUrl.value) {
        URL.revokeObjectURL(posterPreviewUrl.value);
        posterPreviewUrl.value = "";
    }
};

const clearPosterInput = () => {
    if (posterInputEl.value) {
        posterInputEl.value.value = "";
    }
};

const loadImageFromFile = (file) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        const url = URL.createObjectURL(file);

        image.onload = () => {
            URL.revokeObjectURL(url);
            resolve(image);
        };
        image.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Không thể đọc ảnh."));
        };
        image.src = url;
    });

const compressPosterFile = async (file) => {
    if (file.type === "image/gif" || file.size <= POSTER_SKIP_COMPRESS_BYTES) {
        return file;
    }

    try {
        const image = await loadImageFromFile(file);
        const scale = Math.min(
            1,
            POSTER_MAX_DIMENSION / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height),
        );

        if (scale === 1 && file.size <= POSTER_SKIP_COMPRESS_BYTES * 2) {
            return file;
        }

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
        canvas.height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", POSTER_QUALITY));
        if (!blob || blob.size >= file.size) {
            return file;
        }

        const baseName = file.name.replace(/\.[^.]+$/, "") || "poster";
        return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
    } catch (err) {
        return file;
    }
};

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
    posterUploadToken.value += 1;
    uploadingPoster.value = false;
    clearPosterInput();
    clearPosterPreview();
    posterError.value = false;
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
    posterLoading.value = !!form.posterUrl;
    posterFileName.value = getMediaFileName(form.posterUrl, "poster");
    console.log("Form after assign:", form);
};

const handlePosterUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
        await showCinemaAlert({ icon: "warning", title: "File không hợp lệ", text: "Vui lòng chọn file ảnh." });
        event.target.value = "";
        return;
    }

    clearPosterPreview();
    posterPreviewUrl.value = URL.createObjectURL(file);
    posterFileName.value = file.name;
    posterLoading.value = false;
    posterError.value = false;

    const uploadToken = posterUploadToken.value + 1;
    posterUploadToken.value = uploadToken;
    const uploadTargetMovieId = form.movieId || null;
    uploadingPoster.value = true;

    try {
        const uploadFile = await compressPosterFile(file);
        const formData = new FormData();
        formData.append("file", uploadFile);
        const res = await api.post("/movies/admin/upload-poster", formData);
        const isCurrentUpload = posterUploadToken.value === uploadToken && (form.movieId || null) === uploadTargetMovieId;
        if (!isCurrentUpload) {
            return;
        }

        form.posterUrl = res.data?.posterUrl || "";
        posterLoading.value = false;
        posterError.value = false;
    } catch (error) {
        const isCurrentUpload = posterUploadToken.value === uploadToken && (form.movieId || null) === uploadTargetMovieId;
        if (!isCurrentUpload) {
            return;
        }

        await showCinemaAlert({
            icon: "error",
            title: "Lỗi upload poster",
            text: getApiErrorMessage(error),
        });
        clearPosterPreview();
        form.posterUrl = "";
        posterFileName.value = "";
        event.target.value = "";
    } finally {
        if (posterUploadToken.value === uploadToken) {
            posterLoading.value = false;
            uploadingPoster.value = false;
        }
    }
};

const handlePosterError = () => {
    posterLoading.value = false;
    posterError.value = true;
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
        const response = form.movieId
            ? await api.put(`/movies/${form.movieId}`, payload)
            : await api.post("/movies", payload);
        console.log("Save response:", response);
        modal.hide();
        clearPosterPreview();
        await fetchMovies();
        await showCinemaAlert({
            icon: "success",
            title: "Lưu phim thành công",
            timer: 1500,
        });
    } catch (error) {
        console.error("Save error:", error);
        await showCinemaAlert({
            icon: "error",
            title: "Không thể lưu phim",
            text: getApiErrorMessage(error),
        });
    } finally {
        saving.value = false;
    }
};

const remove = async (id) => {
    const confirmed = await showCinemaConfirm({
        title: "Xóa phim",
        text: "Bạn có chắc muốn xóa phim này?",
        confirmButtonText: "Xóa",
    });
    if (!confirmed) return;
    await api.delete(`/movies/${id}`);
    await fetchMovies();
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
    posterUploadToken.value += 1;
    uploadingPoster.value = false;
    clearPosterInput();
    clearPosterPreview();
    posterFileName.value = "";
    posterLoading.value = false;
    posterError.value = false;
    Object.assign(form, {
        movieId: null,
        title: "",
        genre: "",
        duration: 1,
        description: "",
        posterUrl: "",
        trailerUrl: "",
        status: "NOW_SHOWING",
        ageRating: "P",
        actors: "",
    });
};

const validateDuration = (event) => {
    const value = parseInt(event.target.value);
    if (value < 1 || isNaN(value)) {
        form.duration = 1;
        event.target.value = 1;
    }
};

onMounted(async () => {
    modal = new Modal(modalEl.value);
    await fetchMovies();
});

onUnmounted(() => {
    clearPosterPreview();
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

.poster-preview {
    position: relative;
    width: 120px;
    height: 170px;
    border: 1px solid #eee2dc;
    border-radius: 8px;
    background: #fff8f4;
    overflow: hidden;
}

.poster-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.poster-preview-state {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    background: rgba(255, 248, 244, 0.92);
    font-size: 12px;
    text-align: center;
    z-index: 1;
}

.poster-file-link {
    font-size: 0;
}

.poster-file-link a:first-of-type {
    font-size: 0.875rem;
}

.poster-file-link a + a {
    display: none;
}
</style>
