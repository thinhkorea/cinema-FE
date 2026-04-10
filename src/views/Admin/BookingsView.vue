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
                        <th>Movie</th>
                        <th>Room</th>
                        <th>Seat</th>
                        <th>Showtime</th>
                        <th>Status</th>
                        <th>Created At</th>
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

            <!-- Pagination -->
            <nav v-if="totalPages > 1" class="mt-4">
                <ul class="pagination justify-content-center">
                    <li class="page-item" :class="{ disabled: currentPage === 1 }">
                        <button class="page-link" @click="currentPage = 1" :disabled="currentPage === 1">
                            <i class="bi bi-chevron-double-left"></i>
                        </button>
                    </li>
                    <li class="page-item" :class="{ disabled: currentPage === 1 }">
                        <button class="page-link" @click="currentPage--" :disabled="currentPage === 1">
                            <i class="bi bi-chevron-left"></i> Trước
                        </button>
                    </li>

                    <li
                        v-for="page in visiblePages"
                        :key="page"
                        class="page-item"
                        :class="{ active: currentPage === page }"
                    >
                        <button class="page-link" @click="currentPage = page">
                            {{ page }}
                        </button>
                    </li>

                    <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                        <button class="page-link" @click="currentPage++" :disabled="currentPage === totalPages">
                            Sau <i class="bi bi-chevron-right"></i>
                        </button>
                    </li>
                    <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                        <button
                            class="page-link"
                            @click="currentPage = totalPages"
                            :disabled="currentPage === totalPages"
                        >
                            <i class="bi bi-chevron-double-right"></i>
                        </button>
                    </li>
                </ul>
            </nav>

            <div v-if="totalPages > 1" class="text-center mt-3 text-muted" style="font-size: 14px">
                Trang {{ currentPage }} / {{ totalPages }} (Tổng {{ bookings.length }} bản ghi)
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import api from "@/api";

const bookings = ref([]);
const loading = ref(true);
const currentPage = ref(1);
const itemsPerPage = 10;

const totalPages = computed(() => {
    return Math.ceil(bookings.value.length / itemsPerPage);
});

const paginatedBookings = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return bookings.value.slice(start, end);
});

const visiblePages = computed(() => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage.value - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages.value, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }
    return pages;
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
