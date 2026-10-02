import { Category } from "../model/category.model.js"
import { Product } from "../model/product.model.js"
import asyncHandler from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { escapeRegex } from "../utils/escapeRegex.js"


const LIST_FIELDS = [
    "name", "slug", "price", "discountPrice", "images",
    "category", "stock", "isFeatured",
    "ratingAverage", "ratingCount", "createdAt"
].join(" ")

const SORT_MAP = {
    newest: { createdAt: -1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    name: { name: 1 }
}

const toPublicCard = (p) => ({
    _id: p._id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    discountPrice: p.discountPrice,
    finalPrice: p.finalPrice ?? p.price,
    images: Array.isArray(p.images) ? p.images[0] : p.images,
    category: p.category,
    isFeatured: p.isFeatured,
    ratingAverage: p.ratingAverage,
    ratingCount: p.ratingCount,
    inStock: p.stock,
    stockStatus: p.stock === 0 ? "out_of_stock" : p.stock <= 5 ? "low_stock" : "in_stock",
    createdAt: p.createdAt,
});

const toPublicDetail = (p) => {
    const { stock, _v, ...rest } = p;
    return {
        ...rest,
        finalPrice: p.finalPrice ?? p.price,
        inStock: stock > 0,
        stockStatus: p.stock === 0 ? "out_of_stock" : p.stock <= 5 ? "low_stock" : "in_stock",
    }
}

const getAllProducts = asyncHandler(async (req, res) => {
    // console.log(req.validated.query);
    const query = req.validated?.query ?? req.query;
    // ?category=serums&skinType=oil&minPrice=500&sort=price_desc&page=1&limit=6
    const { category, skinType, minPrice, maxPrice, search, sort, page, limit } = query;

    const filter = { isActive: true };

    if (category) {
        const cat = await Category.findOne({ slug: category }).select("_id").lean();

        if (!cat) {
            throw new ApiError(404, `Category ${category} not found`);
        }

        filter.category = cat._id;
    }

    if (skinType) {
        const types = skinType.split(",").map(t => t.trim()).filter(Boolean);
        if (types.length > 0) {
            filter.skinType = { $in: types };
        }
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
        filter.finalPrice = {};
        if (minPrice !== undefined) {
            filter.finalPrice.$gte = minPrice;
        }
        if (maxPrice !== undefined) {
            filter.finalPrice.$lte = maxPrice;
        }
    }

    if (search) {
        filter.name = { $regex: escapeRegex(search), $options: "i" };
    }

    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
        Product.find(filter)
            .select(LIST_FIELDS)
            .sort(SORT_MAP[sort])
            .skip(skip)
            .limit(limit)
            .lean(),
        Product.countDocuments(filter)
    ]);
    const data = products.map(toPublicCard);
    const totalPages = Math.ceil(total / limit) || 0;

    res.status(200).json(
        new ApiResponse(
            200,
            {
                count: data.length,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasnext: page < totalPages
                },
                data
            },
            "Products fetched successfully"))
})

const getFeaturedProducts = asyncHandler(async (req, res) => {
    const { limit } = req.validated?.query ?? req.query;

    const products = await Product.find({ isFeatured: true, isActive: true })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select(LIST_FIELDS)
        .lean();

    const data = products.map(toPublicCard);

    res.status(200).json(
        new ApiResponse(
            200,
            {
                count: products.length,
                data
            },
            "Featured products fetched successfully",
        ))
})

const getProductBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.validated?.params ?? req.params;

    const product = await Product.findOne({ slug, isActive: true })
        .populate("category", "name slug")
        .lean();

    if (!product) {
        throw new ApiError(404, `Product with slug ${slug} not found`);
    }
    res.status(200).json(
        new ApiResponse(
            200,
            {
                product: toPublicDetail(product)
            },
            "Product fetched successfully"
        )
    )
})

const createProduct = asyncHandler(async (req, res) => {
    const data = req.validated?.body ?? req.body;

    const exist = await Category.exists({ _id: data.category });
    if (!exist) {
        throw new ApiError(404, `Category with id ${data.category} not found`);
    }

    const product = await Product.create(data);
    res.status(201).json(
        new ApiResponse(
            201,
            {
                product: toPublicDetail(product)
            },
            "Product created successfully"
        )
    )

})

const updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.validated?.params ??req.params;
    const updates = req.validated?.body ?? req.body;

    const product = await Product.findById(id)
    if (!product) throw new ApiError(404, `Product with id ${id} not found`);

    if (updates.category && updates.category !== product.category.toString()) {
        const exist = await Category.exists({ _id: updates.category });
        if (!exist) {
            throw new ApiError(404, `Category with id ${updates.category} not found`);
        }
    }
    const { discountPrice, ...fields } = updates;
    product.set(fields);
    if (discountPrice !== undefined) {
        product.discountPrice = discountPrice === null ? undefined : discountPrice;
    }

    if (product.discountPrice !== undefined && product.discountPrice >= product.price) {
        throw new ApiError(400, "Discount price must be less than the original price");
    }
    await product.save();
    res.status(200).json(
        new ApiResponse(
            200,
            {
                product: toPublicDetail(product)
            },
            "Product updated successfully"
        )
    )
})

const updateStock = asyncHandler(async (req, res) => {
    const { id } = req.validated?.params ?? req.params;
    const { stock, adjustBy } = req.validated?.body ?? req.body;

    const isDecrease = adjustBy !== undefined && adjustBy < 0;
    const filter = isDecrease ? { _id: id, stock: { $gte: Math.abs(adjustBy) } } : { _id: id };
    const update = stock !== undefined ? { $set: { stock } } : { $inc: { stock: adjustBy } };

    const product = await Product.findOneAndUpdate(filter, update, { returnDocument: 'after' })
        .select("name sku stock isActive")
        .lean();

    if (!product) {
        const exist = await Product.exists({ _id: id });
        if (!exist) {
            throw new ApiError(404, `Product not found`);
        }
        throw new ApiError(409, `Insufficient stock for this adjustment.`);
    }

    res.status(200).json(
        new ApiResponse(
            200,
            {
                product
            },
            "Product stock updated successfully"
        )
    );

})

const deleteProducts = asyncHandler(async (req, res) => {
    const { id } = req.validated?.params ?? req.params;
    const products = await Product.findByIdAndUpdate(
        id,
        { $set: { isActive: false } },
        { returnDocument: 'after' })
        .select("name sku isActive").lean();

    if (!products) {
        throw new ApiError(404, `Product not found`);
    }
    res.status(200).json(
        new ApiResponse(
            200,
            products,
            "Product deleted successfully"
        )
    );
})

export {
    getAllProducts,
    getFeaturedProducts,
    getProductBySlug,
    createProduct,
    updateProduct,
    updateStock,
    deleteProducts
}