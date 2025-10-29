import { defineStore } from 'pinia'
import api from '@/api'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: localStorage.getItem('token') || null,
        user: JSON.parse(localStorage.getItem('user') || 'null'),
        role: localStorage.getItem('role') || null
    }),

    getters: {
        isAuthenticated: (state) => !!state.token,
        isStaff: (state) => state.role === 'STAFF',
        isAdmin: (state) => state.role === 'ADMIN',
        isCustomer: (state) => state.role === 'CUSTOMER'
    },

    actions: {
        async login(credentials) {
            try {
                console.log('🔐 Đang login với:', credentials.username)

                const response = await api.post('/auth/login', credentials)

                console.log('📦 Response từ server:', response.data)

                const { token, role, message } = response.data

                // ✅ Kiểm tra response hợp lệ
                if (!token) {
                    throw new Error('Server không trả về token')
                }

                if (!role) {
                    throw new Error('Server không trả về role')
                }

                if (message !== 'OK') {
                    throw new Error(message || 'Sai tài khoản hoặc mật khẩu')
                }

                // ✅ Lưu vào state
                this.token = token
                this.role = role
                this.user = { username: credentials.username }

                // ✅ Lưu vào localStorage
                localStorage.setItem('token', token)
                localStorage.setItem('role', role)
                localStorage.setItem('user', JSON.stringify(this.user))

                console.log('✅ Login thành công!')
                console.log('   Token:', token.substring(0, 30) + '...')
                console.log('   Role:', role)

            } catch (error) {
                console.error('❌ Login thất bại:', error)

                // Reset state khi lỗi
                this.token = null
                this.role = null
                this.user = null

                // ⚠️ QUAN TRỌNG: Throw error để LoginView.vue catch được
                throw error
            }
        },

        logout() {
            this.token = null
            this.user = null
            this.role = null

            localStorage.removeItem('token')
            localStorage.removeItem('user')
            localStorage.removeItem('role')

            console.log('👋 Đã logout')
        },

        // Khôi phục session khi reload page
        restoreSession() {
            const token = localStorage.getItem('token')
            const user = localStorage.getItem('user')
            const role = localStorage.getItem('role')

            if (token && user && role) {
                this.token = token
                this.user = JSON.parse(user)
                this.role = role
                console.log('🔄 Session restored:', { role })
            }
        }
    }
})