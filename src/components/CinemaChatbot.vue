<template>
    <div class="cinema-chatbot" :class="{ 'is-open': isOpen }">
        <button
            v-if="!isOpen"
            class="chatbot-fab"
            type="button"
            aria-label="Mở trợ lý ảo"
            title="Trợ lý ảo"
            @click="openChat"
        >
            <i class="bi bi-chat-dots-fill"></i>
        </button>

        <section v-else class="chatbot-panel" aria-label="Trợ lý ảo rạp phim">
            <header class="chatbot-header">
                <div class="chatbot-title">
                    <span class="chatbot-avatar">
                        <i class="bi bi-stars"></i>
                    </span>
                    <div>
                        <h2>Cinema Bot</h2>
                        <p>Sẵn sàng hỗ trợ đặt vé</p>
                    </div>
                </div>
                <button
                    class="chatbot-icon-btn"
                    type="button"
                    aria-label="Thu gọn"
                    title="Thu gọn"
                    @click="isOpen = false"
                >
                    <i class="bi bi-x-lg"></i>
                </button>
            </header>

            <div ref="messagesEl" class="chatbot-messages">
                <div
                    v-for="message in messages"
                    :key="message.id"
                    class="chatbot-message-row"
                    :class="`is-${message.role}`"
                >
                    <span v-if="message.role === 'bot'" class="chatbot-bubble-avatar">
                        <i class="bi bi-robot"></i>
                    </span>
                    <div class="chatbot-message-stack">
                        <div class="chatbot-message">
                            {{ message.content }}
                        </div>
                        <div v-if="message.showtimeSuggestions?.length" class="chatbot-showtime-cards">
                            <article
                                v-for="showtime in message.showtimeSuggestions"
                                :key="showtime.showtimeId"
                                class="chatbot-showtime-card"
                            >
                                <img
                                    class="chatbot-showtime-poster"
                                    :src="posterSrc(showtime.posterUrl)"
                                    :alt="showtime.movieTitle || 'Poster phim'"
                                    @error="onPosterError"
                                />
                                <div class="chatbot-showtime-body">
                                    <h3>{{ showtime.movieTitle }}</h3>
                                    <p>
                                        <i class="bi bi-clock"></i>
                                        {{ formatShowtime(showtime.startTime) }}
                                    </p>
                                    <p>
                                        <i class="bi bi-door-open"></i>
                                        {{ showtime.roomName || "Phòng chiếu" }}
                                        <span v-if="showtime.roomType">({{ showtime.roomType }})</span>
                                    </p>
                                    <p>
                                        <i class="bi bi-ticket-perforated"></i>
                                        {{ formatPrice(showtime.price) }}
                                    </p>
                                    <button
                                        class="chatbot-seat-btn"
                                        type="button"
                                        :disabled="!showtime.bookingPath"
                                        @click="goToShowtime(showtime)"
                                    >
                                        Chọn ghế
                                    </button>
                                </div>
                            </article>
                        </div>
                    </div>
                    <span v-if="message.role === 'user'" class="chatbot-bubble-avatar is-user-avatar">
                        <i class="bi bi-person-fill"></i>
                    </span>
                </div>

                <div v-if="isSending" class="chatbot-message-row is-bot">
                    <span class="chatbot-bubble-avatar">
                        <i class="bi bi-robot"></i>
                    </span>
                    <div class="chatbot-message is-typing">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>

            <div v-if="errorMessage" class="chatbot-alert" role="alert">
                {{ errorMessage }}
            </div>

            <div class="chatbot-suggestions" v-if="!isSending">
                <button
                    v-for="suggestion in suggestions"
                    :key="suggestion"
                    class="chatbot-chip"
                    type="button"
                    @click="useSuggestion(suggestion)"
                >
                    {{ suggestion }}
                </button>
            </div>

            <form class="chatbot-form" @submit.prevent="sendMessage">
                <textarea
                    v-model="draft"
                    class="chatbot-input"
                    rows="1"
                    placeholder="Nhập câu hỏi..."
                    :disabled="isSending"
                    @keydown.enter.exact.prevent="sendMessage"
                ></textarea>
                <button
                    class="chatbot-send"
                    type="submit"
                    aria-label="Gửi"
                    title="Gửi"
                    :disabled="!canSend"
                >
                    <i class="bi bi-send-fill"></i>
                </button>
            </form>
        </section>
    </div>
</template>

<script setup>
import { computed, nextTick, ref } from "vue";
import { useRouter } from "vue-router";
import api from "@/api";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import fallbackPoster from "@/assets/logo.png";

const router = useRouter();
const isOpen = ref(false);
const isSending = ref(false);
const draft = ref("");
const errorMessage = ref("");
const messagesEl = ref(null);
const conversationId = ref(crypto.randomUUID());
const suggestions = ["Phim đang chiếu", "Lịch chiếu hôm nay", "Combo bắp nước", "Voucher của tôi"];
const messages = ref([
    {
        id: crypto.randomUUID(),
        role: "bot",
        content: "Xin chào! Mình có thể hỗ trợ bạn tìm phim, lịch chiếu, đặt vé và thông tin rạp.",
    },
]);

const canSend = computed(() => draft.value.trim().length > 0 && !isSending.value);

function openChat() {
    isOpen.value = true;
    scrollToBottom();
}

function useSuggestion(suggestion) {
    if (isSending.value) return;
    draft.value = suggestion;
    sendMessage();
}

async function sendMessage() {
    const question = draft.value.trim();
    if (!question || isSending.value) return;

    errorMessage.value = "";
    draft.value = "";
    messages.value.push({
        id: crypto.randomUUID(),
        role: "user",
        content: question,
    });

    isSending.value = true;
    await scrollToBottom();

    try {
        const { data } = await api.post(
            "/v1/bot/chat",
            { question, conversationId: conversationId.value },
            {
                timeout: 90000,
            }
        );

        messages.value.push({
            id: crypto.randomUUID(),
            role: "bot",
            showtimeSuggestions: Array.isArray(data?.showtimeSuggestions) ? data.showtimeSuggestions : [],
            content: data?.answer || "Mình chưa nhận được câu trả lời. Bạn thử hỏi lại nhé.",
        });
    } catch (error) {
        const serverMessage = error.response?.data?.error || error.response?.data?.message;
        errorMessage.value = serverMessage || "Không kết nối được chatbot. Hãy kiểm tra backend và Ollama.";
    } finally {
        isSending.value = false;
        await scrollToBottom();
    }
}

async function scrollToBottom() {
    await nextTick();
    if (messagesEl.value) {
        messagesEl.value.scrollTop = messagesEl.value.scrollHeight;
    }
}

function formatShowtime(value) {
    if (!value) return "Đang cập nhật";
    const date = Array.isArray(value)
        ? new Date(value[0], Number(value[1] || 1) - 1, value[2] || 1, value[3] || 0, value[4] || 0)
        : new Date(value);
    if (Number.isNaN(date.getTime())) return "Đang cập nhật";
    return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);
}

function formatPrice(value) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
}

function goToShowtime(showtime) {
    if (!showtime?.bookingPath) return;
    isOpen.value = false;
    router.push(showtime.bookingPath);
}

function posterSrc(url) {
    return resolveMediaUrl(url, fallbackPoster) || fallbackPoster;
}

function onPosterError(event) {
    event.target.src = fallbackPoster;
}
</script>

<style scoped>
.cinema-chatbot {
    position: fixed;
    right: 1.25rem;
    bottom: 1.25rem;
    z-index: 1080;
    font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
}

.chatbot-fab {
    width: 3.5rem;
    height: 3.5rem;
    border: 0;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    background: var(--brand, #ff6b35);
    box-shadow: 0 12px 28px rgba(255, 107, 53, 0.32);
    transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.chatbot-fab:hover,
.chatbot-fab:focus {
    background: var(--brand-strong, #ff5722);
    transform: translateY(-2px);
    box-shadow: 0 14px 32px rgba(255, 107, 53, 0.42);
}

.chatbot-fab i {
    font-size: 1.55rem;
}

.chatbot-panel {
    width: min(24rem, calc(100vw - 2rem));
    height: min(37rem, calc(100vh - 2rem));
    display: grid;
    grid-template-rows: auto 1fr auto auto auto;
    overflow: hidden;
    border: 1px solid #efe2db;
    border-radius: 8px;
    background: var(--bg-surface, #fff);
    box-shadow: 0 18px 46px rgba(32, 24, 20, 0.2);
}

.chatbot-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.9rem 1rem;
    color: #fff;
    background: #ff8a5c;
    border-bottom: 3px solid #ff6b35;
}

.chatbot-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 0;
}

.chatbot-avatar {
    width: 2.35rem;
    height: 2.35rem;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    color: #ff6b35;
    background: #fff;
    border: 1px solid rgba(255, 255, 255, 0.68);
}

.chatbot-title h2 {
    margin: 0;
    color: #fff;
    font-size: 1rem;
    font-weight: 800;
    line-height: 1.2;
}

.chatbot-title p {
    margin: 0.1rem 0 0;
    color: rgba(255, 255, 255, 0.82);
    font-size: 0.78rem;
}

.chatbot-icon-btn {
    width: 2.25rem;
    height: 2.25rem;
    border: 0;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    color: #fff;
    background: rgba(255, 255, 255, 0.16);
    border: 1px solid rgba(255, 255, 255, 0.38);
}

.chatbot-icon-btn:hover,
.chatbot-icon-btn:focus {
    background: rgba(255, 255, 255, 0.26);
}

.chatbot-messages {
    min-height: 0;
    overflow-y: auto;
    padding: 1rem 0.95rem;
    background: var(--bg-page, #f5f5f5);
}

.chatbot-message-row {
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
}

.chatbot-message-row.is-user {
    justify-content: flex-end;
}

.chatbot-message-row.is-bot {
    justify-content: flex-start;
}

.chatbot-message {
    max-width: min(18rem, 78%);
    padding: 0.68rem 0.82rem;
    border-radius: 8px;
    color: var(--text-primary, #333);
    background: var(--bg-surface, #fff);
    border: 1px solid #efe2db;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    line-height: 1.48;
    font-size: 0.92rem;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
}

.chatbot-message-stack {
    max-width: min(19.5rem, 82%);
    display: grid;
    gap: 0.55rem;
}

.chatbot-message-stack .chatbot-message {
    max-width: 100%;
}

.is-user .chatbot-message-stack {
    justify-items: end;
}

.chatbot-showtime-cards {
    display: grid;
    gap: 0.6rem;
}

.chatbot-showtime-card {
    display: grid;
    grid-template-columns: 4.5rem 1fr;
    gap: 0.65rem;
    padding: 0.65rem;
    border-radius: 8px;
    border: 1px solid #efe2db;
    background: #fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.chatbot-showtime-poster {
    width: 4.5rem;
    height: 6.4rem;
    border-radius: 6px;
    object-fit: cover;
    background: #fff5f2;
    border: 1px solid #f1ddd4;
}

.chatbot-showtime-body {
    min-width: 0;
    display: grid;
    align-content: start;
    gap: 0.22rem;
}

.chatbot-showtime-body h3 {
    margin: 0 0 0.1rem;
    color: #2f2f2f;
    font-size: 0.9rem;
    font-weight: 800;
    line-height: 1.28;
}

.chatbot-showtime-body p {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    color: #666;
    font-size: 0.78rem;
    line-height: 1.35;
}

.chatbot-showtime-body i {
    color: var(--brand, #ff6b35);
}

.chatbot-seat-btn {
    width: fit-content;
    min-height: 2rem;
    margin-top: 0.35rem;
    border: 0;
    border-radius: 8px;
    padding: 0.35rem 0.7rem;
    color: #fff;
    background: var(--brand, #ff6b35);
    font-size: 0.8rem;
    font-weight: 800;
}

.chatbot-seat-btn:hover,
.chatbot-seat-btn:focus {
    background: var(--brand-strong, #ff5722);
}

.chatbot-seat-btn:disabled {
    cursor: not-allowed;
    opacity: 0.55;
}

.chatbot-bubble-avatar {
    width: 1.85rem;
    height: 1.85rem;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    color: var(--brand, #ff6b35);
    background: #fff5f2;
    border: 1px solid #ffd8ca;
    font-size: 0.9rem;
}

.chatbot-bubble-avatar.is-user-avatar {
    color: #fff;
    background: #2f2f2f;
    border-color: #2f2f2f;
}

.is-user .chatbot-message {
    color: #fff;
    border-color: var(--brand, #ff6b35);
    background: var(--brand, #ff6b35);
}

.chatbot-message.is-typing {
    width: 4.35rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.32rem;
    padding-block: 0.82rem;
}

.chatbot-message.is-typing span {
    width: 0.4rem;
    height: 0.4rem;
    border-radius: 50%;
    background: var(--brand, #ff6b35);
    animation: chatbot-pulse 1s infinite ease-in-out;
}

.chatbot-message.is-typing span:nth-child(2) {
    animation-delay: 0.14s;
}

.chatbot-message.is-typing span:nth-child(3) {
    animation-delay: 0.28s;
}

.chatbot-alert {
    margin: 0.75rem 1rem 0;
    padding: 0.65rem 0.75rem;
    border-radius: 8px;
    border: 1px solid #ffc2c8;
    color: #8a2d3b;
    background: #fff1f2;
    font-size: 0.84rem;
}

.chatbot-suggestions {
    display: flex;
    gap: 0.5rem;
    overflow-x: auto;
    padding: 0.7rem 0.85rem 0;
    background: var(--bg-surface, #fff);
    border-top: 1px solid #efe2db;
}

.chatbot-chip {
    min-height: 2rem;
    flex: 0 0 auto;
    border: 1px solid #ffd8ca;
    border-radius: 8px;
    padding: 0.35rem 0.65rem;
    color: #6f4a3e;
    background: #fff8f4;
    font-size: 0.82rem;
    font-weight: 600;
    transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
}

.chatbot-chip:hover,
.chatbot-chip:focus {
    color: #fff;
    background: var(--brand, #ff6b35);
    border-color: var(--brand, #ff6b35);
}

.chatbot-form {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.65rem;
    padding: 0.75rem 0.85rem 0.85rem;
    background: #fff;
}

.chatbot-input {
    width: 100%;
    min-height: 2.6rem;
    max-height: 6.5rem;
    resize: vertical;
    border: 1px solid #ead8cf;
    border-radius: 8px;
    padding: 0.65rem 0.75rem;
    color: #333;
    background: #fff;
    outline: none;
}

.chatbot-input:focus {
    border-color: #ffb79b;
    box-shadow: 0 0 0 0.18rem rgba(255, 107, 53, 0.16);
}

.chatbot-send {
    width: 2.6rem;
    height: 2.6rem;
    border: 0;
    border-radius: 8px;
    align-self: end;
    color: #fff;
    background: var(--brand, #ff6b35);
}

.chatbot-send:hover:not(:disabled),
.chatbot-send:focus:not(:disabled) {
    background: var(--brand-strong, #ff5722);
}

.chatbot-send:disabled {
    cursor: not-allowed;
    opacity: 0.55;
}

@keyframes chatbot-pulse {
    0%,
    80%,
    100% {
        transform: scale(0.72);
        opacity: 0.5;
    }

    40% {
        transform: scale(1);
        opacity: 1;
    }
}

@media (max-width: 575.98px) {
    .cinema-chatbot {
        right: 0.75rem;
        bottom: 0.75rem;
    }

    .chatbot-panel {
        width: calc(100vw - 1.5rem);
        height: min(34rem, calc(100vh - 1.5rem));
    }
}
</style>
