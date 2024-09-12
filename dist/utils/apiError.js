"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class apiError extends Error {
    constructor(statusCode, message = "Something went wrong", errors = [], stack = "") {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.errors = errors;
        if (stack) {
            this.stack = stack;
        }
        else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
exports.default = apiError;
