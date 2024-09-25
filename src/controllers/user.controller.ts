import { Request, Response } from "express";
import httpStatus from "http-status";
import prisma from "../shared/prisma";
import apiResponse from "../utils/apiResponse";
import asyncHandler from "../utils/asyncHandler";

// update user profile
const updateUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, phone, designation, avatar } = req.body;

  const user = await prisma.user.update({
    where: { id: id },
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
};
