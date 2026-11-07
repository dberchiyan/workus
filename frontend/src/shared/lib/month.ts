/** `YYYY-MM` that many months later. */
export const shiftMonth = (month: string, months: number): string => {
  const [year = 0, index = 1] = month.split('-').map(Number);
  const total = year * 12 + index - 1 + months;
  return `${String(Math.floor(total / 12))}-${String((total % 12) + 1).padStart(2, '0')}`;
};
