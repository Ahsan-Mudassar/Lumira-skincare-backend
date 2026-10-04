export const noStore = (req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
};