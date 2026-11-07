import ChatBubbleOutlineOutlined from '@mui/icons-material/ChatBubbleOutlineOutlined';
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { daysSince, formatPeriod, fullName } from '../format';
import type { ManagedRequest, TimeOffDecision } from '../types';
import { RequestPerson } from './RequestPerson';
import { ResponsibleSummary } from './ResponsibleSummary';
import { TYPE_VISUALS } from './timeOffVisuals';

/** A request waiting longer than this is called out. */
const LONG_WAIT_DAYS = 2;

export interface PendingRequestCardProps {
  request: ManagedRequest;
  now: number;
  busy: boolean;
  onDecide: (request: ManagedRequest, decision: TimeOffDecision) => void;
}

/** One request waiting for a decision: who, what, how long it waits, and the decision buttons. */
export function PendingRequestCard({ request, now, busy, onDecide }: PendingRequestCardProps) {
  const { t, i18n } = useTranslation('timeOff');
  const { icon: Icon, tone } = TYPE_VISUALS[request.type];
  const waited = daysSince(request.createdAt, now);
  const period = formatPeriod(request.startDate, request.endDate, i18n.language);
  const type = t(`types.${request.type}`);
  return (
    <Card variant="outlined" component="article" className="flex h-full flex-col gap-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <RequestPerson
          request={request}
          label={t('manage.open', { name: fullName(request.employee), type, period })}
        />
        <Typography
          variant="caption"
          color={waited > LONG_WAIT_DAYS ? 'error' : 'textSecondary'}
          className="app-tabular flex shrink-0 items-center gap-1"
        >
          <ScheduleOutlined aria-hidden fontSize="inherit" />
          {waited === 0 ? t('manage.waitedToday') : t('manage.waited', { count: waited })}
        </Typography>
      </div>
      <div className="flex items-center gap-3 rounded-md bg-background p-3">
        <span
          aria-hidden
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-md text-avatar-text',
            tone,
          )}
        >
          <Icon fontSize="small" />
        </span>
        <span className="flex min-w-0 flex-col">
          <Typography variant="subtitle2" component="span">
            {type} · {t('requests.days', { count: request.days })}
          </Typography>
          <Typography variant="body2" color="textSecondary" className="app-tabular truncate">
            {period}
          </Typography>
        </span>
      </div>
      {request.note && (
        <Typography
          variant="body2"
          color="textSecondary"
          className="line-clamp-2 border-l-2 border-divider pl-3 [overflow-wrap:anywhere]"
        >
          {request.note}
        </Typography>
      )}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-3">
          <ResponsibleSummary people={request.responsibles} />
          {request.commentCount > 0 && (
            <Typography
              variant="caption"
              color="textSecondary"
              className="app-tabular flex items-center gap-1"
            >
              <ChatBubbleOutlineOutlined aria-hidden fontSize="inherit" />
              <span aria-hidden>{request.commentCount}</span>
              <span className="sr-only">
                {t('manage.commentCount', { count: request.commentCount })}
              </span>
            </Typography>
          )}
        </span>
        {request.can.approve ? (
          <span className="flex gap-2">
            <Button
              size="small"
              variant="outlined"
              color="error"
              disabled={busy}
              aria-label={t('manage.rejectFor', { name: fullName(request.employee), type, period })}
              onClick={() => {
                onDecide(request, 'reject');
              }}
            >
              {t('manage.reject')}
            </Button>
            <Button
              size="small"
              variant="contained"
              disabled={busy}
              aria-label={t('manage.approveFor', {
                name: fullName(request.employee),
                type,
                period,
              })}
              onClick={() => {
                onDecide(request, 'approve');
              }}
            >
              {t('manage.approve')}
            </Button>
          </span>
        ) : (
          <Typography variant="caption" color="textSecondary">
            {t('manage.notYours')}
          </Typography>
        )}
      </div>
    </Card>
  );
}
