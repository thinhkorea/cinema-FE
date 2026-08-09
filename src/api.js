import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useAuthStore } from "./stores/auth.store";

const baseURL = "http://localhost:8080/api";

const api = axios.create({
    baseURL,
    headers: {
        Accept: "application/json;charset=UTF-8",
    },
});

let refreshPromise = null;

function syncAuthStore(accessToken, refreshToken) {
    try {
        const auth = useAuthStore();
        auth.setSession(accessToken, refreshToken);
    } catch (e) {
        const decoded = jwtDecode(accessToken);
        localStorage.setItem("token", accessToken);
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("role", decoded.role || "CUSTOMER");
        localStorage.setItem("username", decoded.sub);
        localStorage.setItem("fullName", decoded.fullName || decoded.sub);
    }
}

function clearLocalSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    localStorage.removeItem("fullName");
    localStorage.removeItem("userId");
}

async function refreshAccessToken() {
    const storedRefreshToken = localStorage.getItem("refreshToken");
    if (!storedRefreshToken) {
        throw new Error("Missing refresh token");
    }

    const response = await axios.post(`${baseURL}/auth/refresh`, {
        refreshToken: storedRefreshToken,
    });

    const accessToken = response.data.accessToken || response.data.token;
    const refreshToken = response.data.refreshToken;

    if (!accessToken || !refreshToken) {
        throw new Error("Invalid refresh response");
    }

    syncAuthStore(accessToken, refreshToken);
    return accessToken;
}

api.interceptors.request.use((config) => {
    if (config.data instanceof FormData) {
        delete config.headers["Content-Type"];
    }

    if (config.skipAuth) {
        delete config.skipAuth;
        return config;
    }

    try {
        const auth = useAuthStore();
        const token = auth?.token || localStorage.getItem("accessToken") || localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (e) {
        const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

api.interceptors.response.use(
    (res) => res,
    async (err) => {
        const status = err.response?.status;
        const requestUrl = err.config?.url || "";
        const errorData = err.response?.data;
        const isPublicAuthRequest =
            requestUrl.includes("/auth/login") ||
            requestUrl.includes("/auth/register") ||
            requestUrl.includes("/auth/register/send-otp") ||
            requestUrl.includes("/auth/register/verify-otp") ||
            requestUrl.includes("/auth/refresh");
        const hasRefreshToken = !!localStorage.getItem("refreshToken");

        if (status === 401 && !isPublicAuthRequest && hasRefreshToken && !err.config?._retry) {
            if (errorData?.code === "CONCURRENT_LOGIN") {
                try {
                    const auth = useAuthStore();
                    auth.clearSession();
                } catch (e) {
                    clearLocalSession();
                }
                return Promise.reject(err);
            }

            err.config._retry = true;

            try {
                if (!refreshPromise) {
                    refreshPromise = refreshAccessToken().finally(() => {
                        refreshPromise = null;
                    });
                }

                const newAccessToken = await refreshPromise;
                err.config.headers.Authorization = `Bearer ${newAccessToken}`;
                return api(err.config);
            } catch (refreshError) {
                try {
                    const auth = useAuthStore();
                    auth.clearSession();
                    window.location.href = "/login";
                } catch (e) {
                    clearLocalSession();
                    window.location.href = "/login";
                }
                return Promise.reject(refreshError);
            }
        }

        if (status === 401) {
            const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
            if (!token || isPublicAuthRequest) {
                return Promise.reject(err);
            }

            try {
                const auth = useAuthStore();
                auth.clearSession();
                window.location.href = "/login";
            } catch (e) {
                clearLocalSession();
                window.location.href = "/login";
            }
        }

        return Promise.reject(err);
    }
);

export default api;
