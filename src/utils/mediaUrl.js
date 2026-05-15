import api from "@/api";

export const resolveMediaUrl = (url, fallback = "") => {
    if (!url) return fallback;
    if (/^(https?:|blob:|data:)/i.test(url)) return url;
    const apiBaseUrl = api.defaults.baseURL || "";
    const origin = apiBaseUrl.replace(/\/api\/?$/, "");
    return `${origin}${url.startsWith("/") ? url : `/${url}`}`;
};

export const getMediaFileName = (url, fallback = "ảnh") => {
    if (!url) return "";
    const cleanUrl = String(url).split("?")[0].split("#")[0];
    const fileName = cleanUrl.substring(cleanUrl.lastIndexOf("/") + 1);
    return decodeURIComponent(fileName || fallback);
};
