// @ts-nocheck
class ApiError extends Error {
    constructor(statusCode, message = "Some thing went wrong", errors = []) {
        super(message);
        this.statusCode = statusCode;
        this.data = null;
        this.message = message;
        this.success = false;
        this.errors = errors;
    }
}

export {ApiError}