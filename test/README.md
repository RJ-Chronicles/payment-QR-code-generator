# Test Suite Documentation

This directory contains comprehensive tests for the Payment API using the **Vitest** framework.

## 📁 Test Structure

```
test/
├── unit/                              # Unit Tests
│   ├── services/
│   │   └── payment.service.test.ts    # Payment service business logic tests
│   ├── schemas/
│   │   └── payment.schemas.test.ts    # Zod validation schema tests
│   └── middleware/
│       └── validation.middleware.test.ts  # Middleware validation tests
│
└── integration/                        # Integration Tests
    └── routes/
        └── payment.routes.test.ts     # API endpoint and controller tests
```

## 🧪 Test Files Overview

### Unit Tests

#### 1. **Payment Service Tests** (`unit/services/payment.service.test.ts`)
Tests the core business logic of the payment service.

**Test Scenarios:**
- ✅ **Success Case**: Create QR payment with valid input
- ✅ **QR Code Generation**: Verify valid base64 QR code is generated
- ✅ **UPI Deep Link**: Verify correct UPI format for payment apps
- ✅ **Retrieve Payment**: Fetch payment by QR ID
- ❌ **Failed Case**: Return undefined for non-existent QR
- ✅ **Confirm Payment**: Mark payment as SUCCESS
- ✅ **Failed Confirmation**: Mark payment as FAILED
- ✅ **Customer Summary**: Get payment history for customer
- ✅ **New Customer**: Return empty summary for customers with no payments

**Key Assertions:**
```typescript
- Payment status transitions (PENDING → SUCCESS/FAILED)
- QR code base64 format validation
- UPI deep link NPCI compliance
- Data persistence and retrieval
```

---

#### 2. **Validation Schema Tests** (`unit/schemas/payment.schemas.test.ts`)
Tests Zod schema validation for all request/response models.

**Test Scenarios:**
- ✅ **Valid Request**: Accept correctly formatted payment request
- ❌ **Negative Amount**: Reject negative amounts
- ❌ **Amount Limit**: Reject amounts exceeding 999,999.99
- ❌ **Empty Description**: Reject empty description
- ❌ **Missing Fields**: Reject missing required fields
- ✅ **Optional Fields**: Allow omission of optional fields
- ❌ **Invalid Status**: Reject invalid payment status values
- ✅ **Valid Statuses**: Accept SUCCESS and FAILED statuses
- ❌ **Long Transaction ID**: Reject transaction IDs exceeding 100 chars

**Key Validations:**
```typescript
- Amount: positive, max 999,999.99
- Description: non-empty, max 255 chars
- Status: enum ["SUCCESS", "FAILED", "PENDING", "EXPIRED"]
- Transaction ID: 1-100 characters
```

---

#### 3. **Validation Middleware Tests** (`unit/middleware/validation.middleware.test.ts`)
Tests the Express middleware for request validation.

**Test Scenarios:**
- ✅ **Valid Data**: Pass validation and call next()
- ❌ **Invalid Data**: Return 400 error for invalid input
- ✅ **Error Details**: Include field names in error messages
- ✅ **Param Validation**: Validate URL parameters
- ✅ **Query Validation**: Validate query strings

**Key Validations:**
```typescript
- Body validation with error messaging
- Parameter validation
- Query string validation
- Error response format consistency
```

---

### Integration Tests

#### 4. **Payment Routes Tests** (`integration/routes/payment.routes.test.ts`)
Tests complete API endpoints with real HTTP requests using supertest.

**Test Scenarios:**

**POST /api/payments/qr** (Create QR Payment)
- ✅ **Success**: Create QR payment with valid request (201)
- ❌ **Invalid Amount**: Reject negative amounts (400)
- ❌ **Missing Fields**: Reject incomplete requests (400)
- ❌ **Empty Description**: Reject empty description (400)

**GET /api/payments/qr/:qrId** (Fetch Payment)
- ✅ **Success**: Retrieve payment by QR ID (200)
- ❌ **Not Found**: Return 404 for invalid QR ID
- ✅ **Data Integrity**: Verify returned data matches created data

**PATCH /api/payments/qr/:qrId/confirm** (Confirm Payment)
- ✅ **Success Confirmation**: Mark payment as SUCCESS (200)
- ✅ **Failed Confirmation**: Mark payment as FAILED (200)
- ❌ **Invalid Status**: Reject unknown status values (400)
- ❌ **Missing Transaction ID**: Reject missing UTR (400)
- ❌ **Payment Not Found**: Return 404 for invalid QR ID

**GET /api/payments/customer/:customerId** (Customer Summary)
- ✅ **With History**: Return customer with payment history (200)
- ✅ **New Customer**: Return summary with zero payments (200)

**GET /health** (Health Check)
- ✅ **Health OK**: Return status ok (200)

---

## 🚀 Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Run Tests with UI Dashboard
```bash
npm run test:ui
```

### Run Specific Test File
```bash
npm test -- payment.service.test.ts
```

### Run Tests Matching Pattern
```bash
npm test -- --grep "Create QR"
```

### Generate Coverage Report
```bash
npm run test:coverage
```

---

## 📊 Test Coverage

| File | Tests | Coverage |
|------|-------|----------|
| `payment.service.ts` | 10 | ✅ Success, Failure, Edge Cases |
| `payment.schemas.ts` | 12 | ✅ Validation Rules, Edge Cases |
| `validation.middleware.ts` | 8 | ✅ Request/Response/Query |
| `payment.routes.ts` | 17 | ✅ All Endpoints, Status Codes |
| **Total** | **47** | **Comprehensive** |

---

## 🔍 Test Patterns Used

### 1. **Success/Failure Pattern**
Each test suite includes happy path and error cases:
```typescript
it("should successfully...", async () => {
  // Success case
});

it("should reject...", async () => {
  // Failure case
});
```

### 2. **Arrange-Act-Assert Pattern**
```typescript
// Arrange - Setup
const input = { amount: 100, description: "Test" };

// Act - Execute
const result = await createPaymentQR(input);

// Assert - Verify
expect(result.amount).toBe(100);
```

### 3. **Edge Case Testing**
- Boundary values (0, max limits)
- Empty/null values
- Invalid data types
- Missing required fields

---

## 🎯 Test Scenarios Summary

### Scenario 1: Successful Payment Creation & Confirmation
1. Create QR payment with valid amount and description ✅
2. Verify QR code is generated correctly ✅
3. Retrieve payment details ✅
4. Confirm payment with transaction ID ✅
5. Verify payment status changed to SUCCESS ✅

### Scenario 2: Payment Failure Flow
1. Create QR payment ✅
2. Attempt to confirm with FAILED status ✅
3. Verify payment is marked as FAILED ✅
4. Retrieve payment and confirm failure state ✅

### Scenario 3: Validation Error Handling
1. Attempt to create payment with negative amount ❌
2. Receive 400 validation error ✅
3. Verify error message is descriptive ✅
4. Attempt confirmation with invalid status ❌
5. Receive 400 validation error ✅

---

## 📋 Test Configuration

**Vitest Configuration** (`vitest.config.ts`):
```typescript
{
  globals: true,              // Use global test functions
  environment: "node",         // Node.js environment
  include: ["test/**/*.test.ts"], // Match all .test.ts files
  exclude: ["node_modules", "dist"]
}
```

**Test Script** in `package.json`:
```json
{
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest --coverage"
}
```

---

## 🛠️ Tools & Dependencies

- **Vitest**: Fast unit test framework
- **Supertest**: HTTP request assertions
- **Zod**: Runtime type validation

---

## 💡 Best Practices

✅ One assertion per test (or related group)  
✅ Descriptive test names  
✅ Isolated tests (no dependencies between tests)  
✅ Use `beforeEach`/`afterEach` for setup/teardown  
✅ Test both happy path and error cases  
✅ Validate error messages, not just status codes  
✅ Use fixtures for common test data  

---

## 🔗 Related Files

- [Payment Service](../src/services/payment.service.ts)
- [Payment Routes](../src/routes/payment.routes.ts)
- [Validation Schemas](../src/schemas/payment.schemas.ts)
- [Validation Middleware](../src/middleware/validation.middleware.ts)
- [TypeScript Config](../tsconfig.json)
