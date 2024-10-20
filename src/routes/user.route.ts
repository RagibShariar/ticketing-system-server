import { UserRole } from "@prisma/client";
import { Router } from "express";
import { userController } from "../controllers/user.controller";
import auth from "../middlewares/auth";
import { upload } from "../middlewares/multer";

const userRouter = Router();

userRouter.get("/", userController.getUserInfo);
userRouter.get("/suggestions", userController.findUser);
userRouter.get("/details", userController.getUserDetails);

userRouter.patch(
  "/",
  auth(UserRole.user, UserRole.admin, UserRole.super_admin),
  upload.fields([{ name: "avatar", maxCount: 1 }]),
  userController.updateUserProfile
);

export default userRouter;
