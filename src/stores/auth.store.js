import { defineStore } from "pinia";
import api from "@/api";
import { jwtDecode } from "jwt-decode";

export const useAuthStore = defineStore("auth", {
    state: () => ({
        token: localStorage.getItem("token") || null,
        username: localStorage.getItem("username") || null,
        role: localStorage.getItem("role") || null,
        fullName: localStorage.getItem("fullName") || null,
        userId: localStorage.getItem("userId") || null,
    }),

    getters: {
        isAuthenticated: (state) => !!state.token,
        isStaff: (state) => state.role === "STAFF",
        isAdmin: (state) => state.role === "ADMIN",
        isCustomer: (state) => state.role === "CUSTOMER",
    },

    actions: {
        async login(credentials) {
            try {
                console.log("Đang login với:", credentials.username);

                const response = await api.post("/auth/login", credentials);
                console.log("Response từ server:", response.data);

                const { token, role, message, userId } = response.data;

                // Kiểm tra response hợp lệ
                if (message !== "OK") throw new Error(message || "Sai tài khoản hoặc mật khẩu");
                if (!token) throw new Error("Server không trả về token");

                // Giải mã token để lấy thông tin chi tiết
                const decoded = jwtDecode(token);

                // Lưu vào state
                this.token = token;
                this.role = decoded.role || "CUSTOMER";
                this.username = decoded.sub;
                this.fullName = decoded.fullName || decoded.sub; // Lấy fullName, nếu không có thì dùng username
                this.userId = userId;

                // Lưu vào localStorage
                localStorage.setItem("token", token);
                localStorage.setItem("role", this.role);
                localStorage.setItem("username", this.username);
                localStorage.setItem("fullName", this.fullName);
                localStorage.setItem("userId", this.userId);

                console.log("Login thành công!");
                console.log("   Token:", token.substring(0, 30) + "...");
                console.log("   Role:", this.role);
                console.log("   Username:", this.username);
                console.log("   FullName:", this.fullName);
            } catch (error) {
                console.error("Login thất bại:", error);

                // Reset state khi lỗi
                this.token = null;
                this.role = null;
                this.username = null;
                this.fullName = null;
                this.userId = null;

                // Throw error để LoginView.vue xử lý
                localStorage.clear();
                throw error;
            }
        },

        logout() {
            this.token = null;
            this.username = null;
            this.role = null;
            this.fullName = null;
            this.userId = null;

            localStorage.removeItem("token");
            localStorage.removeItem("username");
            localStorage.removeItem("role");
            localStorage.removeItem("fullName");
            localStorage.removeItem("userId");

            console.log("Đã logout");
        },

        // Khôi phục session khi reload trang
        restoreSession() {
            const token = localStorage.getItem("token");
            const role = localStorage.getItem("role");
            const username = localStorage.getItem("username");
            const fullName = localStorage.getItem("fullName");
            const userId = localStorage.getItem("userId");

            if (token && role && userId) {
                this.token = token;
                this.role = role;
                this.username = username;
                this.fullName = fullName;
                this.userId = userId;
                console.log("Session restored:", { username, role, fullName });
            }
        },

        // Kiểm tra xem tài khoản có còn active không
        async checkAccountStatus() {
            if (!this.token) return true; // Không có token thì không cần check

            try {
                const response = await api.get("/auth/me");
                const userData = response.data;

                console.log("Account status check:", userData);

                // Kiểm tra xem isActive có tồn tại và là false
                if (userData.isActive === false) {
                    console.warn("Account is locked!");
                    this.logout();
                    return false;
                }

                return true;
            } catch (error) {
                console.warn("Account check error:", error.response?.status, error.response?.data);

                // Nếu bị lỗi 400 hoặc 401, tài khoản bị khóa hoặc token không hợp lệ
                if (error.response?.status === 400 || error.response?.status === 401) {
                    const errorData = error.response?.data;
                    if (errorData?.message === "Account is locked" || errorData === "Account is locked") {
                        console.warn("Account is locked (from error)!");
                        this.logout();
                        return false;
                    }
                    // Token expired hoặc không hợp lệ
                    this.logout();
                    return false;
                }

                return true;
            }
        },
    },
});
