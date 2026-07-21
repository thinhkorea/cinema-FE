const CART_KEY = "standaloneSnackCart";
const CART_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function normalizeCartItems(items) {
    if (!Array.isArray(items)) return [];

    return items
        .map((item) => {
            const snackId = Number(item?.snackId);
            const price = Number(item?.price);
            const quantity = Number(item?.quantity);

            if (!Number.isFinite(snackId) || !Number.isFinite(quantity) || quantity <= 0) {
                return null;
            }

            return {
                snackId,
                snackName: item?.snackName || "",
                imageUrl: item?.imageUrl || "",
                price: Number.isFinite(price) ? price : 0,
                quantity: Math.floor(quantity),
            };
        })
        .filter(Boolean);
}

export function clearStandaloneSnackCart() {
    localStorage.removeItem(CART_KEY);
}

export function loadStandaloneSnackCart() {
    try {
        const raw = localStorage.getItem(CART_KEY);
        if (!raw) return [];

        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            clearStandaloneSnackCart();
            return [];
        }

        const savedAt = Number(parsed?.savedAt);
        const isExpired = !Number.isFinite(savedAt) || Date.now() - savedAt > CART_MAX_AGE_MS || savedAt > Date.now() + 60000;

        if (isExpired) {
            clearStandaloneSnackCart();
            return [];
        }

        const items = normalizeCartItems(parsed?.items);
        if (!items.length) {
            clearStandaloneSnackCart();
        }
        return items;
    } catch {
        clearStandaloneSnackCart();
        return [];
    }
}

export function saveStandaloneSnackCart(items) {
    const normalizedItems = normalizeCartItems(items);
    if (!normalizedItems.length) {
        clearStandaloneSnackCart();
        return;
    }

    localStorage.setItem(
        CART_KEY,
        JSON.stringify({
            savedAt: Date.now(),
            items: normalizedItems,
        }),
    );
}
