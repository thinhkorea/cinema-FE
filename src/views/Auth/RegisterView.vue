<template>
    <div class="register-container">
        <!-- Updated background to match Login v1 light theme -->
        <div class="bg-decoration bg-decoration-1"></div>
        <div class="bg-decoration bg-decoration-2"></div>

        <div class="container-fluid h-100 d-flex align-items-center justify-content-center py-3">
            <div class="register-wrapper">
                <div class="text-center mb-3">
                    <div class="logo-icon mb-3">
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <!-- Updated logo color from orange to blue -->
                            <rect width="48" height="48" rx="12" fill="#0066ff" />
                            <path d="M24 10L34 24L24 38L14 24L24 10Z" fill="white" />
                        </svg>
                    </div>
                    <h1 class="register-title mb-2">Đăng ký tài khoản</h1>
                    <p class="register-subtitle">Tạo tài khoản mới để bắt đầu trải nghiệm</p>
                </div>

                <div class="register-card">
                    <form @submit.prevent="handleSubmit">
                        <div class="form-group mb-3" v-if="step === 'form'">
                            <label class="form-label fw-600">Họ và tên</label>
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
                                    v-model.trim="form.fullName"
                                    type="text"
                                    class="form-control form-control-lg"
                                    placeholder="Nhập họ và tên..."
                                    required
                                />
                            </div>
                        </div>

                        <div class="form-group mb-3" v-if="step === 'form'">
                            <label class="form-label fw-600">Email</label>
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
                                            d="M2 4H18C19.1 4 20 4.9 20 6V14C20 15.1 19.1 16 18 16H2C0.9 16 0 15.1 0 14V6C0 4.9 0.9 4 2 4Z"
                                            fill="#0066ff"
                                        />
                                        <path d="M18 4L10 9.5L2 4" stroke="#0066ff" stroke-width="1.5" fill="none" />
                                    </svg>
                                </span>
                                <input
                                    v-model.trim="form.email"
                                    type="email"
                                    class="form-control form-control-lg"
                                    placeholder="Nhập email..."
                                    required
                                />
                            </div>
                        </div>

                        <div class="form-group mb-3" v-if="step === 'form'">
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
                                            d="M16 8H15V6C15 3.24 12.76 1 10 1C7.24 1 5 3.24 5 6V8H4C2.89 8 2 8.9 2 10V18C2 19.1 2.89 20 4 20H16C17.1 20 18 19.1 18 18V10C18 8.9 17.1 8 16 8ZM7 6C7 4.34 8.34 3 10 3C11.66 3 13 4.34 13 6V8H7V6ZM16 18H4V10H16V18Z"
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
                                    minlength="6"
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

                        <div class="form-group mb-3" v-if="step === 'form'">
                            <label class="form-label fw-600">Số điện thoại</label>
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
                                            d="M17.45 21H16.09C7.78 20.13 2 14.36 1.13 6.05C1 5.35 1.5 4.75 2.2 4.75H6.01C6.54 4.75 7 5.15 7.1 5.68L8.65 13.34C8.76 13.88 8.52 14.42 8.03 14.7L6.47 15.6C7.89 17.75 9.85 19.41 12.36 20.54L13.46 18.87C13.76 18.39 14.31 18.14 14.86 18.25L20.5 19.8C21 19.9 21.4 20.35 21.4 20.9V24.72C21.4 25.41 20.9 26 20.2 26H20.84C9.7 24.96 2 17.27 1 6.15V4.79C1 4.09 1.5 3.5 2.2 3.5H4.01C4.54 3.5 5 3.9 5.1 4.43L6.65 12.09C6.76 12.63 6.52 13.17 6.03 13.45L4.47 14.35C5.89 16.5 7.85 18.16 10.36 19.29L11.46 17.62C11.76 17.14 12.31 16.89 12.86 17L20.5 18.55C21 18.65 21.4 19.1 21.4 19.65V23.47C21.4 24.16 20.9 24.75 20.2 24.75Z"
                                            fill="#0066ff"
                                        />
                                    </svg>
                                </span>
                                <input
                                    v-model.trim="form.phone"
                                    type="tel"
                                    class="form-control form-control-lg"
                                    placeholder="VD: 0901234567"
                                    required
                                />
                            </div>
                        </div>

                        <div class="form-group mb-3" v-if="step === 'form'">
                            <label class="form-label fw-600">Địa chỉ</label>
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
                                            d="M10 1C6.13 1 3 4.13 3 8C3 13.25 10 19 10 19S17 13.25 17 8C17 4.13 13.87 1 10 1ZM10 11C8.34 11 7 9.66 7 8C7 6.34 8.34 5 10 5C11.66 5 13 6.34 13 8C13 9.66 11.66 11 10 11Z"
                                            fill="#0066ff"
                                        />
                                    </svg>
                                </span>
                                <input
                                    v-model.trim="form.address"
                                    type="text"
                                    class="form-control form-control-lg"
                                    placeholder="VD: 123 Lý Thường Kiệt, TP.HCM"
                                />
                            </div>
                        </div>

                        <div class="form-group mb-3" v-if="step === 'form'">
                            <label class="form-label fw-600">Giới tính</label>
                            <select v-model="form.gender" class="form-select form-select-lg">
                                <option value="MALE">Nam</option>
                                <option value="FEMALE">Nữ</option>
                            </select>
                        </div>

                        <div v-if="step === 'otp'" class="otp-step mb-3">
                            <p class="otp-hint mb-3">
                                Mã OTP đã được gửi đến email <strong>{{ form.email }}</strong>. Vui lòng nhập mã để hoàn tất đăng ký.
                            </p>
                            <div class="form-group mb-2">
                                <label class="form-label fw-600">Mã OTP</label>
                                <div class="input-wrapper">
                                    <span class="input-icon">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 2L3 7V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V7L12 2Z" fill="#0066ff"/>
                                        </svg>
                                    </span>
                                    <input
                                        v-model.trim="otpCode"
                                        type="text"
                                        maxlength="6"
                                        class="form-control form-control-lg"
                                        placeholder="Nhập 6 chữ số OTP"
                                        required
                                    />
                                </div>
                            </div>
                            <div class="d-flex align-items-center justify-content-between mt-2">
                                <button
                                    type="button"
                                    class="btn btn-link p-0 otp-link"
                                    @click="resendOtp"
                                    :disabled="loading || otpCooldown > 0"
                                >
                                    {{ otpCooldown > 0 ? `Gửi lại sau ${otpCooldown}s` : "Gửi lại OTP" }}
                                </button>
                                <button
                                    type="button"
                                    class="btn btn-link p-0 otp-link"
                                    @click="backToForm"
                                    :disabled="loading"
                                >
                                    Quay lại chỉnh thông tin
                                </button>
                            </div>
                        </div>

                        <button type="submit" class="btn btn-register w-100 fw-600 py-2 mb-3" :disabled="loading">
                            <span v-if="!loading">{{ step === "form" ? "Gửi mã OTP" : "Xác thực OTP và đăng ký" }}</span>
                            <span v-else class="d-flex align-items-center justify-content-center">
                                <span class="spinner-border spinner-border-sm me-2"></span>
                                Đang xử lý...
                            </span>
                        </button>

                        <div class="text-center mt-4">
                            <p class="mb-0">
                                Đã có tài khoản?
                                <router-link to="/login" class="login-link fw-600">Đăng nhập ngay</router-link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { onUnmounted, ref } from "vue";
import Swal from "sweetalert2";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";

const router = useRouter();
const auth = useAuthStore();
const loading = ref(false);
const showPassword = ref(false);
const step = ref("form");
const otpCode = ref("");
const otpCooldown = ref(0);
let otpTimer = null;

const form = ref({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    gender: "",
});

const handleSubmit = async () => {
    if (step.value === "form") {
        await sendOtp();
        return;
    }
    await verifyOtpAndRegister();
};

const sendOtp = async () => {
    if (!form.value.password || !form.value.email || !form.value.phone) {
        Swal.fire("Thiếu thông tin", "Vui lòng nhập đầy đủ thông tin!", "warning");
        return;
    }

    try {
        loading.value = true;
        await auth.sendRegisterOtp(form.value);
        step.value = "otp";
        startOtpCooldown(30);
        Swal.fire("OTP đã gửi", "Vui lòng kiểm tra email để lấy mã OTP.", "success");
    } catch (err) {
        console.error("Send OTP error:", err);
        const msg = err.response?.data?.message || err.response?.data?.error || err.response?.data || err.message || "Đăng ký thất bại, vui lòng thử lại!";
        Swal.fire("Lỗi", msg, "error");
    } finally {
        loading.value = false;
    }
};

const verifyOtpAndRegister = async () => {
    if (!otpCode.value || otpCode.value.length !== 6) {
        Swal.fire("Thiếu OTP", "Vui lòng nhập đúng 6 chữ số OTP.", "warning");
        return;
    }

    try {
        loading.value = true;
        await auth.verifyRegisterOtp(form.value.email, otpCode.value);
        await auth.login({
            identifier: form.value.email,
            password: form.value.password,
        });

        await Swal.fire("Thành công", "Đăng ký tài khoản thành công!", "success");
        router.push("/");
    } catch (err) {
        console.error("Verify OTP error:", err);
        const msg = err.response?.data?.message || err.response?.data?.error || err.response?.data || err.message || "Xác thực OTP thất bại!";
        Swal.fire("Lỗi", msg, "error");
    } finally {
        loading.value = false;
    }
};

const resendOtp = async () => {
    if (otpCooldown.value > 0) return;
    await sendOtp();
};

const backToForm = () => {
    step.value = "form";
    otpCode.value = "";
};

const startOtpCooldown = (seconds) => {
    otpCooldown.value = seconds;
    if (otpTimer) {
        clearInterval(otpTimer);
    }
    otpTimer = setInterval(() => {
        otpCooldown.value -= 1;
        if (otpCooldown.value <= 0) {
            clearInterval(otpTimer);
            otpTimer = null;
        }
    }, 1000);
};

onUnmounted(() => {
    if (otpTimer) {
        clearInterval(otpTimer);
    }
});

function togglePassword() {
    showPassword.value = !showPassword.value;
}

</script>

<style scoped>
* {
    box-sizing: border-box;
}

/* Updated container background to light gradient matching Login v1 */
.register-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Updated decorative circles to blue theme */
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

.register-wrapper {
    width: 100%;
    max-width: 500px;
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

.register-title {
    font-size: 32px;
    font-weight: 700;
    color: #1a1a1a;
    letter-spacing: -0.5px;
}

.register-subtitle {
    font-size: 14px;
    color: #666;
    margin-bottom: 0;
}

/* Updated card styling to white background */
.register-card {
    background: white;
    border-radius: 16px;
    padding: 25px;
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
    margin-bottom: 4px;
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

.form-control-lg,
.form-select-lg {
    padding: 8px 12px 8px 44px;
    font-size: 15px;
    background: white;
    border: 2px solid #e8e8e8;
    border-radius: 10px;
    color: #333;
    transition: all 0.3s ease;
    font-weight: 500;
    width: 100%;
    height: 42px;
}

.form-control-lg:focus,
.form-select-lg:focus {
    border-color: #0066ff;
    box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
    outline: none;
}

.form-control-lg::placeholder {
    color: #999;
}

.form-select-lg {
    padding-left: 44px;
}

.form-select-lg option {
    background: white;
    color: #333;
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

/* Updated button gradient to blue from orange */
.btn-register {
    background: linear-gradient(135deg, #0066ff 0%, #0052cc 100%);
    border: none;
    color: white;
    border-radius: 10px;
    font-size: 16px;
    transition: all 0.3s ease;
    cursor: pointer;
}

.btn-register:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 12px 24px rgba(0, 102, 255, 0.3);
}

.btn-register:active:not(:disabled) {
    transform: translateY(0);
}

.btn-register:disabled {
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

.login-link {
    color: #0066ff;
    text-decoration: none;
    transition: all 0.2s;
}

.login-link:hover {
    color: #0052cc;
    text-decoration: underline;
}

.otp-step {
    background: #f4f8ff;
    border: 1px solid #d9e7ff;
    border-radius: 10px;
    padding: 14px;
}

.otp-hint {
    font-size: 14px;
    color: #2f3f59;
    margin: 0;
}

.otp-link {
    font-size: 14px;
    color: #0066ff;
    text-decoration: none;
}

.otp-link:disabled {
    color: #8aa7df;
}

@media (max-width: 576px) {
    .register-wrapper {
        max-width: 100%;
    }

    .register-card {
        padding: 30px;
    }

    .register-title {
        font-size: 24px;
    }

    .bg-decoration-1,
    .bg-decoration-2 {
        display: none;
    }
}
</style>
