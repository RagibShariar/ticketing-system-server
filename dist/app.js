"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const auth_route_1 = __importDefault(require("./routes/auth.route"));
const globalErrorHandler_1 = __importDefault(require("./middlewares/globalErrorHandler"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
require("./utils/deleteExpiredOTPs");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: [
        "http://localhost:5173"
    ],
    credentials: true
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.get("/", (req, res) => {
    res.send("Server is running...");
});
app.use("/api/auth", auth_route_1.default);
app.use(globalErrorHandler_1.default);
exports.default = app;
