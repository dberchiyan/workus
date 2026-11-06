import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enAuth from '@/locales/en/auth.json';
import enCommon from '@/locales/en/common.json';
import enEmployee from '@/locales/en/employee.json';
import enErrors from '@/locales/en/errors.json';
import enDashboard from '@/locales/en/dashboard.json';
import enShell from '@/locales/en/shell.json';
import enValidation from '@/locales/en/validation.json';

export const SUPPORTED_LOCALES = ['en'] as const;
export const DEFAULT_NAMESPACE = 'common';

export const resources = {
  en: {
    common: enCommon,
    validation: enValidation,
    errors: enErrors,
    auth: enAuth,
    dashboard: enDashboard,
    employee: enEmployee,
    shell: enShell,
  },
} as const;

i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language;
});

await i18n.use(initReactI18next).init({
  resources,
  lng: import.meta.env.VITE_DEFAULT_LOCALE || SUPPORTED_LOCALES[0],
  fallbackLng: SUPPORTED_LOCALES[0],
  supportedLngs: SUPPORTED_LOCALES,
  ns: Object.keys(resources.en),
  defaultNS: DEFAULT_NAMESPACE,
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
