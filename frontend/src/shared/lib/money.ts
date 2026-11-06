/**
 * Money arrives as `{ amount: "4500.0000", currency: "USD" }` and stays a string. Never
 * parseFloat/Number() an amount (data.md → Money): formatting takes the string, comparisons
 * and chart geometry use exact integers (BigInt, 4 decimal places).
 */
export interface Money {
  amount: string;
  currency: string;
}

const SCALE = 4;
const AMOUNT = /^(-?)(\d+)(?:\.(\d{1,4}))?$/;

/** Exact integer in ten-thousandths, e.g. "4500.5" → 45005000n. */
export const toUnits = (amount: string): bigint => {
  const match = AMOUNT.exec(amount);
  if (!match) {
    throw new Error('Not a decimal amount');
  }
  const [, sign = '', whole = '0', fraction = ''] = match;
  const units = BigInt(whole) * 10n ** BigInt(SCALE) + BigInt(fraction.padEnd(SCALE, '0'));
  return sign === '-' ? -units : units;
};

export const compareMoney = (a: Money, b: Money): number => {
  const diff = toUnits(a.amount) - toUnits(b.amount);
  return diff === 0n ? 0 : diff > 0n ? 1 : -1;
};

/** Localised currency text from the string itself (Intl accepts decimal strings). */
export const formatMoney = (money: Money, locale: string): string =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: money.currency,
    maximumFractionDigits: toUnits(money.amount) % 10_000n === 0n ? 0 : 2,
    // The amount is a validated decimal string (API contract); Intl formats it without a float.
  }).format(money.amount as Intl.StringNumericLiteral);

/**
 * Position of `value` between `min` and `max` as a fraction 0…1 — a ratio for drawing, not an
 * amount. Exact up to 1/10 000.
 */
export const ratioBetween = (value: Money, min: Money, max: Money): number => {
  const range = toUnits(max.amount) - toUnits(min.amount);
  if (range === 0n) {
    return 0.5;
  }
  return Number(((toUnits(value.amount) - toUnits(min.amount)) * 10_000n) / range) / 10_000;
};
