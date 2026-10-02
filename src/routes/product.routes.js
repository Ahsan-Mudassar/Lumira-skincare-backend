import { Router } from "express";
import { protect, adminOnly } from "../middlewares/auth.middleware.js";
import {
    getAllProducts,
    getFeaturedProducts,
    getProductBySlug,
    createProduct,
    updateProduct,
    updateStock,
    deleteProducts
} from "../controller/product.controller.js";
import { validate } from "../middlewares/validation.middleware.js";
import {
    listProductsQuerySchema,
    featuredQuerySchema,
    slugParamSchema,
    idParamSchema,
    createProductSchema,
    updateProductSchema,
    updateStockSchema
} from "../validation/product.validation.js";

const router = Router();

router.get("/", validate(listProductsQuerySchema, "query"), getAllProducts);

router.get("/featured", validate(featuredQuerySchema, "query"), getFeaturedProducts);

router.get("/:slug", validate(slugParamSchema, "params"), getProductBySlug);

router.use(protect, adminOnly);

router.post("/", validate(createProductSchema), createProduct);

router.patch(
    "/:id/stock",
    validate(idParamSchema, "params"),
    validate(updateStockSchema),
    updateStock
);

router.patch(
    "/:id",
    validate(idParamSchema, "params"),
    validate(updateProductSchema),
    updateProduct
);

router.delete("/:id", validate(idParamSchema, "params"), deleteProducts);

export default router;