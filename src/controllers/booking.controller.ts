import { addMinutes, format, isBefore, setHours, setMinutes } from "date-fns";
import { Request, Response } from "express";
import httpStatus from "http-status";
import jwt, { JwtPayload } from "jsonwebtoken";
import { config } from "../config";
import { USER_ROLE } from "../middlewares/auth";
import prisma from "../shared/prisma";
import apiError from "../utils/apiError";
import apiResponse from "../utils/apiResponse";
import asyncHandler from "../utils/asyncHandler";

interface DecodedToken {
  id: number;
  email: string;
}

// Middleware for token validation
const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

// create a booking by user only
const createBooking = asyncHandler(async (req: Request, res: Response) => {
  // const { serviceRequestId } = req.params;
  const { date, startTime, endTime, serviceRequestId } = req.body;

  const token = req.headers.authorization?.split(" ")[1];

  // 1. Check if token is present
  if (!token) {
    throw new apiError(
      httpStatus.UNAUTHORIZED,
      "Authorization token is required"
    );
  }

  // 2. Verify and decode token

  const decoded = jwt.verify(token, config.jwt_access_secret!) as JwtPayload;

  //  3. check if the email is registered or not
  const user = await prisma.user.findUnique({
    where: {
      email: decoded.email,
    },
  });

  if (!user) {
    throw new apiError(httpStatus.UNAUTHORIZED, "User not found");
  }

  // 4. check if service request exists
  const serviceRequest = await prisma.serviceRequest.findUnique({
    where: {
      id: parseInt(serviceRequestId, 10),
    },
  });

  if (!serviceRequest) {
    throw new apiError(httpStatus.NOT_FOUND, "Service request not found");
  }

  // Parse date fields to Date objects
  const parsedDate = new Date(date);
  const parsedStartTime = new Date(`${date}T${startTime}:00Z`);
  const parsedEndTime = new Date(`${date}T${endTime}:00Z`);

  if (
    isNaN(parsedStartTime.getTime()) ||
    isNaN(parsedEndTime.getTime()) ||
    parsedStartTime >= parsedEndTime
  ) {
    throw new apiError(httpStatus.BAD_REQUEST, "Invalid date or time format");
  }

  // 5. Validate booking availability
  const existingBooking = await prisma.bookingAppointment.findFirst({
    where: {
      serviceRequestId: parseInt(serviceRequestId, 10),
      // Ensure the new booking overlaps with existing bookings
      OR: [
        {
          startTime: {
            lt: parsedEndTime, // New booking starts before the existing booking ends
          },
          endTime: {
            gt: parsedStartTime, // New booking ends after the existing booking starts
          },
        },
      ],
    },
  });

  if (existingBooking) {
    throw new apiError(httpStatus.CONFLICT, "This slot is already booked");
  }

  // 6. Create the booking
  const booking = await prisma.bookingAppointment.create({
    data: {
      startTime: parsedStartTime,
      endTime: parsedEndTime,
      userId: user.id,
      serviceRequestId: parseInt(serviceRequestId, 10),
    },
  });

  apiResponse(res, httpStatus.CREATED, "Booking created successfully", booking);
});

//**  Get bookings for a specific service request
const getBookings = asyncHandler(async (req: Request, res: Response) => {
  const { serviceRequestId } = req.params;
  const token = req.headers.authorization?.split(" ")[1];

  // 1. Check if token is present
  if (!token) {
    throw new apiError(
      httpStatus.UNAUTHORIZED,
      "Authorization token is required"
    );
  }

  // 2. Verify token

  const decoded = jwt.verify(token, config.jwt_access_secret!) as JwtPayload;

  // find user by email
  const user = await prisma.user.findUnique({
    where: {
      email: decoded.email,
    },
  });
  if (!user) {
    throw new apiError(httpStatus.UNAUTHORIZED, "User not found");
  }

  // 3. Get bookings by admin
  if (user.role === USER_ROLE.admin) {
    const bookings = await prisma.bookingAppointment.findMany({
      where: { serviceRequestId: parseInt(serviceRequestId, 10) },
      include: { user: true, serviceRequest: true },
    });
    apiResponse(
      res,
      httpStatus.OK,
      "All Bookings retrieved successfully",
      bookings
    );
    return;
  }

  // 3. Get bookings
  const bookings = await prisma.bookingAppointment.findMany({
    where: { userId: user.id },
    include: { user: true, serviceRequest: true },
  });

  apiResponse(res, httpStatus.OK, "Bookings retrieved successfully", bookings);
});

// ** check available time slots
/**
 * Generate 30-minute time slots between 8:00 and 17:30 for a given date.
 * @param date - The date to generate slots for.
 * @returns An array of available time slots with "startTime" and "endTime" in "HH:mm" format.
 */
const generateTimeSlots = (
  date: Date
): { startTime: string; endTime: string }[] => {
  const startTime = setHours(setMinutes(date, 0), 8); // Start at 8:00 AM
  const endTime = setHours(setMinutes(date, 30), 17); // End at 5:30 PM

  const slots: { startTime: string; endTime: string }[] = [];
  let currentTime = startTime;

  while (
    isBefore(currentTime, endTime) ||
    currentTime.getTime() === endTime.getTime()
  ) {
    const slotStartTime = format(currentTime, "HH:mm");
    const slotEndTime = format(addMinutes(currentTime, 30), "HH:mm");

    slots.push({ startTime: slotStartTime, endTime: slotEndTime });
    currentTime = addMinutes(currentTime, 30); // Increment by 30 minutes
  }

  return slots;
};

/**
 * Check available booking slots for a specific service on a given date.
 * @param serviceRequestId - The ID of the service request.
 * @param date - The date to check availability for.
 * @returns An array of available time slots in "startTime" and "endTime" format.
 */
const bookingAvailability = asyncHandler(
  async (req: Request, res: Response) => {
    const { serviceRequestId, date } = req.body;

    const bookingDate = new Date(date);
    const allSlots = generateTimeSlots(bookingDate);

    // Fetch booked slots for the specified service request and date
    const bookedSlots = await prisma.bookingAppointment.findMany({
      where: {
        serviceRequestId: parseInt(serviceRequestId, 10),
        // Adjust the date check to match just the day
        startTime: {
          gte: new Date(bookingDate.setHours(0, 0, 0, 0)), // Start of the day
          lt: new Date(bookingDate.setHours(23, 59, 59, 999)), // End of the day
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    // console.log("Booked Slots:", bookedSlots); // Debugging line

    // Filter out booked slots from all available slots
    const availableSlots = allSlots.filter((slot) => {
      const slotStartTime = new Date(`${date}T${slot.startTime}:00Z`);
      const slotEndTime = new Date(`${date}T${slot.endTime}:00Z`);

      // Debugging line for the current slot being checked
      // console.log(
      // `Checking Slot: Start: ${slotStartTime}, End: ${slotEndTime}`
      // );

      // Ensure this slot does not overlap with any existing booking
      return !bookedSlots.some((booking) => {
        const bookingStart = new Date(booking.startTime);
        const bookingEnd = new Date(booking.endTime);

        // Debugging lines for booked slots
        // console.log(`Booked Slot: Start: ${bookingStart}, End: ${bookingEnd}`);

        return (
          slotStartTime < bookingEnd && slotEndTime > bookingStart // Overlap check
        );
      });
    });

    // console.log("Available Slots:", availableSlots); // Debugging line

    res.json({
      message: "Available time slots fetched successfully",
      availableSlots,
    });
  }
);

export const bookingController = {
  createBooking,
  getBookings,
  bookingAvailability,
};
