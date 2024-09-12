"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const zod_1 = require("zod");
const apiError_1 = __importDefault(require("../utils/apiError"));
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const globalErrorHandler = (err, req, res, next) => {
    var _a;
    let statusCode = 500;
    let message = "Something went wrong!";
    let errorSource = [
        {
            path: "",
            message: "",
        },
    ];
    if (err instanceof zod_1.ZodError) {
        statusCode = http_status_1.default.BAD_REQUEST;
        message = "Zod validation error";
        errorSource = (_a = err === null || err === void 0 ? void 0 : err.issues) === null || _a === void 0 ? void 0 : _a.map((issue) => {
            return {
                path: issue === null || issue === void 0 ? void 0 : issue.path[issue.path.length - 1],
                message: issue.message,
            };
        });
        // } else if (err?.name === "ValidationError") {
        //   statusCode = httpStatus.BAD_REQUEST;
        //   message = "Mongoose Validation error";
        //   errorSource = Object.values(err?.errors).map((val) => {
        //     const error = val as
        //       | mongoose.Error.ValidatorError
        //       | mongoose.Error.CastError;
        //     return {
        //       path: error?.path,
        //       message: error?.message,
        //     };
        //   });
        // } else if (err?.name === "CastError") {
        //   const error = err as mongoose.Error.CastError;
        //   statusCode = httpStatus.BAD_REQUEST;
        //   message = " Invalid id, Cast Error";
        //   errorSource = [
        //     {
        //       path: error?.path,
        //       message: error?.message,
        //     },
        //   ];
    }
    else if ((err === null || err === void 0 ? void 0 : err.code) === 11000) {
        statusCode = http_status_1.default.CONFLICT;
        message = "Duplicate entry error";
        const match = err.message.match(/"([^"]*)"/);
        const extractedMessage = match && match[1];
        errorSource = [
            {
                path: "",
                message: `${extractedMessage} is already exists`,
            },
        ];
    }
    else if (err instanceof apiError_1.default) {
        statusCode = err === null || err === void 0 ? void 0 : err.statusCode;
        message = err === null || err === void 0 ? void 0 : err.message;
        errorSource = [
            {
                path: "",
                message: err === null || err === void 0 ? void 0 : err.message,
            },
        ];
    }
    else if (err instanceof Error) {
        message = err === null || err === void 0 ? void 0 : err.message;
        errorSource = [
            {
                path: "",
                message: err === null || err === void 0 ? void 0 : err.message,
            },
        ];
    }
    //?ultimate return
    return res.status(statusCode).json({
        success: false,
        message,
        errorSource,
        // myError: err,
        errorStack: process.env.NODE_ENV === "development" ? err === null || err === void 0 ? void 0 : err.stack : "",
    });
};
exports.default = globalErrorHandler;
