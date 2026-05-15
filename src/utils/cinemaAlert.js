import Swal from "sweetalert2";

export const cinemaAlertClasses = {
    popup: "cinema-alert-popup",
    title: "cinema-alert-title",
    htmlContainer: "cinema-alert-text",
    actions: "cinema-alert-actions",
    confirmButton: "cinema-alert-button cinema-alert-confirm",
    cancelButton: "cinema-alert-button cinema-alert-cancel",
    timerProgressBar: "cinema-alert-timer",
};

const escapeHtml = (value = "") => {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
};

const buildAlertHtml = ({ text, note, noteTitle }) => {
    if (!note) return null;
    const main = text ? `<div class="cinema-alert-main">${escapeHtml(text)}</div>` : "";
    const title = noteTitle ? `<div class="cinema-alert-note-title">${escapeHtml(noteTitle)}</div>` : "";
    const noteText = `<div class="cinema-alert-note-text">${escapeHtml(note)}</div>`;
    return `<div class="cinema-alert-body">${main}<div class="cinema-alert-note">${title}${noteText}</div></div>`;
};

export const showCinemaAlert = ({
    icon = "info",
    title = "Thông báo",
    text = "",
    html,
    note,
    noteTitle = "Ghi chú",
    confirmButtonText = "Đã hiểu",
    showCancelButton = false,
    cancelButtonText = "Hủy",
    allowOutsideClick = true,
    allowEscapeKey = true,
    timer,
    showConfirmButton,
    timerProgressBar,
} = {}) => {
    const resolvedHtml = html || buildAlertHtml({ text, note, noteTitle });
    const resolvedText = resolvedHtml ? undefined : text;
    const autoCloseSuccess = icon === "success" && !showCancelButton;
    const resolvedTimer = timer ?? (autoCloseSuccess ? 1600 : undefined);
    const resolvedShowConfirmButton = showConfirmButton ?? (autoCloseSuccess ? false : !resolvedTimer);

    return Swal.fire({
        icon,
        title,
        text: resolvedText,
        html: resolvedHtml,
        confirmButtonText,
        showCancelButton,
        cancelButtonText,
        allowOutsideClick,
        allowEscapeKey,
        timer: resolvedTimer,
        timerProgressBar: timerProgressBar ?? Boolean(resolvedTimer),
        showConfirmButton: resolvedShowConfirmButton,
        customClass: cinemaAlertClasses,
        buttonsStyling: false,
    });
};

export const showCinemaConfirm = async ({
    icon = "warning",
    title = "Xác nhận",
    text = "",
    html,
    confirmButtonText = "Xác nhận",
    cancelButtonText = "Hủy",
} = {}) => {
    const result = await showCinemaAlert({
        icon,
        title,
        text,
        html,
        confirmButtonText,
        cancelButtonText,
        showCancelButton: true,
    });
    return result.isConfirmed;
};

export const showCinemaToast = ({
    icon = "success",
    title = "Thành công",
    text = "",
    timer = 1800,
} = {}) => {
    return Swal.fire({
        icon,
        title,
        text,
        toast: true,
        position: "top-end",
        timer,
        timerProgressBar: true,
        showConfirmButton: false,
        customClass: {
            popup: "cinema-toast-popup",
            title: "cinema-toast-title",
            htmlContainer: "cinema-toast-text",
            timerProgressBar: "cinema-alert-timer",
        },
        buttonsStyling: false,
    });
};

export const getApiErrorMessage = (error, fallback = "Đã xảy ra lỗi. Vui lòng thử lại.") => {
    const data = error?.response?.data;
    if (typeof data === "string") return data;
    return data?.error || data?.message || error?.message || fallback;
};
