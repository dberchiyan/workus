import EditOutlined from '@mui/icons-material/EditOutlined';
import GroupOutlined from '@mui/icons-material/GroupOutlined';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { InitialsAvatar } from '@/shared/components/InitialsAvatar';
import type { EmployeeProfile } from '../types';
import { EditResponsiblesDialog } from './EditResponsiblesDialog';

export function ResponsiblesCard({ employee }: { employee: EmployeeProfile }) {
  const { t } = useTranslation('employee');
  const [isEditing, setIsEditing] = useState(false);
  // Each opening starts from the profile as read (and its version).
  const [opening, setOpening] = useState(0);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  return (
    <Card variant="outlined" className="flex-1">
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="-my-2 flex items-center justify-between gap-2">
          <Typography
            variant="subtitle2"
            component="h2"
            color="textSecondary"
            className="flex items-center gap-2"
          >
            <GroupOutlined aria-hidden fontSize="small" />
            {t('profile.responsible.title')}
          </Typography>
          <Tooltip title={t('profile.responsible.edit')}>
            <IconButton
              ref={editButtonRef}
              aria-label={t('profile.responsible.edit')}
              onClick={() => {
                setOpening((count) => count + 1);
                setIsEditing(true);
              }}
              className="-mr-2"
            >
              <EditOutlined aria-hidden fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>
        {employee.responsibles.length === 0 ? (
          <Typography variant="body2" color="textSecondary">
            {t('profile.responsible.none')}
          </Typography>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {employee.responsibles.map((person) => (
              <li key={person.id} className="flex min-w-0 items-center gap-3">
                <InitialsAvatar
                  id={person.id}
                  firstName={person.firstName}
                  lastName={person.lastName}
                />
                <span className="flex min-w-0 flex-col">
                  <Typography variant="subtitle2" component="span" className="truncate">
                    {`${person.firstName} ${person.lastName}`}
                  </Typography>
                  <Typography
                    variant="caption"
                    component="span"
                    color="textSecondary"
                    className="truncate"
                  >
                    {person.positionTitle ?? t(`profile.roles.${person.role}`)}
                  </Typography>
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <EditResponsiblesDialog
        key={opening}
        employee={employee}
        open={isEditing}
        onClose={() => {
          setIsEditing(false);
        }}
        onExited={() => {
          // Dialog closed → focus returns to its trigger (ux.md → Focus moves with the UI).
          editButtonRef.current?.focus();
        }}
      />
    </Card>
  );
}
