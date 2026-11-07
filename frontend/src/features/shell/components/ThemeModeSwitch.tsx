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
}

/** System / Light / Dark in the account menu; MUI keeps the choice in this browser. */
export function ThemeModeSwitch({ label }: ThemeModeSwitchProps) {
  const { t } = useTranslation();
  const { mode, setMode } = useColorScheme();
  return (
    <ToggleButtonGroup
      exclusive
      fullWidth
      size="small"
      value={mode ?? 'system'}
      aria-label={label}
      onChange={(_event, value: unknown) => {
        // Clicking the chosen option again keeps it.
        if (isMode(value)) {
          setMode(value);
        }
      }}
    >
      {MODES.map(({ mode: option, icon: Icon }) => (
        <ToggleButton
          key={option}
          value={option}
          // Compact, so three fit in one row of the 288 px panel.
          className="min-w-0 gap-1.5 px-1 py-1"
        >
          <Icon aria-hidden fontSize="small" />
          {t(`theme.${option}`)}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
