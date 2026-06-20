import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import {
  CreateQRRequest,
  CustomerSummary,
  QRPaymentRecord,
} from "../types/payment.types";
import { paymentStore } from "../store/payment.store";

// ── Merchant config (move to env vars in production) ─────────────────────────
const MERCHANT_UPI_ID = process.env.MERCHANT_UPI_ID ?? "jondhalekarrajendra02@okaxis";
const MERCHANT_NAME = process.env.MERCHANT_NAME ?? "UPI Payment Gateway";

// ── Discount tiers ────────────────────────────────────────────────────────────
const DISCOUNT_TIERS = [
  { minVisits: 5, discountPercent: 15 },
  { minVisits: 3, discountPercent: 10 },
  { minVisits: 1, discountPercent: 5 },
];

// ── UPI deep-link builder ─────────────────────────────────────────────────────
/**
 * Builds a UPI payment URI per NPCI spec:
 * upi://pay?pa=<vpa>&pn=<name>&am=<amount>&cu=INR&tn=<note>&tr=<ref>
 *
 * GPay, PhonePe, Paytm, BHIM all support this format.
 */
function buildUPIDeepLink(params: {
  amount: number;
  description: string;
  qrId: string;
}): string {
  const url = new URL("upi://pay");
  url.searchParams.set("pa", MERCHANT_UPI_ID);          // Payee VPA
  url.searchParams.set("pn", MERCHANT_NAME);             // Payee name
  url.searchParams.set("am", params.amount.toFixed(2));  // Amount in INR
  url.searchParams.set("cu", "INR");                     // Currency
  url.searchParams.set("tn", params.description);        // Transaction note
  url.searchParams.set("tr", params.qrId);               // Transaction ref (our QR id)
  return url.toString();
}

// ── QR image generator ────────────────────────────────────────────────────────
async function generateQRImage(content: string): Promise<string> {
  return QRCode.toDataURL(content, {
    errorCorrectionLevel: "H",
    type: "image/png",
    width: 400,
    margin: 2,
    color: { dark: "#000000", light: "#FFFFFF" },
  });
}

// ── Service methods ───────────────────────────────────────────────────────────
export async function createPaymentQR(
  req: CreateQRRequest
): Promise<QRPaymentRecord> {
  if (!req.amount || req.amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  const qrId = uuidv4();

  const upiDeepLink = buildUPIDeepLink({
    amount: req.amount,
    description: req.description,
    qrId,
  });

  const qrCodeBase64 = await generateQRImage(upiDeepLink);

  const record: QRPaymentRecord = {
    qrId,
    customerId: req.customerId,
    amount: req.amount,
    currency: "INR",
    description: req.description,
    upiId: MERCHANT_UPI_ID,
    merchantName: MERCHANT_NAME,
    qrCodeBase64,
    upiDeepLink,
    status: "PENDING",
    createdAt: new Date(),
    metadata: req.metadata,
  };

  return paymentStore.save(record);
}

export async function getPaymentByQRId(
  qrId: string
): Promise<QRPaymentRecord | null> {
  return paymentStore.findById(qrId);
}

export async function confirmPayment(
  qrId: string,
  transactionId: string,
  status: "SUCCESS" | "FAILED"
): Promise<QRPaymentRecord | null> {
  const record = await paymentStore.findById(qrId);
  if (!record) return null;

  return paymentStore.update(qrId, {
    status,
    transactionId,
    paidAt: status === "SUCCESS" ? new Date() : undefined,
  });
}

export async function getCustomerSummary(
  customerId: string
): Promise<CustomerSummary> {
  const payments = await paymentStore.findByCustomerId(customerId);
  const successfulPayments = payments.filter((p) => p.status === "SUCCESS");

  const totalAmountPaid = successfulPayments.reduce(
    (sum, p) => sum + p.amount,
    0
  );

  const sortedDates = successfulPayments
    .map((p) => p.paidAt!)
    .filter(Boolean)
    .sort((a, b) => a.getTime() - b.getTime());

  // Determine discount based on number of successful visits
  const visits = successfulPayments.length;
  const tier = DISCOUNT_TIERS.find((t) => visits >= t.minVisits);
  const discountPercent = tier?.discountPercent ?? 0;

  return {
    customerId,
    totalPayments: successfulPayments.length,
    totalAmountPaid,
    firstPaymentAt: sortedDates[0],
    lastPaymentAt: sortedDates[sortedDates.length - 1],
    isEligibleForDiscount: discountPercent > 0,
    discountPercent,
    payments,
  };
}
