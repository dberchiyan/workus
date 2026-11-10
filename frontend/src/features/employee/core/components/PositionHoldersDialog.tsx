import CloseOutlined from '@mui/icons-material/CloseOutlined';
import WorkOutlineOutlined from '@mui/icons-material/WorkOutlineOutlined';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Pagination from '@mui/material/Pagination';
import Typography from '@mui/material/Typography';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RowSkeleton } from '@/shared/components/RowSkeleton';
import { cn } from '@/shared/lib/cn';
import { todayUtcIso } from '@/shared/lib/utcDay';
import { formatCalendarDate, formatTenure } from '../format';
import { HOLDERS_PAGE_SIZE, usePositionHolders } from '../hooks/useCompanyStructure';
import type { EmployeeListItem } from '../types';
import { EmployeeIdentity } from './EmployeeIdentity';

const DAY_MS = 86_400_000;

export interface PositionHoldersDialogProps {
  open: boolean;
  departmentName: string;
  position: { id: string; title: string; employeeCount: number };
  onClose: () => void;
  onExited: () => void;
}

/** Start date and time in the company; a start still ahead says when. */
function Tenure({ startDate }: { startDate: string }) {
  const { t, i18n } = useTranslation('employee');
  const today = todayUtcIso();
  const date = formatCalendarDate(startDate, i18n.language);
  if (startDate > today) {
    return (
      <Typography variant="caption" color="textSecondary" className="app-tabular">
        {t('structure.holders.starts', { date })}
      </Typography>
    );
  }
  const days = Math.round((Date.parse(today) - Date.parse(startDate)) / DAY_MS);
  return (
    <span className="flex flex-col items-end text-right">
      <Typography variant="body2" component="span" className="app-tabular">
        {formatTenure(days, i18n.language)}
      </Typography>
      <Typography variant="caption" component="span" color="textSecondary" className="app-tabular">
        {t('structure.holders.since', { date })}
      </Typography>
    </span>
  );
}

function HolderRow({ employee }: { employee: EmployeeListItem }) {
  return (
    // `relative`: the name's link stretches over the whole row.
    <li className="relative flex min-h-16 items-center gap-4 rounded-lg px-3 py-2 transition-colors hover:bg-badge-neutral-background/60">
      <span className="min-w-0 flex-1">
        <EmployeeIdentity employee={employee} isCompact />
      </span>
      <span className="hidden shrink-0 min-[25rem]:flex">
        <Tenure startDate={employee.startDate} />
      </span>
    </li>
  );
}

/**
 * Who holds a position today, five a page, each linking to their profile. Mounted with each
 * opening (parent `key`), so it always starts on the first page.
 */
export function PositionHoldersDialog({
  open,
  departmentName,
  position,
  onClose,
  onExited,
}: PositionHoldersDialogProps) {
  const { t, i18n } = useTranslation('employee');
  const titleId = useId();
  const [page, setPage] = useState(0);
  const query = usePositionHolders(position.id, page);
  const number = (value: number) => new Intl.NumberFormat(i18n.language).format(value);
  const total = query.data?.totalElements ?? position.employeeCount;
  const pages = Math.ceil(total / HOLDERS_PAGE_SIZE);
  const from = page * HOLDERS_PAGE_SIZE + 1;
  const to = Math.min(total, from + HOLDERS_PAGE_SIZE - 1);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby={titleId}
      slotProps={{ transition: { onExited } }}
    >
      <div className="flex items-start gap-3 border-b border-divider px-4 py-4 sm:px-6">
        <span
          aria-hidden
          className="flex size-11 shrink-0 items-center justify-center rounded-md bg-badge-active-background text-badge-active-text"
        >
          <WorkOutlineOutlined />
        </span>
        <div className="flex min-w-0 flex-1 flex-col pt-0.5">
          <Typography id={titleId} variant="h6" component="h2" className="truncate">
            {position.title}
          </Typography>
          <Typography variant="body2" color="textSecondary" className="app-tabular truncate">
            {t('structure.holders.subtitle', {
              department: departmentName,
              count: total,
              people: number(total),
            })}
          </Typography>
        </div>
        <IconButton
          aria-label={t('structure.holders.close')}
          onClick={onClose}
          className="-mt-1 -mr-2"
        >
          <CloseOutlined />
        </IconButton>
      </div>

      <DialogContent className="px-2 py-2 sm:px-3">
        {query.isPending ? (
          <div role="status" aria-label={t('structure.holders.loading')} className="flex flex-col">
            {Array.from({ length: Math.min(HOLDERS_PAGE_SIZE, Math.max(1, total)) }, (_, index) => (
              <RowSkeleton key={index} className="min-h-16 px-3" />
            ))}
          </div>
        ) : query.isError ? (
          <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
            <Typography variant="body2" color="textSecondary">
              {t('structure.holders.error')}
            </Typography>
            <Button onClick={() => void query.refetch()}>{t('structure.retry')}</Button>
          </div>
        ) : query.data.content.length === 0 ? (
          <Typography variant="body2" color="textSecondary" className="px-4 py-10 text-center">
            {t('structure.holders.empty')}
          </Typography>
        ) : (
          <ul
            aria-busy={query.isPlaceholderData}
            className={cn(
              'app-value-in m-0 flex list-none flex-col p-0 transition-opacity',
              // Five rows' height on every page, so the last one does not shrink the dialog.
              pages > 1 && 'min-h-80',
              query.isPlaceholderData && 'opacity-60',
            )}
            key={page}
          >
            {query.data.content.map((employee) => (
              <HolderRow key={employee.id} employee={employee} />
            ))}
          </ul>
        )}
      </DialogContent>

      {pages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-divider px-4 py-2 sm:px-6">
          <Typography variant="caption" color="textSecondary" className="app-tabular">
            {from === to
              ? t('structure.holders.single', { index: number(from), count: number(total) })
              : t('structure.holders.range', {
                  from: number(from),
                  to: number(to),
                  count: number(total),
                })}
          </Typography>
          <Pagination
            shape="rounded"
            color="primary"
            count={pages}
            page={Math.min(page + 1, pages)}
            siblingCount={0}
            onChange={(_event, value) => {
              setPage(value - 1);
            }}
            aria-label={t('structure.holders.pages')}
            getItemAriaLabel={(type, value, selected) =>
              type === 'page'
                ? t(selected ? 'structure.holders.currentPage' : 'structure.holders.page', {
                    page: value,
                  })
                : type === 'previous'
                  ? t('structure.holders.previous')
                  : t('structure.holders.next')
            }
          />
        </div>
      )}
    </Dialog>
  );
}
