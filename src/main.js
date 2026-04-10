import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './style.css'

import { useAuthStore } from '@/stores/auth.store'

// Tạo app & pinia
const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

// Gọi store sau khi pinia đã gắn
const auth = useAuthStore()
auth.restoreSession()

//  Mount app
app.mount('#app')
