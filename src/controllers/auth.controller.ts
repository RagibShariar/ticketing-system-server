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
  //? if all ok --> grant access. send access token, refresh token
  const jwtPayload = {
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

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "User logged in successfully",
    token: accessToken,
    rToken: refreshToken,
    data: {
      id: user.id,
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
};
