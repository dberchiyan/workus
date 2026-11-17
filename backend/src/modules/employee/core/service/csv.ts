const BOM = '﻿';

const quote = (value: string): string => (/[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

export const toCsv = (header: readonly string[], rows: readonly (readonly string[])[]): string =>
    BOM + [header, ...rows].map((row) => row.map(quote).join(',')).join('\r\n') + '\r\n';
