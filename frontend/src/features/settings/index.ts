/** Public surface of the settings feature (UI composition — its data lives in `auth`). */
import { lazyWithPreload } from '@/shared/lib/lazy-with-preload';

export const SettingsPage = lazyWithPreload(() => import('./pages/settings-page'));
export { SETTINGS_SECTIONS, sectionAccessPart, type SettingsSection } from './sections';
