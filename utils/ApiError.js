class ApiError extends Error {
    constructor(arg1, arg2, errors = [], stack) {
        let statusCode = 500;
        let message = "Internal Server Error";
        
        if (typeof arg1 === 'number') {
            statusCode = arg1;
            message = arg2 || message;
        } else {
            message = arg1;
            statusCode = 400; // default for manually thrown errors without status code
            if (arg2 && Array.isArray(arg2)) {
                errors = arg2;
            }
        }

        super(message);
        this.statusCode = statusCode;
        this.data = null;
        this.message = message;
        this.success = false;
        this.errors = errors;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { ApiError };