/**
 * Integration Tests - Payment Routes
 * Tests API endpoints and controller-level logic
 */

import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../../src/app";

describe("Payment Routes - Integration Tests", () => {
  describe("POST /api/payments/qr - Create QR Payment", () => {
    it("should successfully create a QR payment with valid request", async () => {
      const requestBody = {
        amount: 250,
        description: "Integration Test Payment",
        customerId: "cust_integration_123",
      };

      const response = await request(app)
        .post("/api/payments/qr")
        .send(requestBody)
        .expect(201);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("qrId");
      expect(response.body.data).toHaveProperty("qrCodeBase64");
      expect(response.body.data).toHaveProperty("upiDeepLink");
      expect(response.body.data.amount).toBe(250);
      expect(response.body.data.description).toBe("Integration Test Payment");
      expect(response.body.data.status).toBe("PENDING");
    });

    it("should reject request with invalid amount (negative)", async () => {
      const requestBody = {
        amount: -100,
        description: "Invalid Amount",
      };

      const response = await request(app)
        .post("/api/payments/qr")
        .send(requestBody)
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("validation");
    });

    it("should reject request with missing required fields", async () => {
      const requestBody = {
        amount: 100,
        // description is missing
      };

      const response = await request(app)
        .post("/api/payments/qr")
        .send(requestBody)
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("details");
      expect(Array.isArray(response.body.details)).toBe(true);
    });

    it("should reject request with empty description", async () => {
      const requestBody = {
        amount: 100,
        description: "", // Empty description
      };

      const response = await request(app)
        .post("/api/payments/qr")
        .send(requestBody)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.details[0].field).toContain("description");
    });
  });

  describe("GET /api/payments/qr/:qrId - Fetch Payment by QR ID", () => {
    it("should retrieve payment record with valid QR ID", async () => {
      // First, create a payment
      const createResponse = await request(app)
        .post("/api/payments/qr")
        .send({
          amount: 150,
          description: "Fetch Test Payment",
        });

      const qrId = createResponse.body.data.qrId;

      // Then, retrieve it
      const getResponse = await request(app)
        .get(`/api/payments/qr/${qrId}`)
        .expect(200);

      expect(getResponse.body).toHaveProperty("success", true);
      expect(getResponse.body.data.qrId).toBe(qrId);
      expect(getResponse.body.data.amount).toBe(150);
      expect(getResponse.body.data.status).toBe("PENDING");
    });

    it("should return 404 for non-existent QR ID", async () => {
      const response = await request(app)
        .get("/api/payments/qr/invalid_qr_12345")
        .expect(404);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body.error).toContain("not found");
    });

    it("should reject empty QR ID parameter", async () => {
      // Route returns 404 for missing route
      await request(app)
        .get("/api/payments/qr/")
        .expect(404);
    });
  });

  describe("PATCH /api/payments/qr/:qrId/confirm - Confirm Payment", () => {
    it("should successfully confirm a pending payment with SUCCESS status", async () => {
      // Create a payment first
      const createResponse = await request(app)
        .post("/api/payments/qr")
        .send({
          amount: 500,
          description: "Confirmation Test",
        });

      const qrId = createResponse.body.data.qrId;

      // Confirm the payment
      const confirmResponse = await request(app)
        .patch(`/api/payments/qr/${qrId}/confirm`)
        .send({
          transactionId: "UTR2024001234",
          status: "SUCCESS",
        })
        .expect(200);

      expect(confirmResponse.body).toHaveProperty("success", true);
      expect(confirmResponse.body.data.status).toBe("SUCCESS");
      expect(confirmResponse.body.data.transactionId).toBe("UTR2024001234");
      expect(confirmResponse.body.data.paidAt).toBeDefined();
    });

    it("should successfully mark payment as FAILED", async () => {
      const createResponse = await request(app)
        .post("/api/payments/qr")
        .send({
          amount: 200,
          description: "Failure Test",
        });

      const qrId = createResponse.body.data.qrId;

      const confirmResponse = await request(app)
        .patch(`/api/payments/qr/${qrId}/confirm`)
        .send({
          transactionId: "UTR2024005678",
          status: "FAILED",
        })
        .expect(200);

      expect(confirmResponse.body.data.status).toBe("FAILED");
      expect(confirmResponse.body.data.transactionId).toBe("UTR2024005678");
    });

    it("should reject confirmation with invalid status", async () => {
      const createResponse = await request(app)
        .post("/api/payments/qr")
        .send({
          amount: 100,
          description: "Invalid Status Test",
        });

      const qrId = createResponse.body.data.qrId;

      const response = await request(app)
        .patch(`/api/payments/qr/${qrId}/confirm`)
        .send({
          transactionId: "UTR123",
          status: "PENDING", // Invalid status
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("validation");
    });

    it("should reject confirmation with missing transaction ID", async () => {
      const createResponse = await request(app)
        .post("/api/payments/qr")
        .send({
          amount: 100,
          description: "Missing TX ID Test",
        });

      const qrId = createResponse.body.data.qrId;

      const response = await request(app)
        .patch(`/api/payments/qr/${qrId}/confirm`)
        .send({
          status: "SUCCESS",
          // transactionId is missing
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should return 404 when confirming non-existent payment", async () => {
      const response = await request(app)
        .patch("/api/payments/qr/non_existent_qr/confirm")
        .send({
          transactionId: "UTR999",
          status: "SUCCESS",
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/payments/customer/:customerId - Customer Summary", () => {
    it("should return customer summary with payment history", async () => {
      const customerId = "cust_summary_test";

      // Create multiple payments for the customer
      await request(app)
        .post("/api/payments/qr")
        .send({
          amount: 100,
          description: "Customer Payment 1",
          customerId,
        });

      await request(app)
        .post("/api/payments/qr")
        .send({
          amount: 200,
          description: "Customer Payment 2",
          customerId,
        });

      // Fetch customer summary
      const response = await request(app)
        .get(`/api/payments/customer/${customerId}`)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data.customerId).toBe(customerId);
      expect(response.body.data).toHaveProperty("totalPayments");
      expect(response.body.data).toHaveProperty("payments");
      expect(Array.isArray(response.body.data.payments)).toBe(true);
    });

    it("should return empty summary for new customer with no payments", async () => {
      const response = await request(app)
        .get("/api/payments/customer/new_customer_999")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.customerId).toBe("new_customer_999");
      expect(response.body.data.totalPayments).toBe(0);
      expect(response.body.data.payments).toEqual([]);
    });
  });

  describe("Health Check", () => {
    it("should return 200 OK on health endpoint", async () => {
      const response = await request(app)
        .get("/health")
        .expect(200);

      expect(response.body).toHaveProperty("status", "ok");
      expect(response.body).toHaveProperty("timestamp");
    });
  });
});
