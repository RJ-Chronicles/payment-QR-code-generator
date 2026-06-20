/**
 * Unit Tests - Payment Service
 * Tests business logic for QR payment generation and confirmation
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
// import * as paymentService from "../../src/services/payment.service";

import * as paymentService from "../../../src/services/payment.service";

describe("Payment Service - Unit Tests", () => {
  // Mock the payment store
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createPaymentQR", () => {
    it("should successfully create a QR payment with valid input", async () => {
      const input = {
        amount: 100,
        description: "Test Payment",
        customerId: "cust_123",
      };

      const result = await paymentService.createPaymentQR(input);

      expect(result).toBeDefined();
      expect(result.amount).toBe(100);
      expect(result.description).toBe("Test Payment");
      expect(result.customerId).toBe("cust_123");
      expect(result.status).toBe("PENDING");
      expect(result.qrId).toBeDefined();
      expect(result.qrCodeBase64).toBeDefined();
      expect(result.upiDeepLink).toBeDefined();
    });

    it("should generate valid QR code base64 string", async () => {
      const input = {
        amount: 500.5,
        description: "Premium Payment",
      };

      const result = await paymentService.createPaymentQR(input);

      // QR code should be a valid base64 string
      expect(result.qrCodeBase64).toMatch(/^data:image\/png;base64,/);
      expect(result.qrCodeBase64.length).toBeGreaterThan(100);
    });

    it("should create UPI deep link with correct format", async () => {
      const input = {
        amount: 250,
        description: "Invoice Payment",
      };

      const result = await paymentService.createPaymentQR(input);

      // UPI deep link should follow NPCI format
      expect(result.upiDeepLink).toMatch(/^upi:\/\/pay\?/);
      expect(result.upiDeepLink).toContain("pa=");
      expect(result.upiDeepLink).toContain("am=");
      expect(result.upiDeepLink).toContain("tn=");
    });
  });

  describe("getPaymentByQRId", () => {
    it("should retrieve a payment record by QR ID", async () => {
      // First create a payment
      const created = await paymentService.createPaymentQR({
        amount: 100,
        description: "Test",
      });

      // Then fetch it
      const retrieved = await paymentService.getPaymentByQRId(created.qrId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.qrId).toBe(created.qrId);
      expect(retrieved?.amount).toBe(created.amount);
    });

    it("should return undefined for non-existent QR ID", async () => {
      const result = await paymentService.getPaymentByQRId("invalid_qr_id");
      expect(result).toBeUndefined();
    });
  });

  describe("confirmPayment", () => {
    it("should successfully confirm a pending payment", async () => {
      // Create a payment first
      const created = await paymentService.createPaymentQR({
        amount: 150,
        description: "Pending Payment",
      });

      // Confirm the payment
      const confirmed = await paymentService.confirmPayment(
        created.qrId,
        "UTR123456789",
        "SUCCESS"
      );

      expect(confirmed).toBeDefined();
      expect(confirmed?.status).toBe("SUCCESS");
      expect(confirmed?.transactionId).toBe("UTR123456789");
      expect(confirmed?.paidAt).toBeDefined();
    });

    it("should mark payment as FAILED when status is FAILED", async () => {
      const created = await paymentService.createPaymentQR({
        amount: 75,
        description: "Failed Payment",
      });

      const confirmed = await paymentService.confirmPayment(
        created.qrId,
        "UTR987654321",
        "FAILED"
      );

      expect(confirmed?.status).toBe("FAILED");
      expect(confirmed?.transactionId).toBe("UTR987654321");
    });

    it("should return undefined for non-existent QR during confirmation", async () => {
      const result = await paymentService.confirmPayment(
        "non_existent_qr",
        "UTR123",
        "SUCCESS"
      );

      expect(result).toBeUndefined();
    });
  });

  describe("getCustomerSummary", () => {
    it("should return customer summary with payment history", async () => {
      const customerId = "cust_456";

      // Create multiple payments for a customer
      await paymentService.createPaymentQR({
        amount: 100,
        description: "Payment 1",
        customerId,
      });

      await paymentService.createPaymentQR({
        amount: 200,
        description: "Payment 2",
        customerId,
      });

      const summary = await paymentService.getCustomerSummary(customerId);

      expect(summary).toBeDefined();
      expect(summary.customerId).toBe(customerId);
      expect(summary.totalPayments).toBeGreaterThanOrEqual(2);
      expect(summary.payments).toBeInstanceOf(Array);
    });

    it("should return empty summary for new customer", async () => {
      const summary = await paymentService.getCustomerSummary("new_cust_789");

      expect(summary).toBeDefined();
      expect(summary.customerId).toBe("new_cust_789");
      expect(summary.totalPayments).toBe(0);
      expect(summary.payments).toEqual([]);
    });
  });
});
