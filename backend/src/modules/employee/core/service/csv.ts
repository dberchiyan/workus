/**
 * RFC 4180 CSV for the exports (Business plan): CRLF rows, every field quoted when it holds a
 * comma, a quote or a line break; a UTF-8 BOM so spreadsheets read accents right.
 */
const BOM = '﻿';

const quote = (value: string): string => (/[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

export const toCsv = (header: readonly string[], rows: readonly (readonly string[])[]): string =>
    BOM + [header, ...rows].map((row) => row.map(quote).join(',')).join('\r\n') + '\r\n';
