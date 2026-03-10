export const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toLocalDateFromIso = (isoDate) => {
  if (!isoDate || typeof isoDate !== 'string') return null;
  const [y, m, d] = isoDate.split('-').map((n) => Number(n));
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

/** Always day before month (e.g. "10 Mar"). */
export const formatDisplayDate = (value, locale = 'en') => {
  if (!value) return '';
  const dateObj = value instanceof Date ? value : toLocalDateFromIso(value);
  if (!dateObj || Number.isNaN(dateObj.getTime())) return String(value);

  const parts = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).formatToParts(dateObj);
  const day = parts.find((p) => p.type === 'day')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  if (!day || !month) return `${dateObj.getDate()} ${new Intl.DateTimeFormat(locale, { month: 'short' }).format(dateObj)}`;
  return `${day} ${month}`;
};

/** Format as "D Mon YYYY" (e.g. 10 Mar 2025), always day before month. */
export const formatDateDMonYYYY = (value, locale = 'en') => {
  if (!value) return '';
  const dateObj = value instanceof Date ? value : toLocalDateFromIso(typeof value === 'string' ? value.slice(0, 10) : value);
  if (!dateObj || Number.isNaN(dateObj.getTime())) return '';
  const parts = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).formatToParts(dateObj);
  const day = parts.find((p) => p.type === 'day')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const year = parts.find((p) => p.type === 'year')?.value;
  if (!day || !month || !year) return '';
  return `${day} ${month} ${year}`;
};

/** Parse a display date string (e.g. "10 Mar 2025") to YYYY-MM-DD; falls back to today if invalid. */
export const parseDisplayDateToIso = (text) => {
  if (!text || !String(text).trim()) return getLocalDateString();
  const d = new Date(String(text).trim());
  return !Number.isNaN(d.getTime()) ? getLocalDateString(d) : getLocalDateString();
};

export const formatDisplayMonthYear = (isoDate, locale = 'en') => {
  const d = toLocalDateFromIso(isoDate);
  if (!d) return '';
  const parts = new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }).formatToParts(d);
  const month = parts.find((p) => p.type === 'month')?.value;
  const year = parts.find((p) => p.type === 'year')?.value;
  if (!month || !year) return new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }).format(d);
  return `${month} ${year}`;
};

export const formatDisplayDateTime = (value, locale = 'en') => {
  if (!value) return '';
  if (value instanceof Date) return `${formatDisplayDate(value, locale)} ${value.toTimeString().slice(0, 5)}`;
  if (typeof value !== 'string') return String(value);
  const maybeIso = value.slice(0, 10);
  const time = value.slice(11, 16);
  if (/^\d{4}-\d{2}-\d{2}$/.test(maybeIso) && /^\d{2}:\d{2}$/.test(time)) {
    return `${formatDisplayDate(maybeIso, locale)} ${time}`;
  }
  return value;
};

export const getNinetyDaysAgo = () => {
  const d = new Date();
  d.setDate(d.getDate() - 90);
  return getLocalDateString(d);
};

export const getDateNDaysAgo = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return getLocalDateString(d);
};

