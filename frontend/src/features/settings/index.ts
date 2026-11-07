/** Public surface of the settings feature (UI composition — its data lives in `auth`). */
import { lazy } from 'react';

export const SettingsPage = lazy(() => import('./pages/SettingsPage'));
