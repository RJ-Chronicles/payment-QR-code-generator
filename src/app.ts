import express from "express";
import cors from "cors";
import { paymentRouter } from "./routes/payment.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/payments", paymentRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default app;
