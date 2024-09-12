import { UserRole } from "@prisma/client";
import bcrypt from "bcrypt";
import { Request, Response } from "express";
import httpStatus from "http-status";
import jwt from "jsonwebtoken";
import { config } from "../config";
import prisma from "../shared/prisma";
import apiError from "../utils/apiError";
import apiResponse from "../utils/apiResponse";
import asyncHandler from "../utils/asyncHandler";
import { sendEmail } from "../utils/sendEmail";

//**  sign up user **//
const userSignUp = asyncHandler(async (req: Request, res: Response) => {
  const isUserExist = await prisma.user.findFirst({
    where: {
      email: req.body.email,
    },
  });
  if (isUserExist) {
    throw new apiError(httpStatus.BAD_REQUEST, "This email already exists");
  }

  const hashedPassword: string = await bcrypt.hash(req.body.password, 12);

  const userData = {
    email: req.body.email,
    password: hashedPassword,
    role: UserRole.user,
    name: req.body.name,
    phone: req.body.phone,
    address: req.body.address,
  };
  // console.log(userData);
  const result = await prisma.user.create({
    data: userData,
  });

  // send response without password
  const userResponse = {
    ...result,
    password: undefined,
  };
  delete userResponse.password;

  apiResponse(
    res,
    httpStatus.CREATED,
    "Your account has been created successfully. Please log in",
    userResponse
  );
});

//**  Login user **//
const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  // check if user exist
  const user = await prisma.user.findFirst({
    where: {
      email: email,
    },
  });
  if (!user) {
    throw new apiError(httpStatus.NOT_FOUND, "Email not registered");
  }

  // check if password is correct
  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    throw new apiError(httpStatus.UNAUTHORIZED, "Incorrect password");
  }

  // Generate OTP token and set expiration time (e.g., 10 minutes)
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Set expiration to 10 minutes from now

  // Save or reset OTP for the user in the OTPVerification table
  await prisma.oTPVerification.upsert({
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
  await sendEmail({
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
});

//**  Verify Login OTP **//
const verifyLoginOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  // check if user exist
  const user = await prisma.user.findFirst({
    where: {
      email: email,
    },
  });
  if (!user) {
    throw new apiError(httpStatus.NOT_FOUND, "Email not registered");
  }

  // Find OTP verification record for the user
  const otpRecord = await prisma.oTPVerification.findUnique({
    where: { userId: user.id },
  });

  if (!otpRecord) {
    throw new apiError(
      httpStatus.BAD_REQUEST,
      "OTP not found or already verified"
    );
  }

  // Check if the OTP matches
  if (otpRecord.otp !== otp) {
    throw new apiError(httpStatus.BAD_REQUEST, "Invalid OTP");
  }

  // Check if the OTP is expired
  if (otpRecord.expiresAt < new Date()) {
    throw new apiError(httpStatus.BAD_REQUEST, "OTP has expired");
  }

  // OTP is valid; handle further actions (e.g., mark OTP as verified or delete it)
  await prisma.oTPVerification.delete({
    where: { userId: user.id },
  });

  // //? if all ok --> grant access. send access token, refresh token
  const jwtPayload = {
    name: user.name,
    email: user.email,
    role: user.role,
  };

  // create jwt access token
  const accessToken = jwt.sign(jwtPayload, config.jwt_access_secret as string, {
    expiresIn: config.jwt_access_expires_in as string,
  });

  // create jwt refresh token
  const refreshToken = jwt.sign(
    jwtPayload,
    config.jwt_refresh_secret as string,
    { expiresIn: config.jwt_refresh_expires_in as string }
  );

  // save refresh token in cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: config.node_env === "production",
  });

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
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
});

export const authController = {
  userSignUp,
  loginUser,
  verifyLoginOtp,
};
