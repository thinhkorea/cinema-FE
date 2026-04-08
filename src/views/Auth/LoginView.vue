<template>
    <div class="login-container">
        <div class="bg-decoration bg-decoration-1"></div>
        <div class="bg-decoration bg-decoration-2"></div>

        <div class="container-fluid h-100 d-flex align-items-center justify-content-center py-5">
            <div class="login-wrapper">
                <div class="text-center mb-5">
                    <div class="logo-icon mb-3">
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="48" height="48" rx="12" fill="#0066ff" />
                            <path d="M24 10L34 24L24 38L14 24L24 10Z" fill="white" />
                        </svg>
                    </div>
                    <h1 class="login-title mb-2">Đăng nhập hệ thống</h1>
                    <p class="login-subtitle">Quản lý tài khoản của bạn một cách an toàn</p>
                </div>

                <div class="login-card">
                    <form @submit.prevent="handleLogin">
                        <div class="form-group mb-4">
                            <label class="form-label fw-600">Email hoặc số điện thoại</label>
                            <div class="input-wrapper">
                                <span class="input-icon">
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 20 20"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M10 10C12.21 10 14 8.21 14 6C14 3.79 12.21 2 10 2C7.79 2 6 3.79 6 6C6 8.21 7.79 10 10 10ZM10 12C7.67 12 3 13.17 3 15.5V17C3 17.55 3.45 18 4 18H16C16.55 18 17 17.55 17 17V15.5C17 13.17 12.33 12 10 12Z"
                                            fill="#0066ff"
                                        />
                                    </svg>
                                </span>
                                <input
                                    v-model.trim="form.identifier"
                                    type="text"
                                    class="form-control form-control-lg"
                                    placeholder="Nhập email hoặc số điện thoại..."
                                    required
                                    autocomplete="username"
                                />
                            </div>
                        </div>

                        <div class="form-group mb-4">
                            <label class="form-label fw-600">Mật khẩu</label>
                            <div class="input-wrapper">
                                <span class="input-icon">
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 20 20"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM10 3C11.66 3 13 4.34 13 6C13 7.66 11.66 9 10 9C8.34 9 7 7.66 7 6C7 4.34 8.34 3 10 3ZM10 17.2C7.5 17.2 5.29 15.92 4 13.98C4.02 11.99 8 11 10 11C11.99 11 15.97 11.99 16 13.98C14.71 15.92 12.5 17.2 10 17.2Z"
                                            fill="#0066ff"
                                        />
                                    </svg>
                                </span>
                                <input
                                    v-model.trim="form.password"
                                    :type="showPassword ? 'text' : 'password'"
                                    class="form-control form-control-lg"
                                    placeholder="Nhập mật khẩu..."
                                    required
                                    autocomplete="current-password"
                                />
                                <button
                                    type="button"
                                    class="toggle-password"
                                    @click="togglePassword"
                                    :title="showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
                                >
                                    <svg
                                        v-if="!showPassword"
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
                                            fill="#666"
                                        />
                                    </svg>
                                    <svg
                                        v-else
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M11.83 9L15.64 12.81C15.87 12.35 16 11.84 16 11.3c0-2.76-2.24-5-5-5-.54 0-1.05.13-1.54.36l.83 1.34zM7.0701 6.71L5.04 4.68C3.28 5.99 1.87 7.7 1 9.86c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.62.64L21 20.73 22.73 19 3.73 1 2 2.27zM7.73 9.71L9.17 11.15c-.08-.53 0-1.25.25-1.88.5-1.56 2.04-2.71 3.72-2.77-.60.25-1.13.75-1.47 1.42-.29.58-.48 1.45-.66 2.04l-.23.41z"
                                            fill="#666"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <button type="submit" class="btn btn-login w-100 fw-600 py-2 mb-4" :disabled="loading">
                            <span v-if="!loading">Đăng nhập</span>
                            <span v-else class="d-flex align-items-center justify-content-center">
                                <span class="spinner-border spinner-border-sm me-2"></span>
                                Đang xử lý...
                            </span>
                        </button>

                        <div v-if="error" class="alert alert-danger alert-dismissible fade show mb-4" role="alert">
                            <strong>Lỗi!</strong> {{ error }}
                            <button type="button" class="btn-close" @click="error = ''"></button>
                        </div>

                        <div v-if="success" class="alert alert-success alert-dismissible fade show mb-4" role="alert">
                            {{ success }}
                            <button type="button" class="btn-close" @click="success = ''"></button>
                        </div>
                    </form>

                    <div class="text-center mt-4">
                        <p class="mb-0">
                            Chưa có tài khoản?
                            <router-link to="/register" class="signup-link fw-600">Đăng ký ngay</router-link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";

const router = useRouter();
const auth = useAuthStore();

const form = reactive({
    identifier: "",
    password: "",
});

const error = ref("");
const success = ref("");
const loading = ref(false);
const showPassword = ref(false);

function togglePassword() {
    showPassword.value = !showPassword.value;
}

async function handleLogin() {
    error.value = "";
    success.value = "";
    loading.value = true;

    try {
        await auth.login({
            identifier: form.identifier,
            password: form.password,
        });

        success.value = "Đăng nhập thành công!";

        setTimeout(() => {
            const role = auth.role;
            if (role === "ADMIN") {
                router.push("/admin/dashboard");
            } else if (role === "STAFF") {
                router.push("/staff/seat-map");
            } else if (role === "CUSTOMER") {
                router.push("/");
            } else {
                error.value = "Không xác định được quyền truy cập.";
            }
        }, 600);
    } catch (err) {
        console.error("Login failed:", err);
        const errorMsg = err.response?.data?.message || err.response?.data;

        if (errorMsg === "Account is locked") {
            error.value = "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.";
        } else {
            error.value = errorMsg || "Email/số điện thoại hoặc mật khẩu không đúng.";
        }
    } finally {
        loading.value = false;
    }
}

</script>

<style scoped>
* {
    box-sizing: border-box;
}

.login-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
}

.bg-decoration {
    position: absolute;
    border-radius: 50%;
    opacity: 0.08;
    pointer-events: none;
}

.bg-decoration-1 {
    width: 400px;
    height: 400px;
    background: #0066ff;
    top: -100px;
    right: -100px;
    animation: float 6s ease-in-out infinite;
}

.bg-decoration-2 {
    width: 300px;
    height: 300px;
    background: #00d4ff;
    bottom: -50px;
    left: -50px;
    animation: float 8s ease-in-out infinite reverse;
}

@keyframes float {
    0%,
    100% {
        transform: translateY(0px);
    }
    50% {
        transform: translateY(20px);
    }
}

.login-wrapper {
    width: 100%;
    max-width: 440px;
    padding: 0 20px;
    animation: slideIn 0.5s ease-out;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.logo-icon {
    animation: scaleIn 0.6s ease-out;
}

@keyframes scaleIn {
    from {
        opacity: 0;
        transform: scale(0.9);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

.login-title {
    font-size: 32px;
    font-weight: 700;
    color: #1a1a1a;
    letter-spacing: -0.5px;
}

.login-subtitle {
    font-size: 14px;
    color: #666;
    margin-bottom: 0;
}

.login-card {
    background: white;
    border-radius: 16px;
    padding: 40px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
    backdrop-filter: blur(10px);
    animation: fadeIn 0.6s ease-out 0.2s both;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

.form-label {
    font-size: 14px;
    color: #333;
    margin-bottom: 8px;
    display: block;
    font-weight: 600;
}

.input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.input-icon {
    position: absolute;
    left: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #0066ff;
    pointer-events: none;
}

.form-control-lg {
    padding: 10px 12px 10px 44px;
    font-size: 15px;
    border: 2px solid #e8e8e8;
    border-radius: 10px;
    transition: all 0.3s ease;
    font-weight: 500;
    width: 100%;
}

.form-control-lg:focus {
    border-color: #0066ff;
    box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
    outline: none;
}

.form-control-lg::placeholder {
    color: #999;
}

.toggle-password {
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
    transition: color 0.2s;
}

.toggle-password:hover {
    color: #0066ff;
}

.form-check-input {
    border: 2px solid #e8e8e8;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.2s;
}

.form-check-input:checked {
    background-color: #0066ff;
    border-color: #0066ff;
}

.form-check-input:focus {
    box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
}

.form-check-label {
    font-size: 14px;
    color: #666;
    cursor: pointer;
    margin-bottom: 0;
    font-weight: 500;
}

.forgot-link {
    font-size: 14px;
    color: #0066ff;
    text-decoration: none;
    transition: all 0.2s;
    font-weight: 500;
}

.forgot-link:hover {
    color: #0052cc;
    text-decoration: underline;
}

.btn-login {
    background: linear-gradient(135deg, #0066ff 0%, #0052cc 100%);
    border: none;
    color: white;
    border-radius: 10px;
    font-size: 16px;
    transition: all 0.3s ease;
    cursor: pointer;
}

.btn-login:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 12px 24px rgba(0, 102, 255, 0.3);
}

.btn-login:active:not(:disabled) {
    transform: translateY(0);
}

.btn-login:disabled {
    opacity: 0.8;
    cursor: not-allowed;
}

.divider {
    display: flex;
    align-items: center;
    gap: 16px;
    color: #ccc;
    font-size: 14px;
    margin: 24px 0;
}

.divider::before,
.divider::after {
    content: "";
    flex: 1;
    height: 1px;
    background: #e8e8e8;
}

.divider-text {
    color: #999;
    font-weight: 500;
    font-size: 13px;
}

.btn-social {
    background: #f5f5f5;
    border: 2px solid #e8e8e8;
    color: #333;
    border-radius: 10px;
    font-size: 15px;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    cursor: pointer;
}

.btn-social:hover {
    background: #fff;
    border-color: #0066ff;
    color: #0066ff;
}

.signup-link {
    color: #0066ff;
    text-decoration: none;
    transition: all 0.2s;
}

.signup-link:hover {
    color: #0052cc;
    text-decoration: underline;
}

.alert {
    border-radius: 10px;
    border: none;
    font-size: 14px;
}

.alert-danger {
    background: #fff5f5;
    color: #c53030;
}

.alert-success {
    background: #f0fdf4;
    color: #166534;
}

@media (max-width: 576px) {
    .login-wrapper {
        max-width: 100%;
    }

    .login-card {
        padding: 30px;
    }

    .login-title {
        font-size: 24px;
    }

    .bg-decoration-1,
    .bg-decoration-2 {
        display: none;
    }
}
</style>
