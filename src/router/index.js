import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";

const routes = [
    { path: "/", component: () => import("@/views/HomeView.vue"), meta: { public: true } },
    { path: "/movies", component: () => import("@/views/MoviesView.vue"), meta: { public: true } },
    { path: "/login", component: () => import("@/views/Auth/LoginView.vue"), meta: { public: true } },
    { path: "/register", component: () => import("@/views/Auth/RegisterView.vue"), meta: { public: true } },
    { path: "/login-success", component: () => import("@/views/Auth/LoginSuccess.vue"), meta: { public: true } },

    { path: "/movie/:id", component: () => import("@/views/MovieDetail.vue"), meta: { public: true } },
    { path: "/booking/:movieId", component: () => import("@/views/BookingView.vue"), meta: { public: true } },
    {
        path: "/booking/:movieId/seats/:showtimeId",
        component: () => import("@/views/SeatMapView.vue"),
        meta: { requiresAuth: true },
    },

    {
        path: "/payment-result",
        component: () => import("@/views/Customer/PaymentResult.vue"),
        meta: { requiresAuth: true, requiresCustomer: true },
    },
    {
        path: "/my-bookings/txn/:txnRef",
        component: () => import("@/views/Customer/MyBookingGroup.vue"),
        meta: { requiresAuth: true, requiresCustomer: true },
    },
    { path: "/profile", component: () => import("@/views/Customer/ProfileView.vue"), meta: { requiresAuth: true, requiresCustomer: true } },
    {
        path: "/my-bookings",
        component: () => import("@/views/Customer/MyBookingView.vue"),
        meta: { requiresAuth: true, requiresCustomer: true },
    },

    // ADMIN
    {
        path: "/admin",
        component: () => import("@/layouts/AdminLayout.vue"),
        meta: { requiresAdmin: true },
        children: [
            { path: "dashboard", component: () => import("@/views/Admin/DashboardView.vue") },
            { path: "movies", component: () => import("@/views/Admin/MoviesView.vue") },
            { path: "rooms", component: () => import("@/views/Admin/RoomsView.vue") },
            { path: "showtimes", component: () => import("@/views/Admin/ShowtimesView.vue") },
            { path: "bookings", component: () => import("@/views/Admin/BookingsView.vue") },
            { path: "revenue", component: () => import("@/views/Admin/RevenueChart.vue") },
            { path: "register-staff", component: () => import("@/views/Admin/RegisterStaffView.vue") },
            { path: "users", component: () => import("@/views/Admin/UsersView.vue") },
        ],
    },

    // STAFF
    {
        path: "/staff",
        component: () => import("@/layouts/StaffLayout.vue"),
        meta: { requiresStaff: true },
        children: [
            { path: "seat-map", component: () => import("@/views/Staff/SellTicket/SellTicketView.vue") },
            { path: "showtimes", component: () => import("@/views/Staff/ShowtimesView.vue") },
            { path: "sold-tickets", component: () => import("@/views/Staff/SoldTicketsView.vue") },
            { path: "payment-result", component: () => import("@/views/Staff/PaymentResult.vue") },
            { path: "search-ticket", component: () => import("@/views/Staff/SearchTicketView.vue") },
            { path: "ticket/:txnRef", component: () => import("@/views/Staff/Ticket.vue") },
        ],
    },

    // 404 fallback
    { path: "/:pathMatch(.*)*", redirect: "/" },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

// ================== BẢO VỀ QUYỀN TRUY CẬP ==================
router.beforeEach((to, from, next) => {
    const auth = useAuthStore();
    const role = auth.role || localStorage.getItem("role");

    // Cho phép truy cập các route công khai
    if (to.meta.public) {
        return next();
    }

    // Chưa đăng nhập mà vào trang yêu cầu quyền
    if (!role && (to.meta.requiresAuth || to.meta.requiresAdmin || to.meta.requiresStaff || to.meta.requiresCustomer)) {
        return next("/login");
    }

    // STAFF/ADMIN vào trang customer
    if (to.meta.requiresCustomer && role !== "CUSTOMER") {
        return next("/");
    }

    // STAFF vào khu ADMIN
    if (to.meta.requiresAdmin && role !== "ADMIN") {
        return next("/");
    }

    // ADMIN vào khu STAFF
    if (to.meta.requiresStaff && role !== "STAFF") {
        return next("/");
    }

    // Nếu đã login, ngăn quay lại /login hoặc /register
    if ((to.path === "/login" || to.path === "/register") && role) {
        if (role === "ADMIN") return next("/admin/dashboard");
        if (role === "STAFF") return next("/staff/seat-map");
        if (role === "CUSTOMER") return next("/");
    }

    next();
});

export default router;
