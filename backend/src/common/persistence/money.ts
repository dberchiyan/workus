import { Prisma } from '../../generated/prisma/client';

/** Money is a Decimal in code, NUMERIC(19,4) in the database, a string on the wire. */
export type Decimal = Prisma.Decimal;

export const Currency = { USD: 'USD' } as const;
export type Currency = (typeof Currency)[keyof typeof Currency];

export interface Money {
  amount: string;
  currency: string;
}

/** Wire format: `{ amount: "4500.0000", currency: "USD" }`. */
export const toMoney = (amount: Decimal, currency: string): Money => ({
  amount: amount.toFixed(4),
  currency,
});

/** Parses a validated decimal string (never a JS number). */
export const toDecimal = (amount: string): Decimal => new Prisma.Decimal(amount);

/** (current − previous) / previous × 100, one decimal, ROUND_HALF_UP — e.g. "12.5", "-3.0". */
export const percentChange = (current: Decimal, previous: Decimal): string =>
  current
    .minus(previous)
    .dividedBy(previous)
    .times(100)
    .toDecimalPlaces(1, Prisma.Decimal.ROUND_HALF_UP)
    .toFixed(1);

/** Rounded to the cent, ROUND_HALF_UP (averages of salaries). */
export const roundToCents = (amount: Decimal): Decimal =>
  amount.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
