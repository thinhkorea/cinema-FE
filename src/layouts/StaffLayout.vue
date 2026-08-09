<template>
    <div class="staff-shell" :class="{ 'ticket-print-shell': isTicketPrintView }">
        <button v-if="!isTicketPrintView" class="btn btn-primary staff-toggle d-lg-none" @click="toggleSidebar">
            <i class="bi bi-list me-1"></i> Danh mục
        </button>

        <div v-if="!isTicketPrintView && showSidebar" class="sidebar-backdrop d-lg-none" @click="toggleSidebar"></div>

        <div class="staff-layout">
            <aside v-if="!isTicketPrintView" class="staff-sidebar" :class="{ show: showSidebar }">
                <div class="sidebar-main">
                    <div class="sidebar-brand">
                        <div class="brand-logo">
                            <img src="@/assets/logo.png" alt="Cinema logo" />
                        </div>
                        <div class="brand-text">
                            <p class="brand-kicker mb-1">Vận hành rạp phim</p>
                            <h5 class="mb-0 d-flex align-items-center">Trang nhân viên</h5>
                        </div>
                    </div>

                    <ul class="nav flex-column staff-nav">
                        <li v-for="link in links" :key="link.path" class="nav-item">
                            <router-link
                                :to="link.path"
                                class="nav-link"
                                active-class="active"
                                :title="link.label"
                                @click="closeOnMobile"
                            >
                                <i :class="link.icon"></i>
                                <span class="nav-text">{{ link.label }}</span>
                            </router-link>
                        </li>
                    </ul>
                </div>

                <div class="staff-footer">
                    <p class="footer-user mb-2 small text-secondary">{{ auth.fullName || auth.username || "Nhân viên" }}</p>
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

            <main class="staff-content">
                <div v-if="!isTicketPrintView" class="content-topbar">
                    <div>
                        <p class="mb-1 text-muted small">Khu vực nhân viên</p>
                        <h4 class="mb-0">{{ activeTitle }}</h4>
                    </div>
                </div>

                <section class="content-surface" :class="{ 'ticket-print-surface': isTicketPrintView }">
                    <router-view />
                </section>
            </main>
        </div>
    </div>
</template>

<script setup>
import { useAuthStore } from "@/stores/auth.store";
import { useRouter } from "vue-router";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const links = [
    { label: "Bán vé", path: "/staff/seat-map", icon: "bi bi-ticket-detailed" },
    { label: "Suất chiếu", path: "/staff/showtimes", icon: "bi bi-clock-history" },
    { label: "Vé đã bán", path: "/staff/sold-tickets", icon: "bi bi-receipt" },
    { label: "Tra cứu vé", path: "/staff/search-ticket", icon: "bi bi-search" },
    { label: "Công thức bắp", path: "/staff/recipes", icon: "bi bi-journal-text" },
    { label: "Chọn ca làm", path: "/staff/shift-registration", icon: "bi bi-calendar2-check" },
    { label: "Kết ca", path: "/staff/shift-close", icon: "bi bi-cash-coin" },
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
const isTicketPrintView = computed(() => route.meta.ticketPrint === true);

const closeOnMobile = () => {
    if (window.innerWidth < 992) {
        showSidebar.value = false;
    }
};

const activeTitle = computed(() => {
    const active = links.find((item) => route.path.startsWith(item.path));
    return active ? active.label : "Nhân viên";
});
</script>

<style scoped>
.staff-shell {
    height: 100vh;
    background:
        radial-gradient(circle at 8% 12%, rgba(255, 107, 53, 0.14), transparent 28%),
        radial-gradient(circle at 90% 88%, rgba(255, 107, 53, 0.1), transparent 33%), #f5f5f5;
    padding: 10px;
    overflow: hidden;
}

.staff-layout {
    height: calc(100vh - 20px);
    display: flex;
    border-radius: 18px;
    border: 1px solid #eee2dc;
    overflow: hidden;
    background: #fff;
    box-shadow: 0 12px 30px rgba(255, 107, 53, 0.11);
}

.staff-toggle {
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

.staff-sidebar {
    --sidebar-collapsed: 76px;
    --sidebar-expanded: 274px;
    width: var(--sidebar-collapsed);
    min-height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: linear-gradient(180deg, #fff8f4 0%, #fff 45%);
    border-right: 1px solid #f0dfd7;
    color: #333;
    padding: 14px 10px;
    transition: width 0.24s ease, transform 0.25s ease, box-shadow 0.24s ease;
    z-index: 5;
    overflow: hidden;
}

.staff-sidebar:hover,
.staff-sidebar:focus-within {
    width: var(--sidebar-expanded);
    box-shadow: 12px 0 28px rgba(48, 46, 45, 0.08);
}

.sidebar-main {
    min-height: 0;
    display: flex;
    flex: 1;
    flex-direction: column;
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

.staff-sidebar:hover .brand-text,
.staff-sidebar:focus-within .brand-text,
.staff-sidebar:hover .nav-text,
.staff-sidebar:focus-within .nav-text,
.staff-sidebar:hover .footer-user,
.staff-sidebar:focus-within .footer-user {
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

.staff-nav {
    flex: 1;
    flex-wrap: nowrap;
    gap: 8px;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    padding-right: 4px;
}

.staff-nav .nav-item {
    flex: 0 0 auto;
    width: 100%;
}

.staff-nav::-webkit-scrollbar {
    width: 5px;
}

.staff-nav::-webkit-scrollbar-thumb {
    background: #f0c9bb;
    border-radius: 999px;
}

.nav-link {
    display: flex;
    align-items: center;
    gap: 14px;
    min-height: 46px;
    padding: 9px 12px;
    border-radius: 8px;
    transition: 0.2s;
    color: #5f5b59;
    font-weight: 700;
    overflow: hidden;
    width: 100%;
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
    color: #fff;
    box-shadow: 0 10px 20px rgba(255, 107, 53, 0.25);
}

.nav-link.active i {
    color: #fff;
}

.staff-footer {
    border-top: 1px solid #f0dfd7;
    padding: 12px 4px 0;
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex-shrink: 0;
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

.staff-footer .small {
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

.staff-content {
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

.ticket-print-shell {
    padding: 0;
    background: #f5f5f5;
}

.ticket-print-shell .staff-layout {
    height: 100vh;
    border: 0;
    border-radius: 0;
    box-shadow: none;
    background: #f5f5f5;
}

.ticket-print-shell .staff-content {
    padding: 0;
    overflow-y: auto;
}

.ticket-print-shell .ticket-print-surface {
    border: 0;
    border-radius: 0;
    min-height: 100%;
    background: #f5f5f5;
}

@media (max-width: 991.98px) {
    .staff-shell {
        padding: 0;
        background: #f5f5f5;
    }

    .staff-layout {
        height: 100vh;
        border-radius: 0;
        border: 0;
        box-shadow: none;
    }

    .staff-sidebar {
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        width: 274px;
        transform: translateX(-100%);
        z-index: 1100;
        box-shadow: 12px 0 28px rgba(48, 46, 45, 0.12);
    }

    .staff-sidebar .brand-text,
    .staff-sidebar .nav-text,
    .staff-sidebar .footer-user {
        opacity: 1;
        transform: translateX(0);
        pointer-events: auto;
    }

    .staff-sidebar.show {
        transform: translateX(0);
    }

    .staff-content {
        padding: 66px 12px 12px;
    }
}
</style>
