import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlined from '@mui/icons-material/LightModeOutlined';
import SettingsBrightnessOutlined from '@mui/icons-material/SettingsBrightnessOutlined';
import { useColorScheme } from '@mui/material/styles';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useTranslation } from 'react-i18next';

const MODES = [
  { mode: 'system', icon: SettingsBrightnessOutlined },
  { mode: 'light', icon: LightModeOutlined },
  { mode: 'dark', icon: DarkModeOutlined },
] as const;
type Mode = (typeof MODES)[number]['mode'];
const isMode = (value: unknown): value is Mode => MODES.some((item) => item.mode === value);

export interface ThemeModeSwitchProps {
  /** Names the group for assistive tech. */
  label: string;
  /** Buttons share the full width (the account menu). */
  fullWidth?: boolean;
}

/** System / Light / Dark; MUI keeps the choice in this browser. */
export function ThemeModeSwitch({ label, fullWidth = false }: ThemeModeSwitchProps) {
  const { t } = useTranslation();
  const { mode, setMode } = useColorScheme();
  return (
    <ToggleButtonGroup
      exclusive
      fullWidth={fullWidth}
      size={fullWidth ? 'small' : 'medium'}
      value={mode ?? 'system'}
      aria-label={label}
      onChange={(_event, value: unknown) => {
        // Clicking the chosen option again keeps it.
        if (isMode(value)) {
          setMode(value);
        }
      }}
      className={fullWidth ? undefined : 'flex-wrap'}
    >
      {MODES.map(({ mode: option, icon: Icon }) => (
        <ToggleButton
          key={option}
          value={option}
          // Full width (a narrow panel): compact, so three fit in one row of 288 px.
          className={fullWidth ? 'min-w-0 gap-1.5 px-1 py-1' : 'gap-2 px-4'}
        >
          <Icon aria-hidden fontSize="small" />
          {t(`theme.${option}`)}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
