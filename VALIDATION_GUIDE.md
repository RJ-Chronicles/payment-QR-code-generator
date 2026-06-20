# Zod Validation Guide

This project uses **Zod** for runtime type validation and schema definition. All request bodies, responses, and data models are validated against Zod schemas to ensure type safety and catch errors early.

## 📁 Validation Structure

```
src/
├── schemas/
│   └── payment.schemas.ts        # All Zod validation schemas
├── middleware/
│   └── validation.middleware.ts   # Express middleware for validation
├── routes/
│   └── payment.routes.ts          # Routes with validation applied
├── types/
│   └── payment.types.ts           # Types re-exported from schemas
└── services/
    └── payment.service.ts         # Business logic
```

## 🔍 How Validation Works

### 1. Request Validation (Middleware)

The `validateBody`, `validateParams`, and `validateQuery` middleware functions validate incoming data before it reaches your route handlers:

```typescript
// Validate request body
paymentRouter.post(
  "/qr",
  validateBody(CreateQRRequestSchema),  // ← Validates req.body
  async (req: Request, res: Response) => {
    const body = (req as any).validatedBody;  // ← Get validated data
    // ... handler logic
  }
);

// Validate URL parameters
paymentRouter.get(
  "/qr/:qrId",
  validateParams(z.object({ qrId: z.string().min(1) })),  // ← Validates req.params
  async (req: Request, res: Response) => {
    // ... handler logic
  }
);
```

### 2. Response Validation

Response shapes are validated before sending to ensure consistency:

```typescript
// Validate response matches schema
const validated = CreateQRResponseSchema.parse({
  success: true,
  data: record,  // ← Must match QRPaymentRecordSchema
});

res.status(201).json(validated);  // ← Type-safe response
```

### 3. Type Safety

All types are inferred from Zod schemas using `z.infer<>`:

```typescript
export type CreateQRRequest = z.infer<typeof CreateQRRequestSchema>;
// ↑ Type automatically matches the schema definition
```

## 📋 Available Schemas

### Request Schemas

| Schema | Purpose | Fields |
|--------|---------|--------|
| `CreateQRRequestSchema` | Create QR payment | amount, description, customerId?, metadata? |
| `ConfirmPaymentRequestSchema` | Confirm payment | transactionId, status |

### Response Schemas

| Schema | Purpose |
|--------|---------|
| `CreateQRResponseSchema` | Success response with QR data |
| `GetQRResponseSchema` | Single QR payment response |
| `ConfirmPaymentResponseSchema` | Payment confirmation response |
| `GetCustomerSummaryResponseSchema` | Customer summary response |

## ✅ Validation Rules

### CreateQRRequest
- **amount**: Positive number, max 999,999.99 INR
- **description**: Non-empty string, max 255 characters
- **customerId**: Optional string
- **metadata**: Optional object

### ConfirmPaymentRequest
- **transactionId**: Non-empty string, max 100 characters (UTR/UPI ref)
- **status**: Must be "SUCCESS" or "FAILED"

## 🚀 Error Handling

Validation errors return a 400 status with detailed error information:

```json
{
  "success": false,
  "error": "Request validation failed",
  "details": [
    {
      "field": "amount",
      "message": "Amount must be a positive number"
    },
    {
      "field": "description",
      "message": "Description must not exceed 255 characters"
    }
  ]
}
```

## 🔄 Adding New Validations

To add validation for a new endpoint:

1. **Define the schema** in `src/schemas/payment.schemas.ts`:
   ```typescript
   export const MyRequestSchema = z.object({
     field1: z.string().min(1),
     field2: z.number().positive(),
   });
   ```

2. **Use middleware** in your route:
   ```typescript
   router.post(
     "/endpoint",
     validateBody(MyRequestSchema),
     async (req, res) => {
       const data = (req as any).validatedBody;
       // ... handler
     }
   );
   ```

3. **Validate responses** before sending:
   ```typescript
   const validated = MyResponseSchema.parse(result);
   res.json(validated);
   ```

## 🛠️ Installation

Zod is already added to `package.json`. Install dependencies with:

```bash
npm install
```

## 📚 References

- [Zod Documentation](https://zod.dev)
- [Express Middleware Guide](https://expressjs.com/en/guide/using-middleware.html)
- Payment API Routes: [payment.routes.ts](./routes/payment.routes.ts)
