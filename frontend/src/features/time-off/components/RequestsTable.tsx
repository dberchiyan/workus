import KeyboardArrowDownOutlined from '@mui/icons-material/KeyboardArrowDownOutlined';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { formatDay, formatPeriod } from '../format';
import type { TimeOffRequest } from '../types';
import { RequestDetails } from './RequestDetails';
import { ResponsibleSummary } from './ResponsibleSummary';
import { TimeOffStatusChip, TimeOffTypeChip } from './TimeOffChips';

/** Shares of a 12-part row, so free space is spread over every column, not one. */
const COLUMNS = [
  { key: 'type', width: 'w-2/12' },
  { key: 'period', width: 'w-3/12' },
  { key: 'created', width: 'w-2/12' },
  { key: 'responsible', width: 'w-2/12' },
  { key: 'status', width: 'w-2/12' },
  { key: 'details', width: 'w-1/12' },
] as const;

export interface RequestsTableProps {
  requests: readonly TimeOffRequest[];
  expandedId: string | null;
  onToggle: (requestId: string) => void;
  onCancel: (request: TimeOffRequest) => void;
}

/** Tablet and desktop: one row per request; the last cell expands its details below the row. */
export function RequestsTable({ requests, expandedId, onToggle, onCancel }: RequestsTableProps) {
  const { t, i18n } = useTranslation('timeOff');
  return (
    <Table size="small" className="table-fixed">
      <caption className="sr-only">{t('requests.caption')}</caption>
      <colgroup>
        {COLUMNS.map((column) => (
          <col key={column.key} className={column.width} />
        ))}
      </colgroup>
      <TableHead>
        <TableRow>
          <TableCell scope="col">{t('requests.columns.type')}</TableCell>
          <TableCell scope="col">{t('requests.columns.period')}</TableCell>
          <TableCell scope="col">{t('requests.columns.created')}</TableCell>
          <TableCell scope="col">{t('requests.columns.responsible')}</TableCell>
          <TableCell scope="col">{t('requests.columns.status')}</TableCell>
          <TableCell scope="col" align="center">
            {t('requests.columns.details')}
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {requests.map((request) => {
          const isOpen = expandedId === request.id;
          const detailsId = `time-off-request-${request.id}`;
          const period = formatPeriod(request.startDate, request.endDate, i18n.language);
          const type = t(`types.${request.type}`);
          return (
            <Fragment key={request.id}>
              <TableRow selected={isOpen} className={cn(isOpen && '[&>td]:border-b-0')}>
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
                  <Typography variant="body2" className="app-tabular">
                    {formatDay(request.createdAt.slice(0, 10), i18n.language)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <ResponsibleSummary people={request.responsibles} />
                </TableCell>
                <TableCell>
                  <TimeOffStatusChip status={request.status} />
                </TableCell>
                <TableCell align="center" padding="none">
                  <IconButton
                    aria-expanded={isOpen}
                    aria-controls={isOpen ? detailsId : undefined}
                    aria-label={t(isOpen ? 'requests.hideDetails' : 'requests.showDetails', {
                      type,
                      period,
                    })}
                    onClick={() => {
                      onToggle(request.id);
                    }}
                  >
                    <KeyboardArrowDownOutlined aria-hidden className={cn(isOpen && 'rotate-180')} />
                  </IconButton>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={COLUMNS.length} className={cn('p-0', !isOpen && 'border-b-0')}>
                  <Collapse in={isOpen} unmountOnExit>
                    <div id={detailsId} className="bg-background p-4">
                      <RequestDetails request={request} onCancel={onCancel} />
                    </div>
                  </Collapse>
                </TableCell>
              </TableRow>
            </Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
}
