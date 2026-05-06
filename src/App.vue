<template>
    <RouterView />
</template>

<script setup>
import { onMounted, onUnmounted } from "vue";
import { useAuthStore } from "@/stores/auth.store";
import { useRouter } from "vue-router";
import { showCinemaToast } from "@/utils/cinemaAlert";

const auth = useAuthStore();
const router = useRouter();
let checkInterval = null;
let redirectTimeout = null;

const handleAccountStatus = (reason) => {
    if (reason === "ACCOUNT_LOCKED") {
        showCinemaToast({
            icon: "error",
            title: "Tài khoản của bạn đã bị khóa",
            text: "Sẽ chuyển về đăng nhập sau 3 giây.",
            timer: 3000,
        });
        scheduleRedirect();
    } else if (reason === "CONCURRENT_LOGIN") {
        showCinemaToast({
            icon: "warning",
            title: "Phiên đăng nhập đã hết hạn",
            text: "Có đăng nhập mới từ thiết bị khác.",
            timer: 3000,
        });
        scheduleRedirect();
    } else if (reason === "TOKEN_EXPIRED") {
        // Token expired - redirect im lặng
        router.push("/login");
    }
};

onMounted(() => {
    // Restore session khi app load
    auth.restoreSession();

    // Check account status ngay khi load
    if (auth.isAuthenticated) {
        auth.checkAccountStatus().then((result) => {
            if (!result.isActive) {
                handleAccountStatus(result.reason);
            }
        });
    }

    // Check account status mỗi 10 giây nếu user đã login
    checkInterval = setInterval(async () => {
        if (auth.isAuthenticated) {
            const result = await auth.checkAccountStatus();
            if (!result.isActive) {
                handleAccountStatus(result.reason);
            }
        }
    }, 10000); // Check mỗi 10 giây
});

const scheduleRedirect = () => {
    if (redirectTimeout) {
        clearTimeout(redirectTimeout);
    }
    redirectTimeout = setTimeout(() => {
        router.push("/login");
    }, 3000);
};

onUnmounted(() => {
    if (checkInterval) clearInterval(checkInterval);
    if (redirectTimeout) clearTimeout(redirectTimeout);
});
</script>

<style>
body {
    background-color: #fafafa;
}
</style>
