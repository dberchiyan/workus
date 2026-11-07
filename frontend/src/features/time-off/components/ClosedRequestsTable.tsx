import ChatBubbleOutlineOutlined from '@mui/icons-material/ChatBubbleOutlineOutlined';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { formatDateTime, formatPeriod, fullName } from '../format';
import type { ManagedRequest } from '../types';
import { RequestPerson } from './RequestPerson';
import { TimeOffStatusChip, TimeOffTypeChip } from './TimeOffChips';

/** Shares of a 12-part row, so free space is spread over every column. */
const COLUMNS = [
  { key: 'employee', width: 'w-3/12' },
  { key: 'type', width: 'w-2/12' },
  { key: 'period', width: 'w-2/12' },
  { key: 'status', width: 'w-2/12' },
  { key: 'changed', width: 'w-2/12' },
  { key: 'comments', width: 'w-1/12' },
] as const;

/** Tablet and desktop: closed requests, the latest change first. */
export function ClosedRequestsTable({ requests }: { requests: readonly ManagedRequest[] }) {
  const { t, i18n } = useTranslation('timeOff');
  return (
    <Table size="small" className="table-fixed">
      <caption className="sr-only">{t('manage.closed.caption')}</caption>
      <colgroup>
        {COLUMNS.map((column) => (
          <col key={column.key} className={column.width} />
        ))}
      </colgroup>
      <TableHead>
        <TableRow>
          {COLUMNS.map((column) => (
            <TableCell
              key={column.key}
              scope="col"
              align={column.key === 'comments' ? 'center' : 'left'}
            >
              {t(`manage.closed.columns.${column.key}`)}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {requests.map((request) => {
          const period = formatPeriod(request.startDate, request.endDate, i18n.language);
          const type = t(`types.${request.type}`);
          const lastEvent = request.history.at(-1);
          return (
            <TableRow key={request.id} hover>
              <TableCell>
                <RequestPerson
                  request={request}
                  label={t('manage.open', { name: fullName(request.employee), type, period })}
                />
              </TableCell>
              <TableCell>
                <TimeOffTypeChip type={request.type} />
              </TableCell>
              <TableCell>
                <span className="flex flex-col">
                  <Typography variant="body2" className="app-tabular truncate">
                    {period}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {t('requests.days', { count: request.days })}
                  </Typography>
                </span>
              </TableCell>
              <TableCell>
                <TimeOffStatusChip status={request.status} />
              </TableCell>
              <TableCell>
                <span className="flex min-w-0 flex-col">
                  <Typography variant="body2" className="truncate">
                    {lastEvent?.actor ? fullName(lastEvent.actor) : '—'}
                  </Typography>
                  {lastEvent && (
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      className="app-tabular truncate"
                    >
                      {formatDateTime(lastEvent.occurredAt, i18n.language)}
                    </Typography>
                  )}
                </span>
              </TableCell>
              <TableCell align="center">
                {request.commentCount > 0 ? (
                  <Typography
                    variant="body2"
                    component="span"
                    className="app-tabular inline-flex items-center gap-1"
                  >
                    <ChatBubbleOutlineOutlined aria-hidden fontSize="inherit" />
                    <span aria-hidden>{request.commentCount}</span>
                    <span className="sr-only">
                      {t('manage.commentCount', { count: request.commentCount })}
                    </span>
                  </Typography>
                ) : (
                  <Typography variant="body2" color="textSecondary" component="span">
                    <span aria-hidden>—</span>
                    <span className="sr-only">{t('manage.commentCount', { count: 0 })}</span>
                  </Typography>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
