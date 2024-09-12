"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const http_status_1 = __importDefault(require("http-status"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const prisma_1 = __importDefault(require("../shared/prisma"));
const apiError_1 = __importDefault(require("../utils/apiError"));
const apiResponse_1 = __importDefault(require("../utils/apiResponse"));
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const sendEmail_1 = require("../utils/sendEmail");
//**  sign up user **//
const userSignUp = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const isUserExist = yield prisma_1.default.user.findFirst({
        where: {
            email: req.body.email,
        },
    });
    if (isUserExist) {
        throw new apiError_1.default(http_status_1.default.BAD_REQUEST, "This email already exists");
    }
    const hashedPassword = yield bcrypt_1.default.hash(req.body.password, 12);
    const userData = {
        email: req.body.email,
        password: hashedPassword,
        role: client_1.UserRole.user,
        name: req.body.name,
        phone: req.body.phone,
        address: req.body.address,
    };
    // console.log(userData);
    const result = yield prisma_1.default.user.create({
        data: userData,
    });
    // send response without password
    const userResponse = Object.assign(Object.assign({}, result), { password: undefined });
    delete userResponse.password;
    (0, apiResponse_1.default)(res, http_status_1.default.CREATED, "Your account has been created successfully. Please log in", userResponse);
}));
//**  Login user **//
const loginUser = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    // check if user exist
    const user = yield prisma_1.default.user.findFirst({
        where: {
            email: email,
        },
    });
    if (!user) {
        throw new apiError_1.default(http_status_1.default.NOT_FOUND, "Email not registered");
    }
    // check if password is correct
    const isPasswordCorrect = yield bcrypt_1.default.compare(password, user.password);
    if (!isPasswordCorrect) {
        throw new apiError_1.default(http_status_1.default.UNAUTHORIZED, "Incorrect password");
    }
    // Generate OTP token and set expiration time (e.g., 10 minutes)
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Set expiration to 10 minutes from now
    // Save or reset OTP for the user in the OTPVerification table
    yield prisma_1.default.oTPVerification.upsert({
        where: {
            userId: user.id, // Check if an OTP already exists for this user
        },
        update: {
            otp,
            expiresAt,
        },
        create: {
            otp,
            expiresAt,
            user: {
                connect: { id: user.id },
            },
        },
    });
    // Send OTP to user's email
    yield (0, sendEmail_1.sendEmail)({
        to: user.email,
        subject: "OTP Verification",
        html: `
        <html lang="en" >
    <head>
      <meta charset="UTF-8">
    </head>
    <body>
    <div style="font-family: Helvetica,Arial,sans-serif;overflow:auto;line-height:2">
      <div style="margin:30px auto;width:90%;padding:20px 0">
        <div style="border-bottom:1px solid #eee">
        </div>
        <p style="font-size:1.1em">Hi,</p>
        <p>Use the following OTP to login. OTP is valid for 5 minutes.</p>
        <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otp}</h2>
        <p style="font-size:0.9em;">Regards,<br />Book My Play</p>
        <hr style="border:none;border-top:1px solid #eee" />
      </div>
    </div>
    </body>
    </html>
        `,
    });
    res.status(200).json({
        success: true,
        statusCode: 200,
        message: `OTP sent successfully to your email. ${otp}`,
    });
}));
//**  Verify Login OTP **//
const verifyLoginOtp = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, otp } = req.body;
    // check if user exist
    const user = yield prisma_1.default.user.findFirst({
        where: {
            email: email,
        },
    });
    if (!user) {
        throw new apiError_1.default(http_status_1.default.NOT_FOUND, "Email not registered");
    }
    // Find OTP verification record for the user
    const otpRecord = yield prisma_1.default.oTPVerification.findUnique({
        where: { userId: user.id },
    });
    if (!otpRecord) {
        throw new apiError_1.default(http_status_1.default.BAD_REQUEST, "OTP not found or already verified");
    }
    // Check if the OTP matches
    if (otpRecord.otp !== otp) {
        throw new apiError_1.default(http_status_1.default.BAD_REQUEST, "Invalid OTP");
    }
    // Check if the OTP is expired
    if (otpRecord.expiresAt < new Date()) {
        throw new apiError_1.default(http_status_1.default.BAD_REQUEST, "OTP has expired");
    }
    // OTP is valid; handle further actions (e.g., mark OTP as verified or delete it)
    yield prisma_1.default.oTPVerification.delete({
        where: { userId: user.id },
    });
    // //? if all ok --> grant access. send access token, refresh token
    const jwtPayload = {
        name: user.name,
        email: user.email,
        role: user.role,
    };
    // create jwt access token
    const accessToken = jsonwebtoken_1.default.sign(jwtPayload, config_1.config.jwt_access_secret, {
        expiresIn: config_1.config.jwt_access_expires_in,
    });
    // create jwt refresh token
    const refreshToken = jsonwebtoken_1.default.sign(jwtPayload, config_1.config.jwt_refresh_secret, { expiresIn: config_1.config.jwt_refresh_expires_in });
    // save refresh token in cookie
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: config_1.config.node_env === "production",
    });
    res.status(http_status_1.default.OK).json({
        success: true,
        statusCode: http_status_1.default.OK,
        message: "User logged in successfully",
        token: accessToken,
        data: {
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            address: user.address,
        },
    });
}));
exports.authController = {
    userSignUp,
    loginUser,
    verifyLoginOtp,
};
