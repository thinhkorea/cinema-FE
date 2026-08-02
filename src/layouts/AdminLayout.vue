<template>
    <div class="admin-shell">
        <button class="btn btn-primary admin-toggle d-lg-none" @click="toggleSidebar">
            <i class="bi bi-list me-1"></i> Danh mục
        </button>

        <div v-if="showSidebar" class="sidebar-backdrop d-lg-none" @click="toggleSidebar"></div>

        <div class="admin-layout">
            <aside class="admin-sidebar" :class="{ show: showSidebar }">
                <div class="sidebar-brand">
                    <p class="brand-kicker mb-1">Quản lý rạp phim</p>
                    <h5 class="mb-0 d-flex align-items-center">Trang quản trị</h5>
                </div>

                <ul class="nav flex-column admin-nav">
                    <li v-for="link in links" :key="link.path" class="nav-item">
                        <RouterLink :to="link.path" class="nav-link" active-class="active" @click="closeOnMobile">
                            <i :class="link.icon + ' me-2'"></i>
                            {{ link.label }}
                        </RouterLink>
                    </li>
                </ul>

                <div class="sidebar-footer">
                    <p class="mb-2 small text-secondary">{{ auth.fullName || auth.username || "Quản trị viên" }}</p>
                    <button class="btn btn-outline-primary w-100 mb-2" @click="goHome">
                        <i class="bi bi-house me-2"></i> Trang chủ
                    </button>
                    <button class="btn btn-primary w-100" @click="logout">
                        <i class="bi bi-box-arrow-right me-2"></i> Đăng xuất
                    </button>
                </div>
            </aside>

            <main class="admin-content">
                <div class="content-topbar">
                    <div>
                        <p class="mb-1 text-muted small">Bảng điều khiển</p>
                        <h4 class="mb-0">{{ activeTitle }}</h4>
                    </div>
                </div>

                <section class="content-surface">
                    <RouterView />
                </section>
            </main>
        </div>
    </div>
</template>

<script setup>
import { useAuthStore } from "@/stores/auth.store";
import { useRouter, useRoute } from "vue-router";
import { computed, ref } from "vue";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const links = [
    { label: "Tổng quan", path: "/admin/dashboard", icon: "bi bi-speedometer2" },
    { label: "Phim", path: "/admin/movies", icon: "bi bi-film" },
    { label: "Phòng chiếu", path: "/admin/rooms", icon: "bi bi-door-open" },
    { label: "Suất chiếu", path: "/admin/showtimes", icon: "bi bi-clock" },
    { label: "Đặt vé", path: "/admin/bookings", icon: "bi bi-ticket" },
    { label: "Kho nguyên liệu", path: "/admin/inventory", icon: "bi bi-box-seam" },
    { label: "Xếp lịch làm việc", path: "/admin/shift-schedules", icon: "bi bi-calendar2-week" },
    { label: "Báo cáo ca", path: "/admin/shift-reports", icon: "bi bi-cash-coin" },
    { label: "Tạo nhân viên", path: "/admin/register-staff", icon: "bi bi-person-plus" },
    { label: "Tài khoản", path: "/admin/users", icon: "bi bi-people" },
    { label: "Voucher", path: "/admin/vouchers", icon: "bi bi-ticket-perforated" },
    { label: "Kiểm duyệt", path: "/admin/review-moderation", icon: "bi bi-shield-check" },
    { label: "Tim phim AI", path: "/admin/movie-discovery", icon: "bi bi-stars" },
];

const logout = async () => {
    await auth.logout();
    router.replace("/login");
};

const goHome = () => {
    router.push("/");
};

const showSidebar = ref(false);
const toggleSidebar = () => (showSidebar.value = !showSidebar.value);

const closeOnMobile = () => {
    if (window.innerWidth < 992) {
        showSidebar.value = false;
    }
};

const activeTitle = computed(() => {
    const active = links.find((item) => route.path.startsWith(item.path));
    return active ? active.label : "Admin";
});
</script>

<style scoped>
.admin-shell {
    height: 100vh;
    background:
        radial-gradient(circle at 5% 10%, rgba(255, 107, 53, 0.15), transparent 28%),
        radial-gradient(circle at 95% 85%, rgba(255, 140, 90, 0.12), transparent 32%), #f5f5f5;
    padding: 10px;
    overflow: hidden;
}

.admin-layout {
    height: calc(100vh - 20px);
    border: 1px solid #eee2dc;
    border-radius: 18px;
    overflow: hidden;
    background: #fff;
    box-shadow: 0 12px 32px rgba(255, 107, 53, 0.12);
    display: flex;
}

.admin-toggle {
    position: fixed;
    top: 12px;
    left: 12px;
    z-index: 1110;
    box-shadow: 0 8px 20px rgba(255, 107, 53, 0.25);
}

.sidebar-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.25);
    z-index: 1090;
}

.admin-sidebar {
    width: 244px;
    display: flex;
    flex-direction: column;
    background: linear-gradient(180deg, #fff8f4 0%, #fff 45%);
    border-right: 1px solid #f0dfd7;
    padding: 14px 12px;
    transition: transform 0.25s ease;
    z-index: 1;
    min-height: 0;
}

.sidebar-brand {
    padding: 6px 9px 10px;
    border-bottom: 1px solid #f0dfd7;
    margin-bottom: 8px;
    flex-shrink: 0;
}

.brand-kicker {
    color: #a26f5e;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
}

.admin-nav {
    flex: 1;
    gap: 4px;
    min-height: 0;
    overflow-y: auto;
    padding-right: 4px;
}

.admin-nav::-webkit-scrollbar {
    width: 5px;
}

.admin-nav::-webkit-scrollbar-thumb {
    background: #f0c9bb;
    border-radius: 999px;
}

.nav-link {
    color: #5f5b59;
    align-items: center;
    display: flex;
    font-size: 0.95rem;
    gap: 8px;
    min-height: 38px;
    padding: 7px 10px;
    border-radius: 8px;
    transition: 0.2s ease;
    font-weight: 500;
}

.nav-link i {
    flex: 0 0 18px;
    margin-right: 0 !important;
    text-align: center;
}

.nav-link:hover {
    background: rgba(255, 107, 53, 0.1);
    color: #ff6b35;
}

.nav-link.active {
    background: linear-gradient(135deg, #ff6b35, #ff8a5c);
    color: #fff !important;
    box-shadow: 0 5px 14px rgba(255, 107, 53, 0.22);
}

.sidebar-footer {
    margin-top: auto;
    border-top: 1px solid #f0dfd7;
    flex-shrink: 0;
    padding: 9px 7px 0;
}

.sidebar-footer .btn {
    align-items: center;
    display: inline-flex;
    justify-content: center;
    min-height: 34px;
    padding: 7px 10px;
}

.sidebar-footer .small {
    font-size: 0.82rem;
}

.admin-content {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    background: #f6f4f3;
    padding: 18px;
}

.content-topbar {
    background: #fff;
    border: 1px solid #efe2db;
    border-radius: 12px;
    padding: 11px 14px;
    margin-bottom: 12px;
}

.content-surface {
    background: #fff;
    border: 1px solid #efe2db;
    border-radius: 12px;
    min-height: calc(100% - 72px);
}

@media (max-width: 991.98px) {
    .admin-shell {
        padding: 0;
        background: #f5f5f5;
    }

    .admin-layout {
        border-radius: 0;
        height: 100vh;
        border: 0;
        box-shadow: none;
    }

    .admin-sidebar {
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        transform: translateX(-100%);
        z-index: 1100;
    }

    .admin-sidebar.show {
        transform: translateX(0);
    }

    .admin-content {
        padding: 66px 12px 12px;
    }
}
</style>
