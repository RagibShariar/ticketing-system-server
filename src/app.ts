import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application } from "express";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import authRouter from "./routes/auth.route";
import serviceRequestRouter from "./routes/serviceRequest.route";
import "./utils/deleteExpiredOTPs";

const app: Application = express();

app.use(
  cors({
    origin: [
      "https://authpostgresqlfrontend.labontest.tech",
      "http://localhost:3000",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("🎊 Ticketing Server is running, DB postgreSQL...");
});

app.use("/api/auth", authRouter);
app.use("/api/service-request", serviceRequestRouter);

app.use(globalErrorHandler);

export default app;
