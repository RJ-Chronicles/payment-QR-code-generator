import { QRPaymentRecord } from "../types/payment.types";

/**
 * In-memory store — replace with PostgreSQL / MongoDB in production.
 * All methods are async so swapping is a drop-in.
 */
class PaymentStore {
  private records = new Map<string, QRPaymentRecord>();

  async save(record: QRPaymentRecord): Promise<QRPaymentRecord> {
    this.records.set(record.qrId, record);
    return record;
  }

  async findById(qrId: string): Promise<QRPaymentRecord | null> {
    return this.records.get(qrId) ?? null;
  }

  async update(
    qrId: string,
    patch: Partial<QRPaymentRecord>
  ): Promise<QRPaymentRecord | null> {
    const existing = this.records.get(qrId);
    if (!existing) return null;
    const updated = { ...existing, ...patch };
    this.records.set(qrId, updated);
    return updated;
  }

  async findByCustomerId(customerId: string): Promise<QRPaymentRecord[]> {
    return Array.from(this.records.values()).filter(
      (r) => r.customerId === customerId
    );
  }

  async findAll(): Promise<QRPaymentRecord[]> {
    return Array.from(this.records.values());
  }
}

export const paymentStore = new PaymentStore();
