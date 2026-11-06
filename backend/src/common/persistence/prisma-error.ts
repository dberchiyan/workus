import { Prisma } from '../../generated/prisma/client';

export const PrismaErrorKind = {
  UNIQUE_VIOLATION: 'UNIQUE_VIOLATION',
  FOREIGN_KEY_VIOLATION: 'FOREIGN_KEY_VIOLATION',
  NOT_FOUND: 'NOT_FOUND',
} as const;
export type PrismaErrorKind = (typeof PrismaErrorKind)[keyof typeof PrismaErrorKind];

const KIND_BY_CODE: Readonly<Record<string, PrismaErrorKind>> = {
  P2002: PrismaErrorKind.UNIQUE_VIOLATION,
  P2003: PrismaErrorKind.FOREIGN_KEY_VIOLATION,
  P2025: PrismaErrorKind.NOT_FOUND,
};

/** Classifies a Prisma error without leaking Prisma types out of the persistence layer. */
export const classifyPrismaError = (error: unknown): PrismaErrorKind | undefined =>
  error instanceof Prisma.PrismaClientKnownRequestError ? KIND_BY_CODE[error.code] : undefined;
