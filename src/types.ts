export interface Location {
  id: string;
  name: string;
  createdAt: string;
}

export interface DailyReport {
  id: string;
  locationId: string;
  date: string; // YYYY-MM-DD
  receiptsCount: number;
  cashAmount: number;
  cardAmount: number;
  qrAmount: number;
  refundsAmount: number;
  totalAmount: number;
  netTotalAmount: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyReportInput {
  locationId: string;
  date: string;
  receiptsCount: number;
  cashAmount: number;
  cardAmount: number;
  qrAmount: number;
  refundsAmount: number;
  comment: string;
}

export type SplitMode = "equal" | "manual";

export type PaymentStatus = "pending" | "paid" | "failed"; // пример

export interface SplitBillParticipant {
  id: string;
  name: string;
  amount: number;
  payLink: string;
  status: PaymentStatus;
}

export interface SplitBillCheck {
  id: string;
  totalAmount: number;
  participants: SplitBillParticipant[];
  mode: SplitMode;
  createdAt: string;
}
