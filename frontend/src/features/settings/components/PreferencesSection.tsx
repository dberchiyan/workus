import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlined from '@mui/icons-material/LightModeOutlined';
import SettingsBrightnessOutlined from '@mui/icons-material/SettingsBrightnessOutlined';
import { useColorScheme } from '@mui/material/styles';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { SettingsCard } from './SettingsCard';

const MODES = [
  { mode: 'system', icon: SettingsBrightnessOutlined },
  { mode: 'light', icon: LightModeOutlined },
  { mode: 'dark', icon: DarkModeOutlined },
] as const;
type Mode = (typeof MODES)[number]['mode'];
const isMode = (value: unknown): value is Mode => MODES.some((item) => item.mode === value);

/** Appearance (this browser) and language. */
export function PreferencesSection() {
  const { t } = useTranslation('settings');
  const { mode, setMode } = useColorScheme();
  return (
    <div className="flex flex-col gap-4">
      <SettingsCard
        id="settings-appearance"
        title={t('preferences.theme.title')}
        description={t('preferences.theme.description')}
      >
        <ToggleButtonGroup
          exclusive
          value={mode ?? 'system'}
          aria-label={t('preferences.theme.title')}
          onChange={(_event, value: unknown) => {
            // Clicking the chosen option again keeps it.
            if (isMode(value)) {
              setMode(value);
            }
          }}
          className="flex-wrap"
        >
          {MODES.map(({ mode: option, icon: Icon }) => (
            <ToggleButton key={option} value={option} className="gap-2 px-4">
              <Icon aria-hidden fontSize="small" />
              {t(`preferences.theme.${option}`)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
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
