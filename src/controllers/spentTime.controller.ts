import { Request, Response } from "express";
import httpStatus from "http-status";
import jwt, { JwtPayload } from "jsonwebtoken";
import { config } from "../config";
import { USER_ROLE } from "../middlewares/auth";
import prisma from "../shared/prisma";
import apiError from "../utils/apiError";
import asyncHandler from "../utils/asyncHandler";

// add spent time
const addTimeSpent = asyncHandler(async (req: Request, res: Response) => {
  const { totalMinutes, serviceId } = req.body;

  const token = req.headers.authorization?.split(" ")[1]; // Get the token from the request headers
  if (!token) {
    throw new apiError(
      httpStatus.UNAUTHORIZED,
      "Authorization token is required"
    );
  } else if (!totalMinutes || !serviceId) {
    throw new apiError(
      httpStatus.BAD_REQUEST,
      "Spent Time, Spent On and Service Request ID are required"
    );
  }
  const decoded = jwt.verify(token, config.jwt_access_secret!) as JwtPayload; // Verify and decode the token
  const user = await prisma.user.findUnique({
    where: {
      email: decoded.email,
    },
  });
  if (!user) {
    throw new apiError(httpStatus.UNAUTHORIZED, "User not found");
  } else if (user?.role !== USER_ROLE.admin) {
    throw new apiError(
      httpStatus.UNAUTHORIZED,
      "You are not authorized to perform this action"
    );
  }
  const spentTimeData = await prisma.trackSpentTime.create({
    data: {
      timeSpent: totalMinutes,
      serviceRequestId: Number(serviceId),
      userId: user.id,
    },
  });
  res.status(httpStatus.CREATED).json({
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Time Spent added successfully",
    data: spentTimeData,
  });
});

// get timeSpent data
const getTimeSpent = asyncHandler(async (req: Request, res: Response) => {
  const { serviceId } = req.params;

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    throw new apiError(
      httpStatus.UNAUTHORIZED,
      "Authorization token is required"
    );
  }
  const decoded = jwt.verify(token, config.jwt_access_secret!) as JwtPayload;
  const user = await prisma.user.findUnique({
    where: {
      email: decoded.email,
    },
  });
  if (!user) {
    throw new apiError(httpStatus.UNAUTHORIZED, "User not found");
  }
  const timeSpent = await prisma.trackSpentTime.findMany({
    where: {
      serviceRequestId: Number(serviceId),
    },
  });

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Time Spent fetched successfully",
    data: timeSpent,
  });
});

export const spentTimeController = {
  addTimeSpent,
  getTimeSpent,
};
