import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const routes = [
    // Trang mặc định → login
    { path: '/', redirect: '/login' },

    // Đăng nhập
    { path: '/login', component: () => import('@/views/Auth/LoginView.vue') },

    // Kết quả thanh toán
    {
        path: '/payment-result', component: () => import('@/views/Staff/PaymentResult.vue')
    },

    // ADMIN layout
    {
        path: '/admin',
        component: () => import('@/layouts/AdminLayout.vue'),
        meta: { requiresAdmin: true },
        children: [
            { path: 'dashboard', component: () => import('@/views/Admin/DashboardView.vue') },
            { path: 'movies', component: () => import('@/views/Admin/MoviesView.vue') },
            { path: 'rooms', component: () => import('@/views/Admin/RoomsView.vue') },
            { path: 'showtimes', component: () => import('@/views/Admin/ShowtimesView.vue') },
            { path: 'bookings', component: () => import('@/views/Admin/BookingsView.vue') },
            { path: 'revenue', component: () => import('@/views/Admin/RevenueChart.vue') },
        ],
    },

    // STAFF layout
    {
        path: '/staff',
        component: () => import('@/layouts/StaffLayout.vue'),
        meta: { requiresStaff: true },
        children: [
            { path: 'seat-map', component: () => import('@/views/Staff/SellTicket/SellTicketView.vue') },
            { path: 'showtimes', component: () => import('@/views/Staff/ShowtimesView.vue') },
            { path: 'sold-tickets', component: () => import('@/views/Staff/SoldTicketsView.vue') },
        ],
    },

    // 404 fallback
    { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

// Middleware bảo vệ quyền truy cập
router.beforeEach((to, from, next) => {
    const auth = useAuthStore()
    const role = auth.role || localStorage.getItem('role')

    // Chưa đăng nhập mà vào trang cần quyền
    if (!role && (to.meta.requiresAdmin || to.meta.requiresStaff)) {
        return next('/login')
    }

    // STAFF vào trang admin → chặn
    if (to.meta.requiresAdmin && role !== 'ADMIN') {
        return next('/login')
    }

    // ADMIN vào trang staff → chặn
    if (to.meta.requiresStaff && role !== 'STAFF') {
        return next('/login')
    }

    // Nếu đã đăng nhập → điều hướng đúng khu vực
    if (to.path === '/login' && role) {
        if (role === 'ADMIN') return next('/admin/dashboard')
        if (role === 'STAFF') return next('/staff/seat-map')
    }

    next()
})

export default router
