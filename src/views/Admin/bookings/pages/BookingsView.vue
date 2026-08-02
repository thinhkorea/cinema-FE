<template>
    <div class="container py-4">
        <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary"></div>
        </div>

        <div v-else>
            <table class="table table-bordered table-striped align-middle">
                <thead class="table-light">
                    <tr>
                        <th>#</th>
                        <th>Khách hàng / Nhân viên</th>
                        <th>Phim</th>
                        <th>Phòng</th>
                        <th>Ghế</th>
                        <th>Suất chiếu</th>
                        <th>Trạng thái</th>
                        <th>Ngày tạo</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(b, idx) in paginatedBookings" :key="b.bookingId">
                        <td>{{ (currentPage - 1) * itemsPerPage + idx + 1 }}</td>
                        <td>
                            {{ b.soldByStaff || b.username || '-' }}
                        </td>
                        <td>{{ b.movieTitle }}</td>
                        <td>{{ b.roomName }}</td>
                        <td>{{ b.seatNumber }}</td>
                        <td>{{ formatDate(b.showtime) }}</td>
                        <td>
                            <span
                                :class="{
                                    'badge bg-secondary': b.status === 'PENDING',
                                    'badge bg-success': b.status === 'PAID',
                                    'badge bg-danger': b.status === 'CANCELLED',
                                }"
                            >
                                {{ b.status }}
                            </span>
                        </td>
                        <td>{{ formatDate(b.createdAt) }}</td>
                    </tr>
                </tbody>
            </table>

            <AdminPagination
                v-if="bookings.length"
                v-model="currentPage"
                v-model:page-size="itemsPerPage"
                :total-items="bookings.length"
                item-label="đặt vé"
                aria-label="Phân trang đặt vé"
            />
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import api from "@/api";
import AdminPagination from "@/views/Admin/components/AdminPagination.vue";

const bookings = ref([]);
const loading = ref(true);
const currentPage = ref(1);
const itemsPerPage = ref(10);

const totalPages = computed(() => {
    return Math.max(1, Math.ceil(bookings.value.length / itemsPerPage.value));
});

const paginatedBookings = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value;
    const end = start + itemsPerPage.value;
    return bookings.value.slice(start, end);
});

watch([itemsPerPage, totalPages], () => {
    if (currentPage.value > totalPages.value) {
        currentPage.value = totalPages.value;
    }
});

onMounted(async () => {
    try {
        const res = await api.get("/admin/bookings");
        console.log("Bookings data:", res.data);
        bookings.value = res.data;
    } catch (err) {
        console.error("Error loading bookings:", err);
    } finally {
        loading.value = false;
    }
});

function formatDate(dateStr) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("vi-VN");
}
</script>
