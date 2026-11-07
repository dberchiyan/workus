import InboxOutlined from '@mui/icons-material/InboxOutlined';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import TablePagination from '@mui/material/TablePagination';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { formatCount } from '../format';
import { useManagedRequests } from '../hooks/useManagedRequests';
import { CLOSED_PAGE_SIZES, type RequestsParams } from '../hooks/useRequestsParams';
import { CLOSED_STATUSES, type ClosedStatus } from '../types';
import { ClosedRequestCards } from './ClosedRequestCards';
import { ClosedRequestsTable } from './ClosedRequestsTable';
import { SectionHeader } from './SectionHeader';

const ALL = 'ALL';

export interface ClosedRequestsProps {
  params: RequestsParams;
  onStatus: (status: ClosedStatus | undefined) => void;
  onPage: (page: number, size: number) => void;
}

/** Approved, rejected and canceled requests, the latest change first, a page at a time. */
export function ClosedRequests({ params, onStatus, onPage }: ClosedRequestsProps) {
  const { t, i18n } = useTranslation('timeOff');
  const requests = useManagedRequests({
    state: 'CLOSED',
    type: params.type,
    status: params.status,
    mine: params.mine,
    search: params.search,
    page: params.page,
    size: params.size,
  });
  const items = requests.data?.content ?? [];
  const total = requests.data?.totalElements;

  return (
    <section aria-labelledby="requests-closed" className="flex flex-col gap-4">
      <SectionHeader
        id="requests-closed"
        title={t('manage.closed.title')}
        subtitle={t('manage.closed.subtitle')}
        count={total === undefined ? undefined : formatCount(total, i18n.language)}
      >
        <ToggleButtonGroup
          exclusive
          size="small"
          value={params.status ?? ALL}
          aria-label={t('manage.closed.statusFilter')}
          onChange={(_event, value: string | null) => {
            if (value !== null) {
              onStatus(CLOSED_STATUSES.find((status) => status === value));
            }
          }}
          className="flex-wrap"
        >
          <ToggleButton value={ALL}>{t('manage.closed.allStatuses')}</ToggleButton>
          {CLOSED_STATUSES.map((status) => (
            <ToggleButton key={status} value={status}>
              {t(`status.${status}`)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </SectionHeader>
      <Card variant="outlined" aria-busy={requests.isFetching}>
        {requests.isPending ? (
          <div className="flex flex-col gap-2 p-4">
            <span className="sr-only">{t('manage.loading')}</span>
            {[0, 1, 2, 3].map((row) => (
              <Skeleton key={row} variant="rounded" className="h-12" />
            ))}
          </div>
        ) : requests.isError ? (
          <div className="p-4">
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={() => void requests.refetch()}>
                  {t('requests.retry')}
                </Button>
              }
            >
              {t('manage.error')}
            </Alert>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <InboxOutlined aria-hidden className="text-text-secondary" fontSize="large" />
            <Typography variant="subtitle1" component="p">
              {t('manage.closed.empty')}
            </Typography>
          </div>
        ) : (
          // The card's own width decides (container query): table when it fits, else stacked.
          <div className="@container">
            <div className="hidden @[48rem]:block">
              <ClosedRequestsTable requests={items} />
            </div>
            <div className="@[48rem]:hidden">
              <ClosedRequestCards requests={items} />
            </div>
          </div>
        )}
        {total !== undefined && total > 0 && (
          <TablePagination
            component="div"
            className="border-t border-divider"
            count={total}
            page={params.page}
            rowsPerPage={params.size}
            rowsPerPageOptions={[...CLOSED_PAGE_SIZES]}
            onPageChange={(_event, page) => {
              onPage(page, params.size);
            }}
            onRowsPerPageChange={(event) => {
              onPage(0, Number(event.target.value));
            }}
            labelRowsPerPage={t('manage.closed.rowsPerPage')}
            labelDisplayedRows={({ from, to, count }) =>
              t('manage.closed.displayed', {
                from: formatCount(from, i18n.language),
                to: formatCount(to, i18n.language),
                count: formatCount(count, i18n.language),
              })
            }
          />
        )}
      </Card>
    </section>
  );
}
