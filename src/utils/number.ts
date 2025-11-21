export const toNumber = (value: string | number): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (!value?.trim()) {
    return 0;
  }

  const normalized = value.replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};
