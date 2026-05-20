import { defineStore } from "pinia";
import api from "@/api";
import { jwtDecode } from "jwt-decode";

function applySession(target, accessToken, refreshToken, userIdOverride = null) {
    const decoded = jwtDecode(accessToken);

    target.token = accessToken;
    target.refreshToken = refreshToken;
    target.role = decoded.role || "CUSTOMER";
    target.username = decoded.sub;
    target.fullName = decoded.fullName || decoded.sub;
    target.userId = userIdOverride ?? target.userId ?? localStorage.getItem("userId");

    localStorage.setItem("token", accessToken);
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("role", target.role);
    localStorage.setItem("username", target.username);
    localStorage.setItem("fullName", target.fullName);
    if (target.userId != null) {
        localStorage.setItem("userId", target.userId);
    }
}

function clearSessionStorage() {
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("fullName");
    localStorage.removeItem("userId");
}

export const useAuthStore = defineStore("auth", {
    state: () => ({
        token: localStorage.getItem("accessToken") || localStorage.getItem("token") || null,
        refreshToken: localStorage.getItem("refreshToken") || null,
        username: localStorage.getItem("username") || null,
        role: localStorage.getItem("role") || null,
        fullName: localStorage.getItem("fullName") || null,
        userId: localStorage.getItem("userId") || null,
        sessionValidationInterval: null,
        isValidatingSession: false,
        hasShownConcurrentLoginAlert: false,
    }),

    getters: {
        isAuthenticated: (state) => !!state.token,
        isStaff: (state) => state.role === "STAFF",
        isAdmin: (state) => state.role === "ADMIN",
        isCustomer: (state) => state.role === "CUSTOMER",
    },

    actions: {
        setSession(accessToken, refreshToken, userId = null) {
            applySession(this, accessToken, refreshToken, userId);
        },

        clearSession() {
            this.token = null;
            this.refreshToken = null;
            this.username = null;
            this.role = null;
            this.fullName = null;
            this.userId = null;
            this.isValidatingSession = false;
            this.hasShownConcurrentLoginAlert = false;
            clearSessionStorage();
            this.stopSessionValidation();
        },

        async login(credentials) {
            try {
                const response = await api.post("/auth/login", credentials);
                const {
                    token,
                    accessToken,
                    refreshToken,
                    role,
                    message,
                    userId,
                } = response.data;

                const effectiveAccessToken = accessToken || token;

                if (message !== "OK") throw new Error(message || "Sai tài khoản hoặc mật khẩu");
                if (!effectiveAccessToken) throw new Error("Server không trả về access token");
                if (!refreshToken) throw new Error("Server không trả về refresh token");

                this.setSession(effectiveAccessToken, refreshToken, userId);
                if (role) {
                    this.role = role;
                    localStorage.setItem("role", role);
                }
                this.startSessionValidation();
            } catch (error) {
                this.clearSession();
                throw error;
            }
        },

        async sendRegisterOtp(userData) {
            const response = await api.post("/auth/register/send-otp", userData);
            return response.data;
        },

        async verifyRegisterOtp(email, otp) {
            const response = await api.post("/auth/register/verify-otp", { email, otp });
            return response.data;
        },

        async logout() {
            try {
                if (this.token) {
                    await api.post(
                        "/auth/logout",
                        {},
                        {
                            headers: { Authorization: `Bearer ${this.token}` },
                        }
                    );
                }
            } catch (error) {
                console.error("Lỗi khi logout:", error);
            } finally {
                this.clearSession();
            }
        },

        restoreSession() {
            const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
            const refreshToken = localStorage.getItem("refreshToken");
            const role = localStorage.getItem("role");
            const username = localStorage.getItem("username");
            const fullName = localStorage.getItem("fullName");
            const userId = localStorage.getItem("userId");

            if (token && refreshToken && role && userId) {
                this.token = token;
                this.refreshToken = refreshToken;
                this.role = role;
                this.username = username;
                this.fullName = fullName;
                this.userId = userId;
                this.startSessionValidation();
            }
        },

        async validateSession() {
            if (!this.token || this.isValidatingSession) return true;

            this.isValidatingSession = true;

            try {
                await api.get("/auth/me");
                this.hasShownConcurrentLoginAlert = false;
                return true;
            } catch (error) {
                const errorData = error.response?.data;

                if (
                    errorData?.code === "CONCURRENT_LOGIN" ||
                    errorData?.message?.includes("CONCURRENT_LOGIN") ||
                    errorData?.message?.includes("concurrent") ||
                    errorData === "CONCURRENT_LOGIN"
                ) {
                    if (!this.hasShownConcurrentLoginAlert) {
                        this.hasShownConcurrentLoginAlert = true;
                        await this.logout();
                        setTimeout(() => {
                            window.location.href = "/login";
                        }, 1000);
                    }
                    return false;
                }

                if (error.response?.status === 401 && !this.hasShownConcurrentLoginAlert) {
                    this.hasShownConcurrentLoginAlert = true;
                    await this.logout();
                    window.location.href = "/login";
                    return false;
                }

                return true;
            } finally {
                this.isValidatingSession = false;
            }
        },

        startSessionValidation() {
            if (this.sessionValidationInterval) {
                clearInterval(this.sessionValidationInterval);
            }

            this.sessionValidationInterval = setInterval(async () => {
                if (this.isAuthenticated && !this.isValidatingSession) {
                    await this.validateSession();
                }
            }, 30000);
        },

        stopSessionValidation() {
            if (this.sessionValidationInterval) {
                clearInterval(this.sessionValidationInterval);
                this.sessionValidationInterval = null;
            }
        },

        async checkAccountStatus() {
            if (!this.token) return { isActive: true, reason: null };

            try {
                const response = await api.get("/auth/me");
                const userData = response.data;

                if (userData.isActive === false) {
                    await this.logout();
                    return { isActive: false, reason: "ACCOUNT_LOCKED" };
                }

                return { isActive: true, reason: null };
            } catch (error) {
                const errorData = error.response?.data;

                if (
                    errorData?.code === "CONCURRENT_LOGIN" ||
                    errorData?.message?.includes("CONCURRENT_LOGIN") ||
                    errorData?.message?.includes("concurrent") ||
                    errorData === "CONCURRENT_LOGIN"
                ) {
                    await this.logout();
                    return { isActive: false, reason: "CONCURRENT_LOGIN" };
                }

                if (error.response?.status === 400 || error.response?.status === 401) {
                    if (errorData?.message === "Account is locked" || errorData === "Account is locked") {
                        await this.logout();
                        return { isActive: false, reason: "ACCOUNT_LOCKED" };
                    }
                    await this.logout();
                    return { isActive: false, reason: "TOKEN_EXPIRED" };
                }

                return { isActive: true, reason: null };
            }
        },
    },
});
