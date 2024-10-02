import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application } from "express";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import authRouter from "./routes/auth.route";
import serviceRequestRouter from "./routes/serviceRequest.route";
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

app.use(globalErrorHandler);

export default app;
