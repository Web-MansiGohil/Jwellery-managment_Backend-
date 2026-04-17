import { ApiError } from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {
    let message = err.message || "Internal Server Error";
    let statusCode = err.statusCode || 500;

    if (err.name === 'TokenExpiredError') {
        message = 'jwt expired';
        statusCode = 401;
    } else if (err.name === 'JsonWebTokenError') {
        message = 'invalid token';
        statusCode = 401;
    }

    res.status(statusCode).json({
        success: false,
        message: message,
        errors: err.errors || [],
        data: null,
        stack: err.stack
    });
}

export { errorHandler };