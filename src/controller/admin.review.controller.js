import asyncHandler from "../utils/asyncHandler.js";
import { listReviewsForAdmin, setReviewApproval, deleteReview } from "../services/review.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const getAdminReviews = asyncHandler(async (req, res) => {
    const query = req.validated?.query ?? req.query;
    const { data, total } = await listReviewsForAdmin(query);

    res.status(200).json(
        new ApiResponse(
            200, {
            count: data.length,
            pagination: {
                page: query.page,
                limit: query.limit,
                total,
                totalPages: Math.ceil(total / query.limit),
                hasNext: query.page * query.limit < total
            },
            data
        },
            "Admin reviews fetch successful"
        )
    );
});

export const updateReviewApproval = asyncHandler(async (req, res) => {
    const { isApproved } = req.validated?.body ?? req.body;
    const id = req.validated?.params?.id ?? req.params.id;
    const review = await setReviewApproval({ reviewId: id, isApproved });

    res.status(200).json(
        new ApiResponse(
            200, {
            id: review._id,
            isApproved: review.isApproved
        },
            isApproved ? "Review approved" : "Review hidden"
        )
    );
});

export const removeReview = asyncHandler(async (req, res) => {
    const id = req.validated?.params?.id ?? req.params.id;
    await deleteReview(id);
    res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Review deleted"
        )
    );
});