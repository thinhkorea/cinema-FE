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

// interceptor lỗi 401 (chỉ log, không logout ngay)
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            console.warn('401 Unauthorized:', err.config.url)
        }
        return Promise.reject(err)
    }
)

export default api
