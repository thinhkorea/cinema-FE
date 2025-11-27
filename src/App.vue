<template>
    <RouterView />

    <!-- Toast thông báo tài khoản bị khóa -->
    <div v-if="showAccountLockedNotification" class="position-fixed bottom-0 end-0 p-3" style="z-index: 9999">
        <div
            class="alert alert-danger alert-dismissible fade show d-flex align-items-center"
            role="alert"
            style="min-width: 350px"
        >
            <i class="bi bi-exclamation-circle-fill me-3" style="font-size: 1.5rem"></i>
            <div class="flex-grow-1">
                <strong>Tài khoản của bạn đã bị khóa!</strong>
                <p class="mb-0 small">
                    Bạn sẽ được chuyển hướng đến trang đăng nhập trong {{ redirectCountdown }} giây...
                </p>
            </div>
            <button type="button" class="btn-close ms-2" @click="dismissNotification" aria-label="Close"></button>
        </div>
    </div>

    <!-- Toast thông báo concurrent login -->
    <div v-if="showConcurrentLoginNotification" class="position-fixed bottom-0 end-0 p-3" style="z-index: 9999">
        <div
            class="alert alert-warning alert-dismissible fade show d-flex align-items-center"
            role="alert"
            style="min-width: 350px"
        >
            <i class="bi bi-info-circle-fill me-3" style="font-size: 1.5rem"></i>
            <div class="flex-grow-1">
                <strong>Phiên đăng nhập đã hết hạn!</strong>
                <p class="mb-0 small">
                    Do có đăng nhập mới từ thiết bị khác. Chuyển hướng trong {{ redirectCountdown }} giây...
                </p>
            </div>
            <button type="button" class="btn-close ms-2" @click="dismissNotification" aria-label="Close"></button>
        </div>
    </div>
</template>

<script setup>
import { onMounted, ref, onUnmounted } from "vue";
import { useAuthStore } from "@/stores/auth.store";
import { useRouter } from "vue-router";

const auth = useAuthStore();
const router = useRouter();
const showAccountLockedNotification = ref(false);
const showConcurrentLoginNotification = ref(false);
const redirectCountdown = ref(3);
let checkInterval = null;
let countdownInterval = null;

const handleAccountStatus = (reason) => {
    if (reason === "ACCOUNT_LOCKED") {
        showAccountLockedNotification.value = true;
        showConcurrentLoginNotification.value = false;
        startRedirectCountdown();
    } else if (reason === "CONCURRENT_LOGIN") {
        showConcurrentLoginNotification.value = true;
        showAccountLockedNotification.value = false;
        startRedirectCountdown();
    } else if (reason === "TOKEN_EXPIRED") {
        // Token expired - redirect im lặng
        router.push("/login");
    }
};

const dismissNotification = () => {
    showAccountLockedNotification.value = false;
    showConcurrentLoginNotification.value = false;
    if (countdownInterval) clearInterval(countdownInterval);
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

const startRedirectCountdown = () => {
    redirectCountdown.value = 3;

    if (countdownInterval) clearInterval(countdownInterval);

    countdownInterval = setInterval(() => {
        redirectCountdown.value--;

        if (redirectCountdown.value <= 0) {
            clearInterval(countdownInterval);
            showAccountLockedNotification.value = false;
            showConcurrentLoginNotification.value = false;
            router.push("/login");
        }
    }, 1000);
};

onUnmounted(() => {
    if (checkInterval) clearInterval(checkInterval);
    if (countdownInterval) clearInterval(countdownInterval);
});
</script>

<style>
body {
    background-color: #fafafa;
}
</style>
