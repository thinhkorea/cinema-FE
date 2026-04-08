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
        sessionValidationInterval: null, // Để lưu interval ID
        isValidatingSession: false, // Flag để tránh validation đồng thời
        hasShownConcurrentLoginAlert: false, // Flag để tránh multiple alerts
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
                console.log("Đang login với:", credentials.identifier || credentials.username);

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

                // Bắt đầu kiểm tra session định kỳ
                this.startSessionValidation();
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

        async register(userData) {
            try {
                console.log("Đang register với:", userData.email);

                // Bước 1: Đăng ký tài khoản
                const registerResponse = await api.post("/auth/register", userData);
                console.log("Register response từ server:", registerResponse.data);

                const { message } = registerResponse.data;

                // Kiểm tra đăng ký thành công
                const successMessages = ["OK", "Đăng ký thành công!"];
                if (!successMessages.includes(message)) {
                    throw new Error(message || "Đăng ký thất bại");
                }

                console.log("Đăng ký thành công, đang tự động đăng nhập...");

                // Bước 2: Tự động đăng nhập để lấy token
                await this.login({
                    identifier: userData.email,
                    password: userData.password,
                });

                console.log("Đăng ký và đăng nhập thành công!");
            } catch (error) {
                console.error("Register thất bại:", error);

                // Reset state khi lỗi
                this.token = null;
                this.role = null;
                this.username = null;
                this.fullName = null;
                this.userId = null;

                // Throw error để RegisterView.vue xử lý
                localStorage.clear();
                throw error;
            }
        },

        async logout() {
            try {
                // Gọi API logout để xóa session trong database
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
                // Tiếp tục logout dù có lỗi API
            } finally {
                // Xóa dữ liệu local
                this.token = null;
                this.username = null;
                this.role = null;
                this.fullName = null;
                this.userId = null;
                this.isValidatingSession = false;
                this.hasShownConcurrentLoginAlert = false;

                localStorage.removeItem("token");
                localStorage.removeItem("username");
                localStorage.removeItem("role");
                localStorage.removeItem("fullName");
                localStorage.removeItem("userId");

                // Dừng session validation
                this.stopSessionValidation();

                console.log("Đã logout");
            }
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

                // Bắt đầu session validation khi restore
                this.startSessionValidation();
            }
        },

        // Kiểm tra session còn hợp lệ không (cho concurrent login)
        async validateSession() {
            if (!this.token || this.isValidatingSession) return true;

            this.isValidatingSession = true;
            console.log("Đang kiểm tra session validation...");

            try {
                // Gọi API để validate token hiện tại
                const response = await api.get("/auth/me");
                console.log("Session validation thành công");
                // Reset flag khi thành công
                this.hasShownConcurrentLoginAlert = false;
                return true; // Session còn hợp lệ
            } catch (error) {
                console.log("Session validation thất bại:", error.response?.status);
                const errorData = error.response?.data;
                console.log("Error data full:", JSON.stringify(errorData, null, 2));
                console.log("Error message:", errorData?.message);
                console.log("Error code:", errorData?.code);

                // Kiểm tra nếu là lỗi CONCURRENT_LOGIN - thử nhiều pattern khác nhau
                if (
                    errorData?.code === "CONCURRENT_LOGIN" ||
                    errorData?.message?.includes("CONCURRENT_LOGIN") ||
                    errorData?.message?.includes("concurrent") ||
                    errorData?.message?.includes("already logged in") ||
                    errorData === "CONCURRENT_LOGIN"
                ) {
                    console.warn("CONCURRENT_LOGIN detected - Session đã bị vô hiệu hóa");
                    console.log("Hiển thị thông báo concurrent login...");

                    // Chỉ logout nếu chưa thực hiện trước đó
                    if (!this.hasShownConcurrentLoginAlert) {
                        this.hasShownConcurrentLoginAlert = true;
                        await this.logout();
                        setTimeout(() => {
                            window.location.href = "/login";
                        }, 1000);
                    }
                    return false;
                }

                // Các lỗi khác cũng logout (chỉ khi chưa alert)
                if (error.response?.status === 401 && !this.hasShownConcurrentLoginAlert) {
                    console.warn("Session expired (401)");
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

        // Bắt đầu kiểm tra session định kỳ
        startSessionValidation() {
            if (this.sessionValidationInterval) {
                clearInterval(this.sessionValidationInterval);
            }

            console.log("Bắt đầu session validation (mỗi 30 giây)");

            // Kiểm tra mỗi 30 giây (thay vì 5 giây để giảm tải)
            this.sessionValidationInterval = setInterval(async () => {
                if (this.isAuthenticated && !this.isValidatingSession) {
                    console.log("Thực hiện session validation...");
                    await this.validateSession();
                } else {
                    console.log("⏸Không authenticated hoặc đang validation, bỏ qua");
                }
            }, 30000); // 30 giây
        },

        // Dừng kiểm tra session
        stopSessionValidation() {
            if (this.sessionValidationInterval) {
                clearInterval(this.sessionValidationInterval);
                this.sessionValidationInterval = null;
            }
        },

        // Kiểm tra xem tài khoản có còn active không
        async checkAccountStatus() {
            if (!this.token) return { isActive: true, reason: null }; // Không có token thì không cần check

            try {
                const response = await api.get("/auth/me");
                const userData = response.data;

                console.log("Account status check:", userData);

                // Kiểm tra xem isActive có tồn tại và là false
                if (userData.isActive === false) {
                    console.warn("Account is locked by admin!");
                    await this.logout();
                    return { isActive: false, reason: "ACCOUNT_LOCKED" };
                }

                return { isActive: true, reason: null };
            } catch (error) {
                console.warn("Account check error:", error.response?.status, error.response?.data);
                const errorData = error.response?.data;

                // Kiểm tra concurrent login
                if (
                    errorData?.code === "CONCURRENT_LOGIN" ||
                    errorData?.message?.includes("CONCURRENT_LOGIN") ||
                    errorData?.message?.includes("concurrent") ||
                    errorData?.message?.includes("already logged in") ||
                    errorData === "CONCURRENT_LOGIN"
                ) {
                    console.warn("Concurrent login detected in checkAccountStatus");
                    await this.logout();
                    return { isActive: false, reason: "CONCURRENT_LOGIN" };
                }

                // Nếu bị lỗi 400 hoặc 401, tài khoản bị khóa hoặc token không hợp lệ
                if (error.response?.status === 400 || error.response?.status === 401) {
                    if (errorData?.message === "Account is locked" || errorData === "Account is locked") {
                        console.warn("Account is locked (from API error)!");
                        await this.logout();
                        return { isActive: false, reason: "ACCOUNT_LOCKED" };
                    }
                    // Token expired hoặc không hợp lệ
                    this.logout();
                    return { isActive: false, reason: "TOKEN_EXPIRED" };
                }

                return { isActive: true, reason: null };
            }
        },
    },
});
