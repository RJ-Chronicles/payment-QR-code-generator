import { z } from "zod";

/* ──────────────────────────────────────────────────────────────────────── */
/* Request Schemas */
/* ──────────────────────────────────────────────────────────────────────── */

/**
 * Validation schema for creating a new UPI QR payment.
 * Ensures amount is positive, description is non-empty, and optional fields are properly typed.
 */
export const CreateQRRequestSchema = z.object({
  amount: z
    .number()
    .positive("Amount must be a positive number")
    .max(999999.99, "Amount exceeds maximum limit"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(255, "Description must not exceed 255 characters"),
  customerId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateQRRequest = z.infer<typeof CreateQRRequestSchema>;

/**
 * Validation schema for confirming a payment.
 * Ensures transactionId exists and status is one of the allowed values.
 */
export const ConfirmPaymentRequestSchema = z.object({
  transactionId: z
    .string()
    .min(1, "Transaction ID is required")
    .max(100, "Transaction ID format invalid"),
  status: z.enum(["SUCCESS", "FAILED"], {
    errorMap: () => ({ message: 'Status must be either "SUCCESS" or "FAILED"' }),
  }),
});

export type ConfirmPaymentRequest = z.infer<typeof ConfirmPaymentRequestSchema>;

/* ──────────────────────────────────────────────────────────────────────── */
/* Response Schemas */
/* ──────────────────────────────────────────────────────────────────────── */

/**
 * Validation schema for a QR payment record in the database.
 * Represents the complete payment state.
 */
export const QRPaymentRecordSchema = z.object({
  qrId: z.string(),
  customerId: z.string().optional(),
  amount: z.number(),
  currency: z.string(),
  description: z.string(),
  upiId: z.string(),
  merchantName: z.string(),
  qrCodeBase64: z.string(),
  upiDeepLink: z.string(),
  status: z.enum(["PENDING", "SUCCESS", "FAILED", "EXPIRED"]),
  createdAt: z.date(),
  paidAt: z.date().optional(),
  transactionId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type QRPaymentRecord = z.infer<typeof QRPaymentRecordSchema>;

/**
 * Validation schema for the standard API success response.
 * Generic response wrapper for successful operations.
 */
export const SuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.unknown(),
});

/**
 * Validation schema for the standard API error response.
 * Generic response wrapper for failed operations.
 */
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
});

/**
 * Validation schema for the QR creation response.
 * Ensures the created QR payment has all required fields.
 */
export const CreateQRResponseSchema = SuccessResponseSchema.extend({
  data: QRPaymentRecordSchema,
});

/**
 * Validation schema for fetching a single QR payment.
 */
export const GetQRResponseSchema = SuccessResponseSchema.extend({
  data: QRPaymentRecordSchema,
});

/**
 * Validation schema for confirming a payment response.
 */
export const ConfirmPaymentResponseSchema = SuccessResponseSchema.extend({
  data: QRPaymentRecordSchema,
});

/**
 * Validation schema for customer summary response.
 */
export const CustomerSummarySchema = z.object({
  customerId: z.string(),
  totalPayments: z.number(),
  totalAmountPaid: z.number(),
  firstPaymentAt: z.date().optional(),
  lastPaymentAt: z.date().optional(),
  isEligibleForDiscount: z.boolean(),
  discountPercent: z.number(),
  payments: z.array(QRPaymentRecordSchema),
});

export type CustomerSummary = z.infer<typeof CustomerSummarySchema>;

export const GetCustomerSummaryResponseSchema = SuccessResponseSchema.extend({
  data: CustomerSummarySchema,
});
