import EditOutlined from '@mui/icons-material/EditOutlined';
import EventBusyOutlined from '@mui/icons-material/EventBusyOutlined';
import KeyOutlined from '@mui/icons-material/KeyOutlined';
import MoreVertOutlined from '@mui/icons-material/MoreVertOutlined';
import PersonRemoveOutlined from '@mui/icons-material/PersonRemoveOutlined';
import UndoOutlined from '@mui/icons-material/UndoOutlined';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { EmployeeProfile } from '../types';
import { CancelTerminationDialog } from './CancelTerminationDialog';
import { EditProfileDialog } from './EditProfileDialog';
import { ResetPasswordDialog } from './ResetPasswordDialog';
import { TerminateDialog } from './TerminateDialog';

type DialogKind = 'edit' | 'resetPassword' | 'terminate' | 'cancelTermination';

/**
 * One ⋮ menu: Edit profile, Reset password, then Terminate (or Change / Cancel termination). Dialogs remount on
 * each opening; on close, focus returns to the menu button.
 */
export function ProfileActions({ employee }: { employee: EmployeeProfile }) {
  const { t } = useTranslation('employee');
  const menuId = useId();
  const menuButtonId = useId();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [dialog, setDialog] = useState<DialogKind | null>(null);
  const [opening, setOpening] = useState(0);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusTo = useRef<HTMLElement | null>(null);
  const isTerminated = employee.termination !== null;
  const name = `${employee.firstName} ${employee.lastName}`;

  const open = (kind: DialogKind, trigger: HTMLElement | null): void => {
    returnFocusTo.current = trigger;
    setMenuAnchor(null);
    setOpening((count) => count + 1);
    setDialog(kind);
  };
  const close = (): void => {
    setDialog(null);
  };
  const exited = (): void => {
    returnFocusTo.current?.focus();
  };

  return (
    <div className="flex items-center">
      <Tooltip title={t('profile.actions.more')}>
        <IconButton
          ref={menuButtonRef}
          id={menuButtonId}
          aria-label={t('profile.actions.moreFor', { name })}
          aria-haspopup="menu"
          aria-controls={menuAnchor ? menuId : undefined}
          aria-expanded={menuAnchor ? true : undefined}
          onClick={(event) => {
            setMenuAnchor(event.currentTarget);
          }}
        >
          <MoreVertOutlined aria-hidden />
        </IconButton>
      </Tooltip>
      <Menu
        id={menuId}
        anchorEl={menuAnchor}
        open={menuAnchor !== null}
        onClose={() => {
          setMenuAnchor(null);
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ list: { 'aria-labelledby': menuButtonId } }}
      >
        <MenuItem
          onClick={() => {
            open('edit', menuButtonRef.current);
          }}
        >
          <ListItemIcon>
            <EditOutlined aria-hidden fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('profile.actions.edit')}</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            open('resetPassword', menuButtonRef.current);
          }}
        >
          <ListItemIcon>
            <KeyOutlined aria-hidden fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('profile.actions.resetPassword')}</ListItemText>
        </MenuItem>
        {isTerminated
          ? [
              <MenuItem
                key="change"
                onClick={() => {
                  open('terminate', menuButtonRef.current);
                }}
              >
                <ListItemIcon>
                  <EventBusyOutlined aria-hidden fontSize="small" />
                </ListItemIcon>
                <ListItemText>{t('profile.actions.changeTermination')}</ListItemText>
              </MenuItem>,
              <MenuItem
                key="cancel"
                onClick={() => {
                  open('cancelTermination', menuButtonRef.current);
                }}
              >
                <ListItemIcon>
                  <UndoOutlined aria-hidden fontSize="small" />
                </ListItemIcon>
                <ListItemText>{t('profile.actions.cancelTermination')}</ListItemText>
              </MenuItem>,
            ]
          : [
              <MenuItem
                key="terminate"
                className="text-error"
                onClick={() => {
                  open('terminate', menuButtonRef.current);
                }}
              >
                <ListItemIcon className="text-inherit">
                  <PersonRemoveOutlined aria-hidden fontSize="small" />
                </ListItemIcon>
                <ListItemText>{t('profile.actions.terminate')}</ListItemText>
              </MenuItem>,
            ]}
      </Menu>
      <EditProfileDialog
        key={`edit-${opening}`}
        employee={employee}
        open={dialog === 'edit'}
        onClose={close}
        onExited={exited}
      />
      <ResetPasswordDialog
        key={`reset-${opening}`}
        employee={employee}
        open={dialog === 'resetPassword'}
        onClose={close}
        onExited={exited}
      />
      <TerminateDialog
        key={`terminate-${opening}`}
        employee={employee}
        open={dialog === 'terminate'}
        onClose={close}
        onExited={exited}
      />
      <CancelTerminationDialog
        key={`cancel-${opening}`}
        employee={employee}
        open={dialog === 'cancelTermination'}
        onClose={close}
        onExited={exited}
      />
    </div>
  );
}
