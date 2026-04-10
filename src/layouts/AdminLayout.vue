<template>
    <div class="admin-shell">
        <button class="btn btn-primary admin-toggle d-lg-none" @click="toggleSidebar">
            <i class="bi bi-list me-1"></i> Menu
        </button>

        <div v-if="showSidebar" class="sidebar-backdrop d-lg-none" @click="toggleSidebar"></div>

        <div class="admin-layout">
            <aside class="admin-sidebar" :class="{ show: showSidebar }">
                <div class="sidebar-brand">
                    <p class="brand-kicker mb-1">Cinema Management</p>
                    <h5 class="mb-0 d-flex align-items-center">Admin Panel</h5>
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
import { useRouter } from "vue-router";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const links = [
    { label: "Dashboard", path: "/admin/dashboard", icon: "bi bi-speedometer2" },
    { label: "Movies", path: "/admin/movies", icon: "bi bi-film" },
    { label: "Rooms", path: "/admin/rooms", icon: "bi bi-door-open" },
    { label: "Showtimes", path: "/admin/showtimes", icon: "bi bi-clock" },
    { label: "Bookings", path: "/admin/bookings", icon: "bi bi-ticket" },
    { label: "Revenue", path: "/admin/revenue", icon: "bi bi-graph-up" },
    { label: "Register Staff", path: "/admin/register-staff", icon: "bi bi-person-plus" },
    { label: "Account", path: "/admin/users", icon: "bi bi-people" },
];

const logout = () => {
    auth.logout();
    router.push("/login");
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
    padding: 12px;
    overflow: hidden;
}

.admin-layout {
    height: calc(100vh - 24px);
    border: 1px solid #eee2dc;
    border-radius: 20px;
    overflow: hidden;
    background: #fff;
    box-shadow: 0 12px 32px rgba(255, 107, 53, 0.12);
    display: flex;
}

.admin-toggle {
    position: fixed;
    top: 14px;
    left: 14px;
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
    width: 270px;
    display: flex;
    flex-direction: column;
    background: linear-gradient(180deg, #fff8f4 0%, #fff 45%);
    border-right: 1px solid #f0dfd7;
    padding: 22px 16px;
    transition: transform 0.25s ease;
    z-index: 1;
}

.sidebar-brand {
    padding: 10px 10px 16px;
    border-bottom: 1px solid #f0dfd7;
    margin-bottom: 14px;
}

.brand-kicker {
    color: #a26f5e;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
}

.admin-nav {
    gap: 8px;
}

.nav-link {
    color: #5f5b59;
    padding: 10px 12px;
    border-radius: 10px;
    transition: 0.2s ease;
    font-weight: 500;
}

.nav-link:hover {
    background: rgba(255, 107, 53, 0.1);
    color: #ff6b35;
}

.nav-link.active {
    background: linear-gradient(135deg, #ff6b35, #ff8a5c);
    color: #fff !important;
    box-shadow: 0 6px 16px rgba(255, 107, 53, 0.25);
}

.sidebar-footer {
    margin-top: auto;
    border-top: 1px solid #f0dfd7;
    padding: 14px 8px 4px;
}

.admin-content {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    background: #f6f4f3;
    padding: 20px;
}

.content-topbar {
    background: #fff;
    border: 1px solid #efe2db;
    border-radius: 14px;
    padding: 12px 16px;
    margin-bottom: 14px;
}

.content-surface {
    background: #fff;
    border: 1px solid #efe2db;
    border-radius: 14px;
    min-height: calc(100% - 80px);
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
