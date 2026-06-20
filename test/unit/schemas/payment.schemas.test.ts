/**
 * Unit Tests - Zod Validation Schemas
 * Tests request/response schema validation
 */

import { describe, it, expect } from "vitest";
import {
  CreateQRRequestSchema,
  ConfirmPaymentRequestSchema,
  QRPaymentRecordSchema,
  CreateQRResponseSchema,
} from "../../../src/schemas/payment.schemas";

describe("Payment Schemas - Unit Tests", () => {
  describe("CreateQRRequestSchema", () => {
    it("should validate correct create QR request", () => {
      const validRequest = {
        amount: 100.5,
        description: "Test Payment",
        customerId: "cust_123",
      };

      const result = CreateQRRequestSchema.safeParse(validRequest);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(100.5);
        expect(result.data.description).toBe("Test Payment");
      }
    });

    it("should reject negative amount", () => {
      const invalidRequest = {
        amount: -50,
        description: "Invalid Payment",
      };

      const result = CreateQRRequestSchema.safeParse(invalidRequest);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("positive");
      }
    });

    it("should reject amount exceeding maximum limit", () => {
      const invalidRequest = {
        amount: 1000000,
        description: "Excessive Amount",
      };

      const result = CreateQRRequestSchema.safeParse(invalidRequest);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("exceeds maximum");
      }
    });

    it("should reject empty description", () => {
      const invalidRequest = {
        amount: 100,
        description: "",
      };

      const result = CreateQRRequestSchema.safeParse(invalidRequest);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("required");
      }
    });

    it("should reject missing required fields", () => {
      const invalidRequest = {
        amount: 100,
        // description is missing
      };

      const result = CreateQRRequestSchema.safeParse(invalidRequest);

      expect(result.success).toBe(false);
    });

    it("should allow optional customerId and metadata", () => {
      const validRequest = {
        amount: 50,
        description: "Simple Payment",
      };

      const result = CreateQRRequestSchema.safeParse(validRequest);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.customerId).toBeUndefined();
        expect(result.data.metadata).toBeUndefined();
      }
    });
  });

  describe("ConfirmPaymentRequestSchema", () => {
    it("should validate correct confirm payment request", () => {
      const validRequest = {
        transactionId: "UTR123456789",
        status: "SUCCESS",
      };

      const result = ConfirmPaymentRequestSchema.safeParse(validRequest);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("SUCCESS");
      }
    });

    it("should accept FAILED status", () => {
      const validRequest = {
        transactionId: "UTR987654321",
        status: "FAILED",
      };

      const result = ConfirmPaymentRequestSchema.safeParse(validRequest);

      expect(result.success).toBe(true);
    });

    it("should reject invalid status value", () => {
      const invalidRequest = {
        transactionId: "UTR123",
        status: "PENDING", // Invalid - only SUCCESS or FAILED allowed
      };

      const result = ConfirmPaymentRequestSchema.safeParse(invalidRequest);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain(
          'Status must be either "SUCCESS" or "FAILED"'
        );
      }
    });

    it("should reject empty transaction ID", () => {
      const invalidRequest = {
        transactionId: "",
        status: "SUCCESS",
      };

      const result = ConfirmPaymentRequestSchema.safeParse(invalidRequest);

      expect(result.success).toBe(false);
    });

    it("should reject transaction ID exceeding max length", () => {
      const invalidRequest = {
        transactionId: "a".repeat(101), // Exceeds max length of 100
        status: "SUCCESS",
      };

      const result = ConfirmPaymentRequestSchema.safeParse(invalidRequest);

      expect(result.success).toBe(false);
    });
  });

  describe("QRPaymentRecordSchema", () => {
    it("should validate complete QR payment record", () => {
      const validRecord = {
        qrId: "qr_123",
        customerId: "cust_456",
        amount: 500,
        currency: "INR",
        description: "Test Payment",
        upiId: "merchant@upi",
        merchantName: "Test Merchant",
        qrCodeBase64: "data:image/png;base64,ABC123",
        upiDeepLink: "upi://pay?pa=merchant@upi&am=500",
        status: "SUCCESS",
        createdAt: new Date(),
        paidAt: new Date(),
        transactionId: "UTR123",
        metadata: { key: "value" },
      };

      const result = QRPaymentRecordSchema.safeParse(validRecord);

      expect(result.success).toBe(true);
    });

    it("should reject invalid payment status", () => {
      const invalidRecord = {
        qrId: "qr_123",
        amount: 100,
        currency: "INR",
        description: "Test",
        upiId: "merchant@upi",
        merchantName: "Merchant",
        qrCodeBase64: "data:image/png;base64,ABC123",
        upiDeepLink: "upi://pay?pa=merchant@upi",
        status: "COMPLETED", // Invalid status
        createdAt: new Date(),
      };

      const result = QRPaymentRecordSchema.safeParse(invalidRecord);

      expect(result.success).toBe(false);
    });
  });

  describe("CreateQRResponseSchema", () => {
    it("should validate successful QR creation response", () => {
      const validResponse = {
        success: true,
        data: {
          qrId: "qr_123",
          amount: 100,
          currency: "INR",
          description: "Test",
          upiId: "merchant@upi",
          merchantName: "Merchant",
          qrCodeBase64: "data:image/png;base64,ABC",
          upiDeepLink: "upi://pay?pa=merchant@upi",
          status: "PENDING",
          createdAt: new Date(),
        },
      };

      const result = CreateQRResponseSchema.safeParse(validResponse);

      expect(result.success).toBe(true);
    });

    it("should reject response with success: false", () => {
      const invalidResponse = {
        success: false,
        data: { /* some data */ },
      };

      const result = CreateQRResponseSchema.safeParse(invalidResponse);

      expect(result.success).toBe(false);
    });
  });
});
