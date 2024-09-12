import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application } from "express";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import authRouter from "./routes/auth.route";
import "./utils/deleteExpiredOTPs";

const app: Application = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://authpostgresqlfrontend.labontest.tech",
    ],
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Server is running...");
});

app.use("/api/auth", authRouter);

app.use(globalErrorHandler);

export default app;
