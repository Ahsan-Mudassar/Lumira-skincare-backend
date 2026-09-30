import "dotenv/config";
import mongoose from "mongoose";
import { User } from "../model/user.model.js";
import { Counter } from "../model/counter.model.js";

const REQUIRED_ENV = ["MONGO_URI", "ADMIN_EMAIL", "ADMIN_PASSWORD"];

const validateEnv = () => {
    const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`Missing environment variables: ${missing.join(", ")}`);
    }
};

const seedAdmin = async () => {
    let exitCode = 0;

    try {
        validateEnv();

        await mongoose.connect(`${process.env.MONGO_URI}`);
        console.log("Connected to MongoDB for seeding...");

        const email = process.env.ADMIN_EMAIL.toLowerCase().trim();

        const existingAdmin = await User.findOne({ email });

        if (existingAdmin) {
            console.log("Admin already exists, skipping creation.");
        } else {
            await User.create({
                name: process.env.ADMIN_NAME || "Admin",
                email,
                password: process.env.ADMIN_PASSWORD
            });
            console.log("Admin created successfully.");
        }

        await Counter.updateOne(
            { _id: "order" },
            { $setOnInsert: { seq: 0 } },
            { upsert: true }
        );
        console.log("Order counter ready.");

        console.log("Seeding complete.");
    } catch (error) {
        console.error("Seeding failed:", error.message);
        exitCode = 1;
    } finally {
        await mongoose.disconnect();
        process.exit(exitCode);
    }
};

// seedAdmin();