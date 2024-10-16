import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import httpStatus from "http-status";
import jwt, { JwtPayload } from "jsonwebtoken";
import { config } from "../config";
import { USER_ROLE } from "../middlewares/auth";
import apiError from "../utils/apiError";
import apiResponse from "../utils/apiResponse";
import asyncHandler from "../utils/asyncHandler";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { sendEmail } from "../utils/sendEmail";

const prisma = new PrismaClient();

// Create service request
const createServiceRequest = asyncHandler(
  async (req: Request, res: Response) => {
    // Extract the service request data from the request body
    const { name, email, subject, requestType, message } = req.body;

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
      throw new apiError(httpStatus.UNAUTHORIZED, `Unauthorized Access`);
    }

    // check req.email is valid
    const isUserExist = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });

    if (!isUserExist) {
      throw new apiError(httpStatus.NOT_FOUND, `'${email}' not registered`);
    }

    // Check if the admin is creating a request on behalf of a user
    const userId = user.role === "admin" ? isUserExist.id : user.id;

    // Find the corresponding request type in the database
    const foundRequestType = await prisma.requestType.findFirst({
      where: {
        type: requestType, // Ensure requestType matches the types in the DB
      },
    });

    if (!foundRequestType) {
      throw new apiError(httpStatus.BAD_REQUEST, `Invalid request type`);
    }
    // upload image to cloudinary
    let imageLocalPath: string | undefined;
    if (req.files && "image" in req.files && Array.isArray(req.files.image)) {
      imageLocalPath = req.files.image[0].path;
    }
    // console.log(imageLocalPath);

    let image;
    if (imageLocalPath) {
      image = await uploadOnCloudinary(imageLocalPath);
    }

    // Create the service request in the database
    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        name,
        email,
        subject,
        message,
        images: image ? [image.secure_url] : [],
        requestTypeId: foundRequestType.id, // Link to RequestType
        userId, // Link to the user from the token
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
        
        <p >Regards, <br />
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
    include: {
      requestType: true, // Populate the related RequestType
      user: true, // Populate the related User
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  apiResponse(
    res,
    httpStatus.OK,
    "Service request retrieved successfully",
    serviceRequest
  );
});

// View service request for individual user
const viewServiceRequestById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const token = req.headers.authorization?.split(" ")[1] as string;
    if (!token) {
      throw new apiError(httpStatus.UNAUTHORIZED, `Unauthorized Access :(`);
    }

    const serviceRequest = await prisma.serviceRequest.findFirst({
      where: {
        id: Number(id),
      },
      include: {
        requestType: true, // Populate the related RequestType
        user: true, // Populate the related User
        additionalInformations: true, // Populate the related AdditionalInformation
      },
    });
    apiResponse(
      res,
      httpStatus.OK,
      "Service request retrieved successfully",
      serviceRequest
    );
  }
);

// View all services request by admin
const viewAllServiceRequest = asyncHandler(
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

    if (!user || user.role !== USER_ROLE.admin) {
      throw new apiError(httpStatus.FORBIDDEN, `Access denied`);
    }

    const { email, id, days } = req.query;

    // Create a filtering object based on the query params
    const filters: any = {};

    if (email) {
      filters.email = email as string;
    }

    // if (id) {
    //   filters.id = parseInt(id as string, 10);
    // }
    if (id) {
      const parsedId = parseInt(id as string, 10);
      if (!isNaN(parsedId)) {
        filters.id = parsedId;
      } else {
        throw new apiError(httpStatus.BAD_REQUEST, `Invalid ID format`);
      }
    }

    // If 'days' is provided, filter records based on the number of days ago
    // if (days) {
    //   const daysAgo = new Date();
    //   daysAgo.setDate(daysAgo.getDate() - parseInt(days as string, 10));

    //   filters.createdAt = {
    //     gte: daysAgo, // greater than or equal to 'days' ago
    //   };
    // }
    if (days) {
      const parsedDays = parseInt(days as string, 10);
      if (!isNaN(parsedDays) && parsedDays >= 0) {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parsedDays);

        filters.createdAt = {
          gte: daysAgo, // greater than or equal to 'days' ago
        };
      } else {
        throw new apiError(httpStatus.BAD_REQUEST, `Invalid days parameter`);
      }
    }

    const serviceRequest = await prisma.serviceRequest.findMany({
      where: filters,
      include: {
        requestType: true, // Populate the related RequestType
        user: true, // Populate the related User
        additionalInformations: true, // Populate the related AdditionalInformation
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    apiResponse(
      res,
      httpStatus.OK,
      "Service request retrieved successfully",
      serviceRequest
    );
  }
);

// edit service request by user
const updateServiceRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { images: newImages } = req.body; // Extract new images from the request body

  // console.log(req.body);
  // console.log(req.params);

  const token = req.headers.authorization?.split(" ")[1] as string;

  if (!token) {
    throw new apiError(httpStatus.UNAUTHORIZED, `Unauthorized Access`);
  }

  // Find the existing service request by ID
  const existingServiceRequest = await prisma.serviceRequest.findFirst({
    where: { id: Number(id) }, // Assuming `id` is of type `Int`
  });

  // If the service request doesn't exist, return an error
  if (!existingServiceRequest) {
    return res.status(404).json({ message: "Service request not found" });
  }

  // Merge new images with existing images
  const updatedImages = [
    ...existingServiceRequest.images,
    ...(newImages || []), // Append new images if any
  ];

  // Update the service request with the updated images array
  const updatedServiceRequest = await prisma.serviceRequest.update({
    where: { id: Number(id) },
    data: {
      images: updatedImages, // Set the merged images array
    },
  });

  apiResponse(
    res,
    httpStatus.OK,
    "New Image added successfully",
    updatedServiceRequest
  );
});

// mark service request as fulfilled by admin
const markServiceRequestAsFulfilled = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.body;

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

    if (!user || user.role !== USER_ROLE.admin) {
      throw new apiError(httpStatus.UNAUTHORIZED, `Unauthorized Access`);
    }

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
  markServiceRequestAsFulfilled,
  viewServiceRequestById,
  updateServiceRequest,
};
