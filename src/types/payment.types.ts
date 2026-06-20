/**
 * Payment types - Re-exported from Zod schemas for validation and type safety.
 * All types are inferred from their corresponding Zod schemas, ensuring
 * runtime validation and compile-time type checking are always in sync.
 */

export {
  CreateQRRequest,
  ConfirmPaymentRequest,
  QRPaymentRecord,
  CustomerSummary,
} from "../schemas/payment.schemas";

// Legacy type aliases for backwards compatibility
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "EXPIRED";
