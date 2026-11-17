/** Billing dates are instants from the provider; shown as UTC days, like every other date. */
export const formatBillingDate = (iso: string, locale: string): string =>
    new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(iso));
