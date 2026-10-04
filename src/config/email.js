import { Resend } from "resend";

const { RESEND_API_KEY, EMAIL_FROM, ORDER_NOTIFY_EMAIL } = process.env;

export const EMAIL = Object.freeze({
    enabled: Boolean(RESEND_API_KEY && EMAIL_FROM && ORDER_NOTIFY_EMAIL),
    from: EMAIL_FROM,
    ownerEmail: ORDER_NOTIFY_EMAIL
});

export const getResend = () => {
    let client;
    if (!client) client = new Resend(RESEND_API_KEY);
    return client;
};