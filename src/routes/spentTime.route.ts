import { Router } from "express";
import { spentTimeController } from "../controllers/spentTime.controller";
import auth, { USER_ROLE } from "../middlewares/auth";

const spentTimeRouter = Router();

spentTimeRouter.post(
  "/",
  auth(USER_ROLE.admin),
  spentTimeController.addTimeSpent
);

spentTimeRouter.get("/:serviceId", spentTimeController.getTimeSpent);

export default spentTimeRouter;
