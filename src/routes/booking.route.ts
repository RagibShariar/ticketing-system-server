import { UserRole } from "@prisma/client";
import { Router } from "express";
import { bookingController } from "../controllers/booking.controller";
import auth from "../middlewares/auth";

const bookingRouter = Router();

bookingRouter.post(
  "/",
  auth(UserRole.user, UserRole.admin),
  bookingController.createBooking
);

bookingRouter.get(
  "/",
  auth(UserRole.user, UserRole.admin),
  bookingController.getBookings
);

bookingRouter.post("/available-slots", bookingController.bookingAvailability);

export default bookingRouter;
