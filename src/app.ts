import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application } from "express";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import addAdditionalInformationRouter from "./routes/additionalInformation.route";
import authRouter from "./routes/auth.route";
import bookingRouter from "./routes/booking.route";
import serviceRequestRouter from "./routes/serviceRequest.route";
import spentTimeRouter from "./routes/spentTime.route";
import userRouter from "./routes/user.route";
import "./utils/deleteExpiredOTPs";

const app: Application = express();

app.use(
  cors({
    origin: [
      "https://support.solar-ict.com",
      "http://support.solar-ict.com",
      "http://localhost:3000",
      "https://ticketingsystem.labontest.tech",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("🎊 Support Server is running... 🎊");
});

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/service-request", serviceRequestRouter);
app.use("/api/additional-information", addAdditionalInformationRouter);
app.use("/api/booking", bookingRouter);
app.use("/api/spent-time", spentTimeRouter);

app.use(globalErrorHandler);

export default app;
