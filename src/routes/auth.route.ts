import { Router } from "express";
import { authController } from "../controllers/auth.controller";

const authRouter = Router();

authRouter.post("/signup", authController.userSignUp);
authRouter.post("/login", authController.loginUser);
authRouter.post("/verify-otp", authController.verifyLoginOtp);

export default authRouter;
