/** Public surface of the settings feature (UI composition — its data lives in `auth`). */
import { lazyWithPreload } from '@/shared/lib/lazyWithPreload';

export const SettingsPage = lazyWithPreload(() => import('./pages/SettingsPage'));
export { SETTINGS_SECTIONS, sectionAccessPart, type SettingsSection } from './sections';
