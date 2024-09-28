import { UserRole } from "@prisma/client";
import { Router } from "express";
import { userController } from "../controllers/user.controller";
import auth from "../middlewares/auth";

const userRouter = Router();

userRouter.get("/", userController.getUserInfo);

userRouter.patch(
  "/",
  auth(UserRole.user, UserRole.admin, UserRole.super_admin),
  userController.updateUserProfile
);

export default userRouter;
