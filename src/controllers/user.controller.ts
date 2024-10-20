import { Request, Response } from "express";
import httpStatus from "http-status";
import jwt, { JwtPayload } from "jsonwebtoken";
import { config } from "../config";
import prisma from "../shared/prisma";
import apiError from "../utils/apiError";
import apiResponse from "../utils/apiResponse";
import asyncHandler from "../utils/asyncHandler";
import { uploadOnCloudinary } from "../utils/cloudinary";

// find  user with email
const findUser = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ message: "Email query is required" });
  }

  // Find emails that match the query, assuming a partial match search
  const users = await prisma.user.findMany({
    where: {
      email: {
        contains: email as string,
        mode: "insensitive", // Case-insensitive search
      },
    },
    select: {
      email: true,
    },
    take: 5, // Limit suggestions to 5 results
  });

  const emailSuggestions = users.map((user) => user.email);
  res.json(emailSuggestions);
});

// get user details
const getUserDetails = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const user = await prisma.user.findUnique({
    where: { email: email as string },
    select: {
      name: true,
      companyName: true, // Assuming these fields exist in your user model
      designation: true,
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json(user);
});

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
  const { name, phone, designation } = req.body;

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

  // upload image to cloudinary
  let imageLocalPath: string | undefined;
  if (req.files && "avatar" in req.files && Array.isArray(req.files.avatar)) {
    imageLocalPath = req.files.avatar[0].path;
  }
  // console.log(imageLocalPath);

  let avatar;
  if (imageLocalPath) {
    avatar = await uploadOnCloudinary(imageLocalPath);
  }

  const user = await prisma.user.update({
    where: { email: isUserExist?.email },
    data: {
      name,
      phone,
      designation,
      avatar: avatar ? avatar.secure_url : null,
    },
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
  findUser,
  getUserDetails,
};
