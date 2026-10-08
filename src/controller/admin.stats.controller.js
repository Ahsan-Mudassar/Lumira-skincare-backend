import asyncHandler from "../utils/asyncHandler.js";
import {
    getOverview,
    getSalesHistory,
    getTopProducts,
    getUnsoldProducts,
    getLowStockProducts
} from "../services/stats.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const send = (res, data) => res.status(200).json(new ApiResponse(200, data, ""));

export const getOverviewStats = asyncHandler(async (req, res) => send(res, await getOverview()));

export const getSalesStats = asyncHandler(async (req, res) =>
    send(res, await getSalesHistory(req.validated?.query ?? req.query)));

export const getTopProductsStats = asyncHandler(async (req, res) =>
    send(res, await getTopProducts(req.validated?.query ?? req.query)));

export const getUnsoldProductsStats = asyncHandler(async (req, res) =>
    send(res, await getUnsoldProducts(req.validated?.query ?? req.query)));

export const getLowStockStats = asyncHandler(async (req, res) =>
    send(res, await getLowStockProducts(req.validated?.query ?? req.query)));