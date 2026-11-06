import LogoutOutlined from '@mui/icons-material/LogoutOutlined';
import Avatar from '@mui/material/Avatar';
import ButtonBase from '@mui/material/ButtonBase';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser, useLogout } from '@/features/auth';

/** Name, role and avatar; opens a menu with Sign out. */
export function UserMenu() {
  const { t } = useTranslation('shell');
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const menuId = useId();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  if (!user) {
    return null;
  }
  const fullName = `${user.firstName} ${user.lastName}`;
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;

  return (
    <>
      <ButtonBase
        aria-label={t('account.open', { name: fullName })}
        aria-haspopup="menu"
        aria-controls={anchor ? menuId : undefined}
        aria-expanded={anchor ? true : undefined}
        onClick={(event) => {
          setAnchor(event.currentTarget);
        }}
        className="min-h-11 gap-3 rounded-sm px-2"
      >
        <span className="hidden flex-col items-end sm:flex">
          <Typography variant="subtitle2" component="span">
            {fullName}
          </Typography>
          <Typography variant="caption" component="span" color="text.secondary">
            {t(`role.${user.role}`)}
          </Typography>
        </span>
        <Avatar className="size-9 bg-primary text-primary-contrast-text">
          <Typography variant="subtitle2" component="span">
            {initials}
          </Typography>
        </Avatar>
      </ButtonBase>
      <Menu
        id={menuId}
        anchorEl={anchor}
        open={anchor !== null}
        onClose={() => {
          setAnchor(null);
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
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
      </Menu>
    </>
  );
}
