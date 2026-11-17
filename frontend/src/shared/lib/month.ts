import { MONTHS_PER_YEAR } from '@/shared/lib/units';
/** `YYYY-MM` that many months later. */
export const shiftMonth = (month: string, months: number): string => {
    const [year = 0, index = 1] = month.split('-').map(Number);
    const total = year * MONTHS_PER_YEAR + index - 1 + months;
    return `${String(Math.floor(total / MONTHS_PER_YEAR))}-${String((total % MONTHS_PER_YEAR) + 1).padStart(2, '0')}`;
};
