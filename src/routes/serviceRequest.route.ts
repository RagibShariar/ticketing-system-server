import { Router } from "express";
import { serviceRequest } from "../controllers/serviceRequest.controller";
import auth, { USER_ROLE } from "../middlewares/auth";

const serviceRequestRouter = Router();

serviceRequestRouter.post(
  "/",
  auth(USER_ROLE.user),
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

export default serviceRequestRouter;
