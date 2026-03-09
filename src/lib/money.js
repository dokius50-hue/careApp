export const formatEuro = (cents) => {
  if (cents == null || Number.isNaN(cents)) return '€0.00';
  const value = cents / 100;
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export const parseEuroToCents = (value) => {
  if (typeof value !== 'string' && typeof value !== 'number') return 0;
  const num = Number(String(value).replace(',', '.').trim());
  if (Number.isNaN(num)) return 0;
  return Math.round(num * 100);
};

