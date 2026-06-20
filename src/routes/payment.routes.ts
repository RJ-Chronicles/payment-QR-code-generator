import { Router, Request, Response } from "express";
import {
  confirmPayment,
  createPaymentQR,
  getCustomerSummary,
  getPaymentByQRId,
} from "../services/payment.service";
import {
  CreateQRRequestSchema,
  ConfirmPaymentRequestSchema,
  CreateQRResponseSchema,
  GetQRResponseSchema,
  ConfirmPaymentResponseSchema,
  GetCustomerSummaryResponseSchema,
} from "../schemas/payment.schemas";
import {
  validateBody,
  validateParams,
} from "../middleware/validation.middleware";
import { z } from "zod";

export const paymentRouter = Router();

// ── POST /api/payments/qr ─────────────────────────────────────────────────────
/**
 * Generate a new UPI QR code for a payment.
 *
 * Body: { amount: number, description: string, customerId?: string }
 * Returns: QR record with base64 PNG + UPI deep link
 */
paymentRouter.post("/qr", validateBody(CreateQRRequestSchema), async (req: Request, res: Response) => {
  try {
    const body = (req as any).validatedBody;
    const record = await createPaymentQR(body);

    // Validate response shape with Zod
    const validated = CreateQRResponseSchema.parse({
      success: true,
      data: {
        qrId: record.qrId,
        customerId: record.customerId,
        amount: record.amount,
        currency: record.currency,
        description: record.description,
        upiId: record.upiId,
        merchantName: record.merchantName,
        qrCodeBase64: record.qrCodeBase64,
        upiDeepLink: record.upiDeepLink,
        status: record.status,
        createdAt: record.createdAt,
        transactionId: record.transactionId,
        paidAt: record.paidAt,
        metadata: record.metadata,
      },
    });

    res.status(201).json(validated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ success: false, error: message });
  }
});

// ── GET /api/payments/qr/:qrId ────────────────────────────────────────────────
/**
 * Fetch payment details by QR id.
 * Use this after the customer scans to check payment status.
 */
paymentRouter.get(
  "/qr/:qrId",
  validateParams(z.object({ qrId: z.string().min(1, "qrId is required") })),
  async (req: Request, res: Response) => {
    try {
      const record = await getPaymentByQRId(req.params.qrId);

      if (!record) {
        res.status(404).json({ success: false, error: "QR payment not found" });
        return;
      }

      // Validate response shape with Zod
      const validated = GetQRResponseSchema.parse({
        success: true,
        data: record,
      });

      res.json(validated);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Internal server error";
      res.status(500).json({ success: false, error: message });
    }
  }
);

// ── PATCH /api/payments/qr/:qrId/confirm ─────────────────────────────────────
/**
 * Confirm or fail a payment (called by your UPI webhook / manual reconciliation).
 *
 * Body: { transactionId: string, status: "SUCCESS" | "FAILED" }
 */
paymentRouter.patch(
  "/qr/:qrId/confirm",
  validateParams(z.object({ qrId: z.string().min(1, "qrId is required") })),
  validateBody(ConfirmPaymentRequestSchema),
  async (req: Request, res: Response) => {
    try {
      const { transactionId, status } = (req as any).validatedBody;
      const updated = await confirmPayment(
        req.params.qrId,
        transactionId,
        status
      );

      if (!updated) {
        res.status(404).json({ success: false, error: "QR payment not found" });
        return;
      }

      // Validate response shape with Zod
      const validated = ConfirmPaymentResponseSchema.parse({
        success: true,
        data: updated,
      });

      res.json(validated);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Internal server error";
      res.status(500).json({ success: false, error: message });
    }
  }
);

// ── GET /api/payments/customer/:customerId ────────────────────────────────────
/**
 * Get full payment history + discount eligibility for a returning customer.
 */
paymentRouter.get(
  "/customer/:customerId",
  validateParams(
    z.object({ customerId: z.string().min(1, "customerId is required") })
  ),
  async (req: Request, res: Response) => {
    try {
      const summary = await getCustomerSummary(req.params.customerId);

      // Validate response shape with Zod
      const validated = GetCustomerSummaryResponseSchema.parse({
        success: true,
        data: summary,
      });

      res.json(validated);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Internal server error";
      res.status(500).json({ success: false, error: message });
    }
  }
);
