export const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

export const PAYMENT_METHODS = ["COD"];

export const ORDER_STATUS_TRANSITIONS = Object.freeze({
    pending: ["confirmed", "cancelled"],
    confirmed: ["shipped", "cancelled"],
    shipped: ["delivered"],
    delivered: [],
    cancelled: []
});

export const MAX_ORDER_ITEMS = 20;
export const MAX_ITEM_QUANTITY = 10;