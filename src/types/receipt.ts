/**
 * Типы для данных чека от API
 */

export interface ReceiptProduct {
  productId: number;
  productName: string;
  productPrice: string;
  productCount: string;
  productCost: string;
}

export interface ReceiptData {
  id: string;
  date: string;
  time: string;
  cashierName: string;
  locationName: string;
  address: string;
  sum: string;
  products: ReceiptProduct[];
}

export interface ReceiptSplitParticipant {
  id: string;
  name: string;
  amount: number;
  payLink: string;
  status: "pending" | "paid";
}

export interface ReceiptSplit {
  receiptId: string;
  totalAmount: number;
  participants: ReceiptSplitParticipant[];
  mode: "equal" | "manual";
  createdAt: string;
}

