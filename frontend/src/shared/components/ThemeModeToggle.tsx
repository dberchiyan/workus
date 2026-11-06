import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlined from '@mui/icons-material/LightModeOutlined';
import IconButton from '@mui/material/IconButton';
import { useColorScheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import { useTranslation } from 'react-i18next';

/** Explicit light/dark choice; MUI persists it, initial mode follows the system. */
export function ThemeModeToggle() {
  const { t } = useTranslation();
  const { mode, systemMode, setMode } = useColorScheme();
  const resolved = mode === 'system' ? systemMode : mode;
  const isDark = resolved === 'dark';

  const label = isDark ? t('theme.switchToLight') : t('theme.switchToDark');

  return (
    <Tooltip title={label}>
      <IconButton
        onClick={() => {
          setMode(isDark ? 'light' : 'dark');
        }}
        aria-label={label}
      >
        {isDark ? <LightModeOutlined aria-hidden /> : <DarkModeOutlined aria-hidden />}
      </IconButton>
    </Tooltip>
  );
}
