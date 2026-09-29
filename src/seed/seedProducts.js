import mongoose from "mongoose";
import dotenv from "dotenv";
import Category from "../model/category.model.js";
import Product from "../model/product.model.js";

dotenv.config();

const categories = [
    // categories will be seeded here
];

const seedDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGO_URI}`);
        console.log("Connected to MongoDB for seeding...");

        await Category.deleteMany({});
        await Product.deleteMany({});
        console.log("Cleared existing categories and products...");

        const categoryDocs = await Category.insertMany(categories);
        console.log(`Seeded ${categoryDocs.length} categories`);

        const categoryMap = {};
        categoryDocs.forEach((cat) => {
            categoryMap[cat.name] = cat._id;
        });

        const products = [
            // products will be seeded here, using categoryMap to assign category IDs
        ]

        const productDocs = await Product.insertMany(products);
        console.log(`Seeded ${productDocs.length} products`);

        await mongoose.disconnect();
        console.log("Seeding complete, disconnected.");
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error.message);
        process.exit(1);
    }
};

seedDB();