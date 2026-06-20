# QR Payment API — TypeScript + Express

UPI QR code payment system. Scanning the QR in **GPay / PhonePe / Paytm / BHIM** auto-populates the merchant, amount, and note — customer just taps Pay.

---

## Project Structure

```
src/
├── app.ts                        # Express app setup
├── server.ts                     # HTTP server entry point
├── types/
│   └── payment.types.ts          # Shared interfaces
├── store/
│   └── payment.store.ts          # In-memory store (swap for DB)
├── services/
│   └── payment.service.ts        # Business logic + UPI deep-link builder
└── routes/
    └── payment.routes.ts         # Express route handlers
```

---

## Setup

```bash
npm install
cp .env.example .env              # Set MERCHANT_UPI_ID & MERCHANT_NAME
npm run dev                       # Start with hot reload
```

---

## API Endpoints

### 1. Generate QR Code
`POST /api/payments/qr`

**Request:**
```json
{
  "amount": 499.00,
  "description": "Order #1042",
  "customerId": "CUST_001"        // optional — enables discount tracking
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "qrId": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 499.00,
    "currency": "INR",
    "merchantName": "My Store",
    "upiId": "mystore@okicici",
    "upiDeepLink": "upi://pay?pa=mystore@okicici&pn=My+Store&am=499.00&cu=INR&tn=Order+%231042&tr=550e8400...",
    "qrCodeBase64": "data:image/png;base64,...",   // use as <img src="...">
    "status": "PENDING",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

> **How auto-populate works**: The `upiDeepLink` encoded in the QR follows the NPCI UPI URI spec.  
> When the customer scans, GPay/PhonePe parses `pa` (merchant VPA), `pn` (name), `am` (amount), and pre-fills the payment screen.

---

### 2. Get Payment by QR ID
`GET /api/payments/qr/:qrId`

Poll this after the customer scans to check `status` (`PENDING → SUCCESS / FAILED`).

**Response:**
```json
{
  "success": true,
  "data": {
    "qrId": "...",
    "status": "SUCCESS",
    "transactionId": "UTR123456789",
    "paidAt": "2024-01-15T10:32:00.000Z",
    ...
  }
}
```

---

### 3. Confirm Payment (Webhook / Manual)
`PATCH /api/payments/qr/:qrId/confirm`

Call this from your UPI payment gateway webhook (Razorpay, PayU, Cashfree, etc.) or reconcile manually.

**Request:**
```json
{
  "transactionId": "UTR123456789",
  "status": "SUCCESS"
}
```

---

### 4. Customer History + Discount
`GET /api/payments/customer/:customerId`

Returns full payment history and computed discount for returning customers.

**Response:**
```json
{
  "success": true,
  "data": {
    "customerId": "CUST_001",
    "totalPayments": 4,
    "totalAmountPaid": 1996.00,
    "isEligibleForDiscount": true,
    "discountPercent": 10,
    "firstPaymentAt": "...",
    "lastPaymentAt": "...",
    "payments": [...]
  }
}
```

**Discount tiers:**

| Visits | Discount |
|--------|----------|
| 1+     | 5%       |
| 3+     | 10%      |
| 5+     | 15%      |

---

## Production Checklist

- [ ] Replace `payment.store.ts` with PostgreSQL / MongoDB
- [ ] Set real `MERCHANT_UPI_ID` in `.env`
- [ ] Integrate gateway webhook (Razorpay / Cashfree) to auto-confirm payments
- [ ] Add auth middleware (API key / JWT) to protect routes
- [ ] Add QR expiry (e.g. 15 min TTL on PENDING QRs)
- [ ] Rate-limit `/qr` endpoint

---

## UPI Deep Link Spec

```
upi://pay?pa=<VPA>&pn=<Name>&am=<Amount>&cu=INR&tn=<Note>&tr=<TxnRef>
```

| Param | Meaning         |
|-------|-----------------|
| `pa`  | Payee VPA (UPI ID) |
| `pn`  | Payee display name |
| `am`  | Amount in INR   |
| `cu`  | Currency (INR)  |
| `tn`  | Transaction note |
| `tr`  | Transaction reference (your qrId) |
