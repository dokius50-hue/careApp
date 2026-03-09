export const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

