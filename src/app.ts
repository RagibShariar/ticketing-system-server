import cors from "cors";
import express, { Application } from "express";
import userRouter from "./routes/user.route";
import authRouter from "./routes/auth.route";
import globalErrorHandler from "./middlewares/globalErrorHandler";

const app: Application = express();

app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
  res.send("Server is running...");
});

app.use("/api/auth", authRouter);


app.use(globalErrorHandler)


export default app;
