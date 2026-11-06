import MenuOutlined from '@mui/icons-material/MenuOutlined';
import IconButton from '@mui/material/IconButton';
import { useTranslation } from 'react-i18next';
import { ThemeModeToggle } from '@/shared/components/ThemeModeToggle';
import { UserMenu } from './UserMenu';

export interface TopBarProps {
  /** Present on mobile only, where the menu is a temporary drawer. */
  onOpenMenu?: () => void;
  menuButtonId: string;
  isMenuOpen: boolean;
}

export function TopBar({ onOpenMenu, menuButtonId, isMenuOpen }: TopBarProps) {
  const { t } = useTranslation('shell');
  return (
    <header className="sticky top-0 z-10 flex h-top-bar-height shrink-0 items-center gap-2 border-b border-divider bg-background-paper px-2 sm:px-4 md:px-6">
      {onOpenMenu && (
        <IconButton
          id={menuButtonId}
          aria-label={t('menu.open')}
          aria-expanded={isMenuOpen}
          onClick={onOpenMenu}
          edge="start"
        >
          <MenuOutlined aria-hidden />
        </IconButton>
      )}
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <ThemeModeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
