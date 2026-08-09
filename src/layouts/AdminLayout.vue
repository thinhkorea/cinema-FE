<template>
    <div class="admin-shell">
        <button class="btn btn-primary admin-toggle d-lg-none" @click="toggleSidebar">
            <i class="bi bi-list me-1"></i> Danh mục
        </button>

        <div v-if="showSidebar" class="sidebar-backdrop d-lg-none" @click="toggleSidebar"></div>

        <div class="admin-layout">
            <aside class="admin-sidebar" :class="{ show: showSidebar }">
                <div class="sidebar-brand">
                    <div class="brand-logo">
                        <img src="@/assets/logo.png" alt="Cinema logo" />
                    </div>
                    <div class="brand-text">
                        <p class="brand-kicker mb-1">Quản lý rạp phim</p>
                        <h5 class="mb-0 d-flex align-items-center">Trang quản trị</h5>
                    </div>
                </div>

                <ul class="nav flex-column admin-nav">
                    <li v-for="link in links" :key="link.path" class="nav-item">
                        <RouterLink :to="link.path" class="nav-link" active-class="active" :title="link.label" @click="closeOnMobile">
                            <i :class="link.icon"></i>
                            <span class="nav-text">{{ link.label }}</span>
                        </RouterLink>
                    </li>
                </ul>

                <div class="sidebar-footer">
                    <p class="footer-user mb-2 small text-secondary">{{ auth.fullName || auth.username || "Quản trị viên" }}</p>
                    <button class="sidebar-action home-action" type="button" title="Trang chủ" aria-label="Trang chủ" @click="goHome">
                        <i class="bi bi-house"></i>
                        <span class="nav-text">Trang chủ</span>
                    </button>
                    <button class="sidebar-action logout-action" type="button" title="Đăng xuất" aria-label="Đăng xuất" @click="logout">
                        <i class="bi bi-box-arrow-right"></i>
                        <span class="nav-text">Đăng xuất</span>
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
    background: linear-gradient(180deg, #fff8f4 0%, #fff 45%);
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
    --sidebar-collapsed: 76px;
    --sidebar-expanded: 274px;
    width: var(--sidebar-collapsed);
    display: flex;
    flex-direction: column;
    background: #fff;
    border-right: 1px solid #f0dfd7;
    padding: 14px 10px;
    transition: width 0.24s ease, transform 0.25s ease, box-shadow 0.24s ease;
    z-index: 5;
    min-height: 0;
    overflow: hidden;
}

.admin-sidebar:hover,
.admin-sidebar:focus-within {
    width: var(--sidebar-expanded);
    box-shadow: 12px 0 28px rgba(48, 46, 45, 0.08);
}

.sidebar-brand {
    min-height: 68px;
    padding: 5px 4px 12px;
    border-bottom: 1px solid #f0dfd7;
    margin-bottom: 12px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 12px;
}

.brand-logo {
    width: 46px;
    height: 46px;
    border: 1px solid #f0dfd7;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 46px;
    background: #fff;
    box-shadow: 0 8px 18px rgba(255, 107, 53, 0.08);
}

.brand-logo img {
    width: 30px;
    height: 30px;
    object-fit: contain;
}

.brand-text,
.nav-text,
.footer-user {
    opacity: 0;
    transform: translateX(-6px);
    transition: opacity 0.18s ease, transform 0.18s ease;
    white-space: nowrap;
    pointer-events: none;
}

.admin-sidebar:hover .brand-text,
.admin-sidebar:focus-within .brand-text,
.admin-sidebar:hover .nav-text,
.admin-sidebar:focus-within .nav-text,
.admin-sidebar:hover .footer-user,
.admin-sidebar:focus-within .footer-user {
    opacity: 1;
    transform: translateX(0);
    pointer-events: auto;
}

.brand-kicker {
    color: #a26f5e;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
}

.admin-nav {
    flex: 1;
    flex-wrap: nowrap;
    gap: 8px;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    padding-right: 4px;
}

.admin-nav .nav-item {
    flex: 0 0 auto;
    width: 100%;
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
    font-size: 0.96rem;
    gap: 14px;
    min-height: 46px;
    padding: 9px 12px;
    border-radius: 8px;
    transition: 0.2s ease;
    font-weight: 700;
    width: 100%;
    overflow: hidden;
}

.nav-link i {
    flex: 0 0 30px;
    margin-right: 0 !important;
    text-align: center;
    color: #708090;
    font-size: 1.22rem;
    line-height: 1;
}

.nav-link:hover {
    background: rgba(255, 107, 53, 0.1);
    color: #ff6b35;
}

.nav-link.active {
    background: linear-gradient(135deg, #ff6b35, #ff8a5c);
    color: #fff !important;
    box-shadow: 0 10px 20px rgba(255, 107, 53, 0.25);
}

.nav-link.active i {
    color: #fff;
}

.sidebar-footer {
    margin-top: auto;
    border-top: 1px solid #f0dfd7;
    flex-shrink: 0;
    padding: 12px 4px 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.sidebar-action {
    align-items: center;
    border: 0;
    border-radius: 8px;
    display: flex;
    gap: 14px;
    min-height: 44px;
    overflow: hidden;
    padding: 9px 12px;
    text-align: left;
    transition: 0.2s ease;
    width: 100%;
    font-weight: 700;
}

.sidebar-action i {
    flex: 0 0 30px;
    font-size: 1.22rem;
    line-height: 1;
    text-align: center;
}

.sidebar-footer .small {
    font-size: 0.82rem;
    min-height: 20px;
}

.home-action {
    background: #fff7f2;
    color: #ff6b35;
}

.home-action:hover {
    background: #ff6b35;
    color: #fff;
}

.logout-action {
    background: #fff7f2;
    color: #ff6b35;
}

.logout-action:hover {
    background: #ff6b35;
    color: #fff;
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
        width: 274px;
        transform: translateX(-100%);
        z-index: 1100;
        box-shadow: 12px 0 28px rgba(48, 46, 45, 0.12);
    }

    .admin-sidebar .brand-text,
    .admin-sidebar .nav-text,
    .admin-sidebar .footer-user {
        opacity: 1;
        transform: translateX(0);
        pointer-events: auto;
    }

    .admin-sidebar.show {
        transform: translateX(0);
    }

    .admin-content {
        padding: 66px 12px 12px;
    }
}
</style>
