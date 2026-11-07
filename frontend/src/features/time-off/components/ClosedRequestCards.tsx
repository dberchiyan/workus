import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { formatPeriod, fullName } from '../format';
import type { ManagedRequest } from '../types';
import { RequestPerson } from './RequestPerson';
import { TimeOffStatusChip, TimeOffTypeChip } from './TimeOffChips';

/** Phones: the table becomes stacked items (ux.md → Patterns). */
export function ClosedRequestCards({ requests }: { requests: readonly ManagedRequest[] }) {
  const { t, i18n } = useTranslation('timeOff');
  return (
    <ul className="m-0 flex list-none flex-col divide-y divide-divider p-0">
      {requests.map((request) => {
        const period = formatPeriod(request.startDate, request.endDate, i18n.language);
        const type = t(`types.${request.type}`);
        return (
          <li key={request.id} className="flex flex-col gap-3 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <RequestPerson
                request={request}
                label={t('manage.open', { name: fullName(request.employee), type, period })}
              />
              <TimeOffStatusChip status={request.status} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <TimeOffTypeChip type={request.type} />
              <Typography variant="body2" className="app-tabular">
                {period} · {t('requests.days', { count: request.days })}
              </Typography>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
