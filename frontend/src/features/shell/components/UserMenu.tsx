import LogoutOutlined from '@mui/icons-material/LogoutOutlined';
import PersonOutlineOutlined from '@mui/icons-material/PersonOutlineOutlined';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import ButtonBase from '@mui/material/ButtonBase';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useCurrentUser, useLogout } from '@/features/auth';
import { InitialsAvatar } from '@/shared/components/InitialsAvatar';
import { ThemeModeSwitch } from '@/shared/components/ThemeModeSwitch';
import { PATHS, settingsPath } from '@/shared/lib/paths';

const LINKS = [
  { key: 'profile', to: settingsPath('account'), icon: PersonOutlineOutlined },
  { key: 'securityDevices', to: settingsPath('security'), icon: ShieldOutlined },
  { key: 'settings', to: PATHS.settings, icon: SettingsOutlined },
] as const;

/**
 * Name, role and avatar; opens the account panel: who is signed in, the theme, links into
 * Settings and Sign out. A dialog rather than a menu, because it holds more than menu items.
 */
export function UserMenu() {
  const { t } = useTranslation('shell');
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const panelId = useId();
  const nameId = useId();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  if (!user) {
    return null;
  }
  const fullName = `${user.firstName} ${user.lastName}`;
  const role = t(`role.${user.role}`);
  const close = (): void => {
    setAnchor(null);
  };

  return (
    <>
      <ButtonBase
        aria-label={t('account.open', { name: fullName })}
        aria-haspopup="dialog"
        aria-controls={anchor ? panelId : undefined}
        aria-expanded={anchor ? true : undefined}
        onClick={(event) => {
          setAnchor(event.currentTarget);
        }}
        // -mr-2: the avatar (not the padded hit area) aligns with the content edge.
        className="-mr-2 min-h-11 gap-3 rounded-sm px-2"
      >
        <span className="hidden flex-col items-end sm:flex">
          <Typography variant="subtitle2" component="span">
            {fullName}
          </Typography>
          <Typography variant="caption" component="span" color="textSecondary">
            {role}
          </Typography>
        </span>
        <InitialsAvatar id={user.id} firstName={user.firstName} lastName={user.lastName} />
      </ButtonBase>
      <Popover
        id={panelId}
        anchorEl={anchor}
        open={anchor !== null}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          // The popover focuses its paper; move on to the first item so arrows work at once.
          transition: {
            onEntered: () => {
              menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
            },
          },
          paper: {
            role: 'dialog',
            'aria-labelledby': nameId,
            className: 'mt-1 w-[calc(100vw-2rem)] max-w-80',
          },
        }}
      >
        <div className="flex items-center gap-3 px-4 py-4">
          <InitialsAvatar id={user.id} firstName={user.firstName} lastName={user.lastName} />
          <div className="flex min-w-0 flex-col">
            <Typography id={nameId} variant="subtitle2" component="p" className="truncate">
              {fullName}
            </Typography>
            <Typography variant="body2" color="textSecondary" className="truncate">
              {user.email}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {role}
            </Typography>
          </div>
        </div>
        <Divider />
        <div className="flex flex-col gap-2 px-4 py-3">
          <Typography variant="caption" color="textSecondary" aria-hidden>
            {t('account.theme')}
          </Typography>
          <ThemeModeSwitch label={t('account.theme')} fullWidth />
        </div>
        <Divider />
        <MenuList ref={menuRef} aria-label={t('account.title')} className="py-1">
          {LINKS.map(({ key, to, icon: Icon }) => (
            <MenuItem key={key} component={Link} to={to} onClick={close} className="min-h-11">
              <ListItemIcon>
                <Icon aria-hidden fontSize="small" />
              </ListItemIcon>
              {t(`account.${key}`)}
            </MenuItem>
          ))}
          <Divider component="li" role="separator" />
          <MenuItem
            disabled={logout.isPending}
            onClick={() => {
              logout.mutate();
            }}
            className="min-h-11"
          >
            <ListItemIcon>
              <LogoutOutlined aria-hidden fontSize="small" />
            </ListItemIcon>
            {logout.isPending ? t('account.signingOut') : t('account.signOut')}
          </MenuItem>
        </MenuList>
      </Popover>
    </>
  );
}
