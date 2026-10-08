const intFromEnv = (name, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) => {
    const raw = process.env[name];
    if (raw === undefined || raw === "") return fallback;

    const value = Number(raw);
    if (!Number.isInteger(value) || value < min || value > max) {
        throw new Error(`Invalid env ${name}: expected a whole number between ${min} and ${max}`);
    }
    return value;
};

export const STORE = Object.freeze({
    name: "Lumira Skincare",
    currency: "PKR",
    shippingFee: intFromEnv("SHIPPING_FEE", 250, { max: 10_000 }),
    freeShippingThreshold: intFromEnv("FREE_SHIPPING_THRESHOLD", 3000, { max: 1_000_000 }),
    lowStockThreshold: intFromEnv("LOW_STOCK_THRESHOLD", 5, { max: 1000 }),
    utcOffset: "+05:00",
    orderPrefix: "LUM",
    orderNumberPad: 4
});

export const calculateShippingFee = (subtotal) =>
    STORE.freeShippingThreshold > 0 && subtotal >= STORE.freeShippingThreshold
        ? 0
        : STORE.shippingFee;