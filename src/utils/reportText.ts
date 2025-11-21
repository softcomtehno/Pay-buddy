import type { DailyReport, Location } from "@/types";
import { formatCurrency } from "@/utils/number";

export const buildReportText = (
  report: DailyReport,
  location: Location
): string => {
  const lines = [
    `Отчёт за ${report.date}`,
    `Точка: ${location.name}`,
    `Чеков: ${report.receiptsCount}`,
    `Общая выручка: ${formatCurrency(report.totalAmount)} сом`,
    `— Наличные: ${formatCurrency(report.cashAmount)} сом`,
    `— Карта: ${formatCurrency(report.cardAmount)} сом`,
    `— QR: ${formatCurrency(report.qrAmount)} сом`,
    `Возвраты: ${formatCurrency(report.refundsAmount)} сом`,
    `Итого с учётом возвратов: ${formatCurrency(report.netTotalAmount)} сом`,
  ];

  if (report.comment) {
    lines.push(`Комментарий кассира: ${report.comment}`);
  }

  return lines.join("\n");
};
