/**
 * Unit Tests - Validation Middleware
 * Tests middleware validation functions
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";
import { validateBody, validateParams, validateQuery } from "../../../src/middleware/validation.middleware";
import { Request, Response, NextFunction } from "express";

interface MockResponse extends Partial<Response> {
  statusCode?: number;
  jsonData?: Record<string, unknown>;
}

interface MockRequest extends Partial<Request> {
  validatedBody?: unknown;
}

describe("Validation Middleware - Unit Tests", () => {
  const createMockRequest = (data: Record<string, unknown>): MockRequest => ({
    body: data,
    params: data,
    query: data,
  });

  const createMockResponse = (): MockResponse => {
    const res: MockResponse = {};
    res.status = function (code: number) {
      res.statusCode = code;
      return res;
    };
    res.json = function (data: Record<string, unknown>) {
      res.jsonData = data;
      return res;
    };
    return res;
  };

  const createMockNext = (): NextFunction => {
    return () => {};
  };

  describe("validateBody middleware", () => {
    it("should pass validation and call next() for valid data", () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const req = createMockRequest({ name: "John", age: 30 });
      const res = createMockResponse();
      let nextCalled = false;
      const next = () => {
        nextCalled = true;
      };

      validateBody(schema)(req as Request, res as Response, next);

      expect(nextCalled).toBe(true);
      expect((req as MockRequest).validatedBody).toEqual({ name: "John", age: 30 });
    });

    it("should reject invalid data and return 400 error", () => {
      const schema = z.object({
        email: z.string().email(),
        amount: z.number().positive(),
      });

      const req = createMockRequest({ email: "invalid", amount: -50 });
      const res = createMockResponse();
      const next = createMockNext();

      validateBody(schema)(req as Request, res as Response, next);

      expect((res as MockResponse).statusCode).toBe(400);
      expect((res as MockResponse).jsonData?.success).toBe(false);
      expect((res as MockResponse).jsonData?.details).toBeDefined();
      expect(Array.isArray((res as MockResponse).jsonData?.details)).toBe(true);
    });

    it("should include field names in validation errors", () => {
      const schema = z.object({
        username: z.string().min(3),
        password: z.string().min(8),
      });

      const req = createMockRequest({ username: "ab", password: "123" });
      const res = createMockResponse();
      const next = createMockNext();

      validateBody(schema)(req as Request, res as Response, next);

      const errors = (res as MockResponse).jsonData?.details as unknown[];
      expect(errors.some((e: unknown) => (e as Record<string, unknown>).field === "username")).toBe(true);
      expect(errors.some((e: unknown) => (e as Record<string, unknown>).field === "password")).toBe(true);
    });
  });

  describe("validateParams middleware", () => {
    it("should validate URL parameters successfully", () => {
      const schema = z.object({
        id: z.string().min(1),
      });

      const req = createMockRequest({ id: "123" });
      const res = createMockResponse();
      let nextCalled = false;
      const next = () => {
        nextCalled = true;
      };

      validateParams(schema)(req as Request, res as Response, next);

      expect(nextCalled).toBe(true);
    });

    it("should reject invalid parameters and return 400 error", () => {
      const schema = z.object({
        id: z.string().uuid(),
      });

      const req = createMockRequest({ id: "not-a-uuid" });
      const res = createMockResponse();
      const next = createMockNext();

      validateParams(schema)(req as Request, res as Response, next);

      expect((res as MockResponse).statusCode).toBe(400);
      expect((res as MockResponse).jsonData?.success).toBe(false);
      expect((res as MockResponse).jsonData?.error).toContain("Parameter validation failed");
    });
  });

  describe("validateQuery middleware", () => {
    it("should validate query parameters successfully", () => {
      const schema = z.object({
        page: z.string().transform(Number).pipe(z.number().positive()).optional(),
        limit: z.string().transform(Number).pipe(z.number().positive()).optional(),
      });

      const req = createMockRequest({ page: "1", limit: "10" });
      const res = createMockResponse();
      let nextCalled = false;
      const next = () => {
        nextCalled = true;
      };

      validateQuery(schema)(req as Request, res as Response, next);

      expect(nextCalled).toBe(true);
    });

    it("should reject invalid query parameters", () => {
      const schema = z.object({
        sort: z.enum(["asc", "desc"]),
      });

      const req = createMockRequest({ sort: "invalid" });
      const res = createMockResponse();
      const next = createMockNext();

      validateQuery(schema)(req as Request, res as Response, next);

      expect((res as MockResponse).statusCode).toBe(400);
      expect((res as MockResponse).jsonData?.success).toBe(false);
      expect((res as MockResponse).jsonData?.error).toContain("Query validation failed");
    });
  });
});
