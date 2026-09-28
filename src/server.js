import app from "./app.js"
import connectDB from "./config/dbConnect.js";


const PORT = process.env.PORT || 8000;

// Connect to MongoDB
connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }).catch((error) => {
        console.error("Failed to connect to MongoDB:", error);
        process.exit(1);
    });

 