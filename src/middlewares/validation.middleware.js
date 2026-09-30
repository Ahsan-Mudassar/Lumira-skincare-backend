import { ApiError } from "../utils/ApiError.js"

const validate = (schema) => {
    return (err, req, res, next) => {
        console.error(err)
        const result = schema.safeParse(req.body)

        if (!result.success) {
            throw new ApiError(err.status, err.message)
        }
        req.body = result.data;
        next()
    }
}

export { validate }