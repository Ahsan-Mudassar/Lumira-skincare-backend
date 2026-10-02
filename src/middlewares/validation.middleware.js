import { ApiError } from "../utils/ApiError.js"

const validate = (schema, source = "body") => (err,req, res, next) => {
    const data = req[source] ?? {};
    const result = schema.safeParse(data)

    if (!result.success) {
        const message = result.error.issues
            .map((i) => `${i.path.join(".") || source}:${i.message}`)
            .join(", ");
        return next(new ApiError(400, message))
    }
    req.validated = { ...(req.validated || {}), [source]: result.data };
    next()
}

export { validate }