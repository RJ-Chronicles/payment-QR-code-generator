import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

interface ValidationError {
  field: string;
  message: string;
}

/**
 * Express middleware factory for Zod schema validation.
 * Validates req.body against a Zod schema and passes validated data to req.validatedBody.
 * Returns 400 Bad Request with validation errors if validation fails.
 *
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 *
 * @example
 * router.post("/qr", validateBody(CreateQRRequestSchema), handler);
 */
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.body);
      (req as unknown as Record<string, unknown>).validatedBody = validated;
      next();
    } catch (error: unknown) {
      const zodError = error as ZodError;
      const errors: ValidationError[] = zodError.errors?.map((e) => ({
        field: e.path.join(".") || "root",
        message: e.message,
      })) || [{ field: "root", message: "Validation failed" }];

      res.status(400).json({
        success: false,
        error: "Request validation failed",
        details: errors,
      });
    }
  };
};

/**
 * Express middleware factory for Zod schema validation of URL parameters.
 * Validates req.params against a Zod schema.
 * Returns 400 Bad Request with validation errors if validation fails.
 *
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.params);
      next();
    } catch (error: unknown) {
      const zodError = error as ZodError;
      const errors: ValidationError[] = zodError.errors?.map((e) => ({
        field: e.path.join(".") || "root",
        message: e.message,
      })) || [{ field: "root", message: "Validation failed" }];

      res.status(400).json({
        success: false,
        error: "Parameter validation failed",
        details: errors,
      });
    }
  };
};

/**
 * Express middleware factory for Zod schema validation of query strings.
 * Validates req.query against a Zod schema.
 * Returns 400 Bad Request with validation errors if validation fails.
 *
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.query);
      next();
    } catch (error: unknown) {
      const zodError = error as ZodError;
      const errors: ValidationError[] = zodError.errors?.map((e) => ({
        field: e.path.join(".") || "root",
        message: e.message,
      })) || [{ field: "root", message: "Validation failed" }];

      res.status(400).json({
        success: false,
        error: "Query validation failed",
        details: errors,
      });
    }
  };
};
