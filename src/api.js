import axios from 'axios'
import { useAuthStore } from './stores/auth.store'

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
})

// interceptor để thêm token cho mọi request
api.interceptors.request.use(
    (config) => {
    try {
        const auth = useAuthStore()
        const token = auth?.token || localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
    } catch (e) {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
    }
    return config
})

// interceptor lỗi 401 và xử lý concurrent login
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            const errorData = err.response?.data;
            const requestUrl = err.config?.url || '';
            const token = localStorage.getItem('token');
            const isPublicAuthRequest =
                requestUrl.includes('/auth/login') ||
                requestUrl.includes('/auth/register') ||
                requestUrl.includes('/auth/register/send-otp') ||
                requestUrl.includes('/auth/register/verify-otp');

            // 401 ở endpoint public (chưa đăng nhập) thì trả lỗi về cho UI tự xử lý
            if (!token || isPublicAuthRequest) {
                return Promise.reject(err);
            }
            
            // Kiểm tra nếu là lỗi concurrent login
            if (errorData?.code === 'CONCURRENT_LOGIN') {
                console.warn('Tài khoản đã được đăng nhập từ nơi khác - xử lý bởi auth store');
                // Không hiển thị alert, để auth store xử lý qua toast
            } else {
                console.warn('401 Unauthorized:', err.config.url);
            }
            
            // Đăng xuất nếu token không hợp lệ
            try {
                const auth = useAuthStore()
                auth.logout()
            } catch (e) {
                localStorage.removeItem('token')
                localStorage.removeItem('role')
                window.location.href = '/login'
            }
        }
        return Promise.reject(err)
    }
)

export default api
