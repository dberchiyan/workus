import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { formatCount, formatDateTime, formatPeriod } from '../format';
import { useEmployeeBalances } from '../hooks/useTimeOffQueries';
import type { ManagedRequest } from '../types';
import { PersonLine } from './PersonLine';
import { TYPE_VISUALS } from './timeOffVisuals';

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <Typography variant="caption" component="dt" color="textSecondary">
        {label}
      </Typography>
      <Typography variant="body2" component="dd" className="app-tabular m-0">
        {children}
      </Typography>
    </div>
  );
}

export interface RequestSummaryProps {
  request: ManagedRequest;
  viewerId: string;
}

/** What is requested, the employee's balance for that type, the note and who decides. */
export function RequestSummary({ request, viewerId }: RequestSummaryProps) {
  const { t, i18n } = useTranslation('timeOff');
  const locale = i18n.language;
  const { icon: Icon, tone } = TYPE_VISUALS[request.type];
  const balances = useEmployeeBalances(request.employee.id);
  const balance = balances.data?.content.find((item) => item.type === request.type);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-md text-avatar-text',
            tone,
          )}
        >
          <Icon />
        </span>
        <div className="flex min-w-0 flex-col">
          <Typography variant="subtitle1" component="p">
            {t(`types.${request.type}`)}
          </Typography>
          <Typography variant="body2" color="textSecondary" className="app-tabular">
            {formatPeriod(request.startDate, request.endDate, locale)}
          </Typography>
        </div>
      </div>
      <dl className="m-0 grid grid-cols-2 gap-4">
        <Fact label={t('manage.dialog.days')}>{t('requests.days', { count: request.days })}</Fact>
        <Fact label={t('manage.dialog.created')}>{formatDateTime(request.createdAt, locale)}</Fact>
        <Fact label={t('manage.dialog.available')}>
          {!balance
            ? '—'
            : balance.available === null
              ? t('create.unlimited')
              : t('manage.dialog.availableValue', {
                  available: formatCount(balance.available, locale),
                  allowance: formatCount(balance.allowance ?? 0, locale),
                })}
        </Fact>
        <Fact label={t('manage.dialog.used')}>
          {balance
            ? t('manage.dialog.usedValue', {
                count: balance.used,
                formatted: formatCount(balance.used, locale),
              })
            : '—'}
        </Fact>
      </dl>
      {request.note && (
        <div className="flex flex-col gap-1">
          <Typography variant="overline" component="h3" color="textSecondary">
            {t('manage.dialog.note')}
          </Typography>
          <Typography
            variant="body2"
            className="rounded-md border-l-2 border-primary bg-background px-3 py-2 [overflow-wrap:anywhere]"
          >
            {request.note}
          </Typography>
        </div>
      )}
      <div className="flex flex-col gap-3">
        <Typography variant="overline" component="h3" color="textSecondary">
          {t('details.responsible', { count: request.responsibles.length })}
        </Typography>
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
      </div>
    </div>
  );
}
