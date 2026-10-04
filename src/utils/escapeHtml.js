const ENTITIES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export const escapeHtml = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (ch) => ENTITIES[ch]);