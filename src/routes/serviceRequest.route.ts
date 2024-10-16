import { Router } from "express";
import { serviceRequest } from "../controllers/serviceRequest.controller";
import auth, { USER_ROLE } from "../middlewares/auth";
import { upload } from "../middlewares/multer";

const serviceRequestRouter = Router();

serviceRequestRouter.post(
  "/",
  auth(USER_ROLE.user, USER_ROLE.admin),
  upload.fields([{ name: "image", maxCount: 1 }]),
  serviceRequest.createServiceRequest
);

serviceRequestRouter.get(
  "/",
  auth(USER_ROLE.user),
  serviceRequest.viewServiceRequest
);

serviceRequestRouter.get(
  "/all",
  auth(USER_ROLE.admin),
  serviceRequest.viewAllServiceRequest
);

serviceRequestRouter.get(
  "/:id",
  auth(USER_ROLE.user, USER_ROLE.admin),
  serviceRequest.viewServiceRequestById
);

serviceRequestRouter.patch(
  "/:id",
  auth(USER_ROLE.user, USER_ROLE.admin),
  upload.fields([{ name: "image", maxCount: 1 }]),
  serviceRequest.updateServiceRequest
);

serviceRequestRouter.patch(
  "/change-status",
  auth(USER_ROLE.admin),
  serviceRequest.markServiceRequestAsFulfilled
);

export default serviceRequestRouter;
