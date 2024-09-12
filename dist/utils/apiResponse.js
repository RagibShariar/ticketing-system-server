"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apiResponse = (res, statusCode, message, data) => {
    return res.status(statusCode).json({
        success: true,
        statusCode: statusCode || 200,
        message: message,
        data: data,
    });
};
exports.default = apiResponse;
