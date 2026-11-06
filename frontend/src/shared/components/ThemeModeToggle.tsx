import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlined from '@mui/icons-material/LightModeOutlined';
import IconButton from '@mui/material/IconButton';
import { useColorScheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

/** Explicit light/dark choice; MUI persists it, initial mode follows the system. */
export function ThemeModeToggle() {
  const { t } = useTranslation();
  const { mode, systemMode, setMode } = useColorScheme();
  const resolved = mode === 'system' ? systemMode : mode;
  const isDark = resolved === 'dark';

  return (
    <IconButton
      onClick={() => {
        setMode(isDark ? 'light' : 'dark');
      }}
      aria-label={isDark ? t('theme.switchToLight') : t('theme.switchToDark')}
    >
      {isDark ? <LightModeOutlined aria-hidden /> : <DarkModeOutlined aria-hidden />}
    </IconButton>
  );
}
