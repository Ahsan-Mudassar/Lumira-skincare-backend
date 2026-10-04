import { EMAIL } from "./config/email.js";
import app from "./app.js"
import connectDB from "./config/dbConnect.js";


const PORT = process.env.PORT || 8000;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }).catch((error) => {
        console.error("Failed to connect to MongoDB:", error);
        process.exit(1);
    });

if (!EMAIL.enabled) {
    if (process.env.NODE_ENV === "production") {
        console.error("Email is not configured (RESEND_API_KEY, EMAIL_FROM, ORDER_NOTIFY_EMAIL)");
        process.exit(1);
    }
    console.warn("Email disabled: orders will work but no emails will be sent");
}