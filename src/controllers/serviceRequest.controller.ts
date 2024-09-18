import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import httpStatus from "http-status";
import jwt, { JwtPayload } from "jsonwebtoken";
import { config } from "../config";
import apiError from "../utils/apiError";
import apiResponse from "../utils/apiResponse";
import asyncHandler from "../utils/asyncHandler";
import { sendEmail } from "../utils/sendEmail";

const prisma = new PrismaClient();

// Create service request
const createServiceRequest = asyncHandler(
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

    // Extract the service request data from the request body
    const { name, email, subject, requestType, message } = req.body;

    // Find the corresponding request type in the database
    const foundRequestType = await prisma.requestType.findUnique({
      where: {
        type: requestType.toLowerCase(), // Ensure requestType matches the types in the DB
      },
    });

    if (!foundRequestType) {
      throw new apiError(httpStatus.BAD_REQUEST, `Invalid request type`);
    }

    // Create the service request in the database
    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        name,
        email,
        subject,
        message,
        requestTypeId: foundRequestType.id, // Link to RequestType
        userId: user.id, // Link to the user from the token
      },
    });

    // Send OTP to user's email
    await sendEmail({
      to: config.support_email as string,
      subject: subject,
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
       	
        <p>Request Type: ${requestType}</p>
        <p>${message}</p>
        
        <p style="font-size:0.9em;">Regards, <br />
          ${name} <br />
          Email: ${email} <br />
        </p>
 
        <hr style="border:none;border-top:1px solid #eee" />
      </div>
    </div>
    </body>
    </html>
        `,
    });

    // Respond with the created service request
    apiResponse(
      res,
      httpStatus.CREATED,
      "Service request created successfully",
      serviceRequest
    );
  }
);

// View service request for individual user
const viewServiceRequest = asyncHandler(async (req: Request, res: Response) => {
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

  const serviceRequest = await prisma.serviceRequest.findMany({
    where: {
      userId: user.id,
    },
  });
  apiResponse(
    res,
    httpStatus.OK,
    "Service request retrieved successfully",
    serviceRequest
  );
});

// View all services request by admin
const viewAllServiceRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const serviceRequest = await prisma.serviceRequest.findMany();
    apiResponse(
      res,
      httpStatus.OK,
      "Service request retrieved successfully",
      serviceRequest
    );
  }
);

// mark service request as fulfilled by admin
const markServiceRequestAsFulfilled = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const serviceRequest = await prisma.serviceRequest.update({
      where: {
        id: Number(id),
      },
      data: {
        status: req.body.status,
      },
    });
    apiResponse(
      res,
      httpStatus.OK,
      "Service request fulfilled successfully",
      serviceRequest
    );
  }
);

export const serviceRequest = {
  createServiceRequest,
  viewServiceRequest,
  viewAllServiceRequest,
};