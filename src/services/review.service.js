import { Review } from "../model/review.model.js";
import { Order } from "../model/order.model.js";
import { Product } from "../model/product.model.js";
import { ApiError } from "../utils/ApiError.js";

const SORTS = {
    newest: { createdAt: -1 },
    highest: { rating: -1, createdAt: -1 },
    lowest: { rating: 1, createdAt: -1 }
};

const toDisplayName = (fullName) => {
    const [first, ...rest] = fullName.trim().split(/\s+/);
    const last = rest.at(-1);
    return last ? `${first} ${last[0].toUpperCase()}.` : first;
};

export const recalculateProductRating = async (productId) => {
    const [stats] = await Review.aggregate([
        { $match: { product: productId, isApproved: true } },
        { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } }
    ]);

    await Product.updateOne(
        { _id: productId },
        {
            $set: {
                ratingAverage: stats ? Math.round(stats.average * 10) / 10 : 0,
                ratingCount: stats?.count ?? 0
            }
        }
    );
};

export const createReview = async ({ orderNumber, email, productId, rating, title, comment }) => {
    const order = await Order.findOne({ orderNumber, "customerSnapshot.email": email })
        .select("status customer customerSnapshot.name items.product")
        .lean();

    if (!order) throw new ApiError(404, "Order not found");

    if (order.status !== "delivered") {
        throw new ApiError(409, "You can review a product after your order is delivered");
    }

    if (!order.items.some((item) => item.product.toString() === productId)) {
        throw new ApiError(400, "This product is not part of that order");
    }

    try {
        await Review.create({
            product: productId,
            customer: order.customer,
            order: order._id,
            displayName: toDisplayName(order.customerSnapshot.name),
            rating,
            title,
            comment,
            isVerifiedPurchase: true
        });
    } catch (err) {
        if (err.code === 11000) throw new ApiError(409, "You have already reviewed this product");
        throw err;
    }
};

export const listProductReviews = async ({ slug, sort, page, limit }) => {
    const product = await Product.findOne({ slug, isActive: true }).select("_id").lean();
    if (!product) throw new ApiError("Product not found", 404);

    const filter = { product: product._id, isApproved: true };

    const [reviews, rows] = await Promise.all([
        Review.find(filter)
            .sort(SORTS[sort])
            .skip((page - 1) * limit)
            .limit(limit)
            .select("displayName rating title comment isVerifiedPurchase createdAt")
            .lean(),
        Review.aggregate([{ $match: filter }, { $group: { _id: "$rating", count: { $sum: 1 } } }])
    ]);

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let count = 0;
    let sum = 0;
    for (const row of rows) {
        distribution[row._id] = row.count;
        count += row.count;
        sum += row._id * row.count;
    }

    return {
        reviews,
        total: count,
        summary: { average: count ? Math.round((sum / count) * 10) / 10 : 0, count, distribution }
    };
};

export const listReviewsForAdmin = async ({ status, rating, page, limit }) => {
    const filter = {};
    if (status !== "all") filter.isApproved = status === "approved";
    if (rating) filter.rating = rating;

    const [data, total] = await Promise.all([
        Review.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate("product", "name slug")
            .populate("customer", "name email phone")
            .populate("order", "orderNumber")
            .lean(),
        Review.countDocuments(filter)
    ]);

    return { data, total };
};

export const setReviewApproval = async ({ reviewId, isApproved }) => {
    const review = await Review.findByIdAndUpdate(reviewId, { $set: { isApproved } }, { returnDocument: 'after' });
    if (!review) throw new ApiError(404, "Review not found",);

    await recalculateProductRating(review.product);
    return review;
};

export const deleteReview = async (reviewId) => {
    const review = await Review.findByIdAndDelete(reviewId);
    if (!review) throw new ApiError(404, "Review not found");

    await recalculateProductRating(review.product);
};