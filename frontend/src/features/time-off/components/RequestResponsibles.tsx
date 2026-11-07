import EditOutlined from '@mui/icons-material/EditOutlined';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ManagedRequest } from '../types';
import { EditRequestResponsiblesDialog } from './EditRequestResponsiblesDialog';
import { PersonLine } from './PersonLine';

export interface RequestResponsiblesProps {
  request: ManagedRequest;
  viewerId: string;
}

/** Who decides the request ("You" marked); any admin may change it while it is pending. */
export function RequestResponsibles({ request, viewerId }: RequestResponsiblesProps) {
  const { t } = useTranslation('timeOff');
  const [open, setOpen] = useState(false);
  const [opening, setOpening] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <Typography variant="overline" component="h3" color="textSecondary">
          {t('details.responsible', { count: request.responsibles.length })}
        </Typography>
        {request.status === 'PENDING' && (
          <Button
            ref={buttonRef}
            size="small"
            startIcon={<EditOutlined aria-hidden />}
            onClick={() => {
              setOpening((count) => count + 1);
              setOpen(true);
            }}
            aria-label={t('manage.responsibles.edit')}
          >
            {t('manage.responsibles.editShort')}
          </Button>
        )}
      </div>
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {request.responsibles.map((person) => (
          <li key={person.id} className="flex items-center justify-between gap-2">
            <PersonLine person={person} />
            {person.id === viewerId && (
              <Typography
                variant="caption"
                className="rounded-full bg-badge-active-background px-2 text-badge-active-text"
              >
                {t('manage.dialog.you')}
              </Typography>
            )}
          </li>
        ))}
      </ul>
      {opening > 0 && (
        <EditRequestResponsiblesDialog
          key={opening}
          request={request}
          open={open}
          onClose={() => {
            setOpen(false);
          }}
          onExited={() => buttonRef.current?.focus()}
        />
      )}
    </div>
  );
}
