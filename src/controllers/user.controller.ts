import { Request, Response } from "express";
import httpStatus from "http-status";
import jwt, { JwtPayload } from "jsonwebtoken";
import { config } from "../config";
import prisma from "../shared/prisma";
import apiError from "../utils/apiError";
import apiResponse from "../utils/apiResponse";
import asyncHandler from "../utils/asyncHandler";

// get user info
const getUserInfo = asyncHandler(async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    throw new apiError(httpStatus.UNAUTHORIZED, "Unauthorize Access");
  }

  // verify token
  const decoded = jwt.verify(
    token,
    config.jwt_access_secret as string
  ) as JwtPayload;

  // check if user exist
  const isUserExist = await prisma.user.findFirst({
    where: {
      email: decoded.email,
    },
  });

  if (!isUserExist) {
    throw new apiError(httpStatus.NOT_FOUND, "User not found");
  }

  apiResponse(res, httpStatus.OK, "User info fetched successfully", {
    name: isUserExist?.name,
    email: isUserExist?.email,
    role: isUserExist?.role,
    phone: isUserExist?.phone,
    companyName: isUserExist?.companyName,
    designation: isUserExist?.designation,
    avatar: isUserExist?.avatar,
  });
});

// update user profile
const updateUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const { name, phone, designation, avatar } = req.body;

  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    throw new apiError(httpStatus.UNAUTHORIZED, "Unauthorize Access");
  }

  // verify token
  const decoded = jwt.verify(
    token,
    config.jwt_access_secret as string
  ) as JwtPayload;

  // check if user exist
  const isUserExist = await prisma.user.findFirst({
    where: {
      email: decoded.email,
    },
  });

  if (!isUserExist) {
    throw new apiError(httpStatus.NOT_FOUND, "User not found");
  }

  const user = await prisma.user.update({
    where: { email: isUserExist?.email },
    data: { name, phone, designation, avatar },
  });

  apiResponse(res, httpStatus.OK, "User updated successfully", {
    name: user?.name,
    phone: user?.phone,
    companyName: user?.companyName,
    designation: user?.designation,
    avatar: user?.avatar,
  });
});

export const userController = {
  updateUserProfile,
  getUserInfo,
};
