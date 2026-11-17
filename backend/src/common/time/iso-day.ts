export const ISO_DAY_LENGTH = 10;
export const ISO_MONTH_LENGTH = 7;

export const isoDay = (date: Date): string => date.toISOString().slice(0, ISO_DAY_LENGTH);
