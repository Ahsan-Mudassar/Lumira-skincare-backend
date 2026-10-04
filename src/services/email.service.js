import { EMAIL, getResend } from "../config/email.js";
import { STORE } from "../config/store.js";
import { escapeHtml as esc } from "../utils/escapeHtml.js";

const money = (n) => `Rs ${Number(n).toLocaleString("en-US")}`;

const formatDate = (date) =>
    new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Karachi",
        dateStyle: "medium",
        timeStyle: "short"
    }).format(new Date(date));

export const buildOrderEmail = (order) => {
    const c = order.customerSnapshot;
    const a = order.shippingAddress;
    const subject = `New order ${order.orderNumber} - ${money(order.total)}`;

    const itemRows = order.items
        .map(
            (i) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee">${esc(i.name)}<br>
            <span style="color:#888;font-size:12px">${esc(i.sku)}</span></td>
          <td style="padding:8px;border-bottom:1px solid #eee" align="center">${i.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee" align="right">${money(i.price)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee" align="right">${money(i.lineTotal)}</td>
        </tr>`
        )
        .join("");

    const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#222">
  <h2 style="margin-bottom:4px">${esc(STORE.name)}: New COD Order</h2>
  <p style="margin-top:0;color:#666">${esc(order.orderNumber)} &middot; ${esc(formatDate(order.createdAt))}</p>

  <h3>Customer</h3>
  <p style="line-height:1.6">
    <strong>${esc(c.name)}</strong><br>
    Phone: <a href="tel:${esc(c.phone)}">${esc(c.phone)}</a><br>
    Email: ${esc(c.email)}
  </p>

  <h3>Delivery address</h3>
  <p style="line-height:1.6">
    ${esc(a.address)}<br>${esc(a.city)}
    ${a.notes ? `<br><em>Notes: ${esc(a.notes)}</em>` : ""}
  </p>

  <h3>Items</h3>
  <table width="100%" cellspacing="0" style="border-collapse:collapse;font-size:14px">
    <tr style="background:#f6f6f6">
      <th align="left" style="padding:8px">Product</th><th style="padding:8px">Qty</th>
      <th align="right" style="padding:8px">Price</th><th align="right" style="padding:8px">Total</th>
    </tr>${itemRows}
  </table>

  <p style="text-align:right;line-height:1.8">
    Subtotal: ${money(order.subtotal)}<br>
    Shipping: ${order.shippingFee === 0 ? "Free" : money(order.shippingFee)}<br>
    <strong style="font-size:16px">Total (cash on delivery): ${money(order.total)}</strong>
  </p>

  <p style="background:#fff8e1;padding:12px;border-radius:6px">
    Please call the customer to confirm this order.
  </p>
</div>`;

    const text = [
        `${STORE.name}: New COD order ${order.orderNumber}`,
        formatDate(order.createdAt),
        "",
        `Customer: ${c.name}`,
        `Phone: ${c.phone}`,
        `Email: ${c.email}`,
        `Address: ${a.address}, ${a.city}`,
        a.notes ? `Notes: ${a.notes}` : null,
        "",
        ...order.items.map((i) => `- ${i.name} (${i.sku}) x${i.quantity} = ${money(i.lineTotal)}`),
        "",
        `Subtotal: ${money(order.subtotal)}`,
        `Shipping: ${money(order.shippingFee)}`,
        `Total (COD): ${money(order.total)}`,
        "",
        "Please call the customer to confirm this order."
    ]
        .filter((line) => line !== null)
        .join("\n");

    return { subject, html, text };
};

export const sendOrderNotification = async (order, { idempotencyKey } = {}) => {
    if (!EMAIL.enabled) return { ok: false, error: "Email is not configured" };

    const { subject, html, text } = buildOrderEmail(order);

    try {
        const { data, error } = await getResend().emails.send(
            { from: EMAIL.from, to: [EMAIL.ownerEmail], subject, html, text },
            { idempotencyKey: idempotencyKey ?? `order-${order.orderNumber}` }
        );

        if (error) return { ok: false, error: error.message };
        return { ok: true, id: data.id };
    } catch (err) {
        return { ok: false, error: err.message };
    }
};