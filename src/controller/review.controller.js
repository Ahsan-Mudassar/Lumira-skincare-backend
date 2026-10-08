import asyncHandler from "../utils/asyncHandler.js";
import { createReview, listProductReviews } from "../services/review.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const submitReview = asyncHandler(async (req, res) => {
    await createReview(req.validated?.body ?? req.body);

    res.status(201).json(
        new ApiResponse(
            200,
            {},
            "Thank you! Your review will appear after it is approved."
        )
    );
});

export const getProductReviews = asyncHandler(async (req, res) => {
    const { slug } = req.validated?.params ?? req.params;
    const { sort, page, limit } = req.validated?.query ?? req.query;

    const { reviews, total, summary } = await listProductReviews({ slug, sort, page, limit });

    res.status(200).json(
        new ApiResponse(200, {
            summary,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total },
            data: reviews
        },
            "Products reviews fetch successful"
        )
    );
});