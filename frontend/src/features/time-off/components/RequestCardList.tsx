import KeyboardArrowDownOutlined from '@mui/icons-material/KeyboardArrowDownOutlined';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { formatDay, formatPeriod } from '../format';
import type { TimeOffRequest } from '../types';
import { RequestDetails } from './RequestDetails';
import { ResponsibleSummary } from './ResponsibleSummary';
import { TimeOffStatusChip, TimeOffTypeChip } from './TimeOffChips';

export interface RequestCardListProps {
  requests: readonly TimeOffRequest[];
  expandedId: string | null;
  onToggle: (requestId: string) => void;
  onCancel: (request: TimeOffRequest) => void;
}

/** Phones: the table becomes stacked items with the same details (ux.md → Patterns). */
export function RequestCardList({
  requests,
  expandedId,
  onToggle,
  onCancel,
}: RequestCardListProps) {
  const { t, i18n } = useTranslation('timeOff');
  return (
    <ul className="m-0 flex list-none flex-col divide-y divide-divider p-0">
      {requests.map((request) => {
        const isOpen = expandedId === request.id;
        const detailsId = `time-off-request-card-${request.id}`;
        const period = formatPeriod(request.startDate, request.endDate, i18n.language);
        const type = t(`types.${request.type}`);
        return (
          <li key={request.id} className="flex flex-col gap-2 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <TimeOffTypeChip type={request.type} />
              <TimeOffStatusChip status={request.status} />
            </div>
            <Typography variant="body2" className="app-tabular">
              {period} · {t('requests.days', { count: request.days })}
            </Typography>
            <div className="flex items-center justify-between gap-2">
              <Typography variant="caption" color="textSecondary" className="app-tabular">
                {t('requests.columns.created')}:{' '}
                {formatDay(request.createdAt.slice(0, 10), i18n.language)}
              </Typography>
              <ResponsibleSummary people={request.responsibles} />
            </div>
            <div>
              <Button
                size="small"
                aria-expanded={isOpen}
                aria-controls={isOpen ? detailsId : undefined}
                aria-label={t(isOpen ? 'requests.hideDetails' : 'requests.showDetails', {
                  type,
                  period,
                })}
                endIcon={
                  <KeyboardArrowDownOutlined aria-hidden className={cn(isOpen && 'rotate-180')} />
                }
                onClick={() => {
                  onToggle(request.id);
                }}
              >
                {t('requests.columns.details')}
              </Button>
            </div>
            <Collapse in={isOpen} unmountOnExit>
              <div id={detailsId} className="pt-1">
                <RequestDetails request={request} onCancel={onCancel} />
              </div>
            </Collapse>
          </li>
        );
      })}
    </ul>
  );
}
