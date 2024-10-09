import { Request, Response } from "express";
import httpStatus from "http-status";
import jwt, { JwtPayload } from "jsonwebtoken";
import { config } from "../config";
import prisma from "../shared/prisma";
import apiError from "../utils/apiError";
import apiResponse from "../utils/apiResponse";
import asyncHandler from "../utils/asyncHandler";

//  add additional message
const addAdditionalInformation = asyncHandler(
  async (req: Request, res: Response) => {
    const token = req.headers.authorization?.split(" ")[1] as string;
    if (!token) {
      throw new apiError(httpStatus.UNAUTHORIZED, `Unauthorized Access`);
    }

    // Verify token and get user information
    const decoded = jwt.verify(
      token,
      config.jwt_access_secret as string
    ) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: {
        email: decoded.email,
      },
    });
    if (!user) {
      throw new apiError(httpStatus.UNAUTHORIZED, `Invalid token`);
    }

    const { serviceRequestId, message } = req.body;

    if (!serviceRequestId || !message) {
      throw new apiError(
        httpStatus.BAD_REQUEST,
        "Service Request ID and message are required."
      );
    }

    // // Check if the service request exists
    // const serviceRequest = await prisma.serviceRequest.findFirst({
    //   where: {
    //     id: serviceRequestId,
    //   },
    // });

    // if (!serviceRequest) {
    //   throw new apiError(httpStatus.NOT_FOUND, "Service Request not found.");
    // }

    // Create the additional information record
    const additionalInformation = await prisma.additionalInformation.create({
      data: {
        message: message,
        userId: user.id, // From the decoded token
        serviceRequestId: Number(serviceRequestId),
      },
    });

    // Respond with the created additional information
    apiResponse(
      res,
      httpStatus.OK,
      "Additional Information added successfully",
      additionalInformation
    );
  }
);

// get additional message by service request id
const getAdditionalInformation = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const token = req.headers.authorization?.split(" ")[1] as string;
    if (!token) {
      throw new apiError(httpStatus.UNAUTHORIZED, `Unauthorized Access`);
    }

    // Verify token and get user information
    const decoded = jwt.verify(
      token,
      config.jwt_access_secret as string
    ) as JwtPayload;

    if (!id) {
      throw new apiError(
        httpStatus.BAD_REQUEST,
        "Service Request ID is required."
      );
    }

    // // Check if the service request exists
    // const serviceRequest = await prisma.serviceRequest.findFirst({
    //   where: {
    //     id: Number(serviceRequestId),
    //   },
    // });

    // if (!serviceRequest) {
    //   throw new apiError(httpStatus.NOT_FOUND, "Service Request not found.");
    // }

    // Get the additional information records
    const additionalInformation = await prisma.additionalInformation.findMany({
      where: {
        serviceRequestId: Number(id),
      },
      include: {
        user: true,
        serviceRequest: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Respond with the additional information
    apiResponse(
      res,
      httpStatus.OK,
      "Additional Information retrieved successfully",
      additionalInformation
    );
  }
);

export const addAdditionalInformationController = {
  addAdditionalInformation,
  getAdditionalInformation,
};
