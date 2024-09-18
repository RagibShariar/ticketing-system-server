import httpStatus from "http-status";
import jwt, { JwtPayload } from "jsonwebtoken";
import { config } from "../config";
import apiError from "../utils/apiError";
import asyncHandler from "../utils/asyncHandler";
import prisma from "../shared/prisma";

export const USER_ROLE = {
  user: "user",
  admin: "admin",
} 
const auth = (...user_role: string[]) => {
  return asyncHandler(async (req, res, next) => {
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
    const isUserExist = await prisma.user.findUnique({
      where: {
        email: decoded.email
      }
    })

    if (!isUserExist) {
      throw new apiError(httpStatus.NOT_FOUND, "User not found");
    }

    // check user role
    if (user_role && !user_role.includes(isUserExist.role)) {
      throw new apiError(httpStatus.FORBIDDEN, "Forbidden Access");
    }

    req.user = decoded as JwtPayload;
    next();
  });
};

export default auth;