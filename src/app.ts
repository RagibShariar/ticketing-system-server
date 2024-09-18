import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application } from "express";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import authRouter from "./routes/auth.route";
import "./utils/deleteExpiredOTPs";
import serviceRequestRouter from "./routes/serviceRequest.route";

const app: Application = express();

app.use(
  cors({
    origin: [
      "https://authpostgresqlfrontend.labontest.tech",
      "http://localhost:5173",
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
app.use("/api/service-request", serviceRequestRouter)

app.use(globalErrorHandler);

export default app;
