import { UserRole } from "@prisma/client";
import { Router } from "express";
import { addAdditionalInformationController } from "../controllers/additionalInformation.controller";
import auth from "../middlewares/auth";

const addAdditionalInformationRouter = Router();

addAdditionalInformationRouter.post(
  "/",
  auth(UserRole.admin, UserRole.user),
  addAdditionalInformationController.addAdditionalInformation
);

addAdditionalInformationRouter.get(
  "/:id",
  auth(UserRole.admin, UserRole.user),
  addAdditionalInformationController.getAdditionalInformation
);

export default addAdditionalInformationRouter;
