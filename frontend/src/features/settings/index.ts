import { lazyWithPreload } from '@/shared/lib/lazy-with-preload';

export const SettingsPage = lazyWithPreload(async () => ({
    default: (await import('./pages/settings-page')).SettingsPage,
}));
export { sectionAccessPart, SETTINGS_SECTIONS, type SettingsSection } from './sections';
