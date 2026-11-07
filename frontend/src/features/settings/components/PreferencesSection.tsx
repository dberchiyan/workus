import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { ThemeModeSwitch } from '@/shared/components/ThemeModeSwitch';
import { SettingsCard } from './SettingsCard';

/** Appearance (this browser) and language. */
export function PreferencesSection() {
  const { t } = useTranslation('settings');
  return (
    <div className="flex flex-col gap-4">
      <SettingsCard
        id="settings-appearance"
        title={t('preferences.theme.title')}
        description={t('preferences.theme.description')}
      >
        <ThemeModeSwitch label={t('preferences.theme.title')} />
      </SettingsCard>
      <SettingsCard
        id="settings-language"
        title={t('preferences.language.title')}
        description={t('preferences.language.description')}
      >
        <Typography variant="body1">{t('preferences.language.english')}</Typography>
      </SettingsCard>
    </div>
  );
}
