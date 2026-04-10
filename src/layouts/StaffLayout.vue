<template>
    <div class="staff-shell">
        <button class="btn btn-primary staff-toggle d-lg-none" @click="toggleSidebar">
            <i class="bi bi-list me-1"></i> Menu
        </button>

        <div v-if="showSidebar" class="sidebar-backdrop d-lg-none" @click="toggleSidebar"></div>

        <div class="staff-layout">
            <aside class="staff-sidebar" :class="{ show: showSidebar }">
                <div>
                    <div class="sidebar-brand">
                        <p class="brand-kicker mb-1">Cinema Operations</p>
                        <h5 class="mb-0 d-flex align-items-center">Staff Panel</h5>
                    </div>

                    <ul class="nav flex-column staff-nav mt-3">
                        <li class="nav-item">
                            <router-link
                                to="/staff/seat-map"
                                class="nav-link"
                                active-class="active"
                                @click="closeOnMobile"
                            >
                                <i class="bi bi-ticket-detailed me-2"></i> Bán vé
                            </router-link>
                        </li>

                        <li class="nav-item">
                            <router-link
                                to="/staff/showtimes"
                                class="nav-link"
                                active-class="active"
                                @click="closeOnMobile"
                            >
                                <i class="bi bi-clock-history me-2"></i> Suất chiếu
                            </router-link>
                        </li>

                        <li class="nav-item">
                            <router-link
                                to="/staff/sold-tickets"
                                class="nav-link"
                                active-class="active"
                                @click="closeOnMobile"
                            >
                                <i class="bi bi-receipt me-2"></i> Vé đã bán
                            </router-link>
                        </li>

                        <li class="nav-item">
                            <router-link
                                to="/staff/search-ticket"
                                class="nav-link"
                                active-class="active"
                                @click="closeOnMobile"
                            >
                                <i class="bi bi-search me-2"></i> Tra cứu vé
                            </router-link>
                        </li>
                    </ul>
                </div>

                <div class="staff-footer">
                    <p class="mb-2 small text-secondary">{{ auth.fullName || auth.username || "Nhân viên" }}</p>
                    <button class="btn btn-outline-primary btn-sm w-100 mb-2" @click="goHome">
                        <i class="bi bi-house me-1"></i> Trang chủ
                    </button>
                    <button class="btn btn-primary btn-sm w-100" @click="logout">
                        <i class="bi bi-box-arrow-right me-1"></i> Đăng xuất
                    </button>
                </div>
            </aside>

            <main class="staff-content">
                <div class="content-topbar">
                    <div>
                        <p class="mb-1 text-muted small">Khu vực nhân viên</p>
                        <h4 class="mb-0">{{ activeTitle }}</h4>
                    </div>
                </div>

                <section class="content-surface">
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
    { label: "Bán vé", path: "/staff/seat-map" },
    { label: "Suất chiếu", path: "/staff/showtimes" },
    { label: "Vé đã bán", path: "/staff/sold-tickets" },
    { label: "Tra cứu vé", path: "/staff/search-ticket" },
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
    return active ? active.label : "Staff";
});
</script>

<style scoped>
.staff-shell {
    height: 100vh;
    background:
        radial-gradient(circle at 8% 12%, rgba(255, 107, 53, 0.14), transparent 28%),
        radial-gradient(circle at 90% 88%, rgba(255, 107, 53, 0.1), transparent 33%), #f5f5f5;
    padding: 12px;
    overflow: hidden;
}

.staff-layout {
    height: calc(100vh - 24px);
    display: flex;
    border-radius: 20px;
    border: 1px solid #eee2dc;
    overflow: hidden;
    background: #fff;
    box-shadow: 0 12px 30px rgba(255, 107, 53, 0.11);
}

.staff-toggle {
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

.staff-sidebar {
    width: 260px;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: linear-gradient(180deg, #fff8f4 0%, #fff 45%);
    border-right: 1px solid #f0dfd7;
    color: #333;
    padding: 22px 16px;
    transition: transform 0.25s ease;
    z-index: 1;
}

.sidebar-brand {
    padding: 10px 10px 16px;
    border-bottom: 1px solid #f0dfd7;
}

.brand-kicker {
    color: #a26f5e;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
}

.staff-nav {
    gap: 8px;
}

.nav-link {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 12px;
    border-radius: 10px;
    transition: 0.2s;
    color: #5f5b59;
    font-weight: 500;
}

.nav-link:hover {
    background: rgba(255, 107, 53, 0.1);
    color: #ff6b35;
}

.nav-link.active {
    background: linear-gradient(135deg, #ff6b35, #ff8a5c);
    color: #fff;
    box-shadow: 0 6px 16px rgba(255, 107, 53, 0.25);
}

.staff-footer {
    border-top: 1px solid #f0dfd7;
    padding: 14px 8px 4px;
    margin-top: auto;
}

.staff-content {
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
        transform: translateX(-100%);
        z-index: 1100;
    }

    .staff-sidebar.show {
        transform: translateX(0);
    }

    .staff-content {
        padding: 66px 12px 12px;
    }
}
</style>
