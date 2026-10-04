import rateLimit from "express-rate-limit"

const rateLimiterMiddleware = rateLimit({
    windowMs: 15 * 60 * 100,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        sucess: false,
        message: "Too many request,Please try again later"
    }
})

const LoginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        sucess: false,
        message: "Too many login attempts, please try again later"
    }
})

const orderLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    skipFailedRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many orders from this network. Please try again later."
    }
});

const trackLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many attempts. Please try again in 15 minutes."
    }
});


export { rateLimiterMiddleware, LoginRateLimiter, orderLimiter, trackLimiter };