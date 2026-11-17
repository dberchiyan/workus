import MenuOutlined from '@mui/icons-material/MenuOutlined';
import IconButton from '@mui/material/IconButton';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useAccess } from '@/features/auth';
import { NotificationBell } from '@/features/notification';

import { CommandPaletteButton } from './command-palette-button';
import { UserMenu } from './user-menu';

export interface TopBarProps {
    onOpenMenu?: () => void;
    menuButtonId: string;
    isMenuOpen: boolean;
}

export function TopBar({ onOpenMenu, menuButtonId, isMenuOpen }: TopBarProps): ReactElement {
    const { t } = useTranslation('shell');
    const can = useAccess();
    return (
        <header className="sticky top-0 z-10 flex h-top-bar-height shrink-0 border-b border-divider bg-background-paper px-4 md:px-8">
            <div className="mx-auto flex w-full max-w-page items-center gap-2">
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
                <div className="ml-auto flex items-center gap-1 sm:ml-0 sm:flex-1">
                    <CommandPaletteButton />
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                    {can('shell.notifications') && <NotificationBell />}
                    <UserMenu />
                </div>
            </div>
        </header>
    );
}
