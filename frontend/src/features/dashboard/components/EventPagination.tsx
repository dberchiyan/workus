import Pagination from '@mui/material/Pagination';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { EVENTS_PAGE_SIZE } from '../types';

export interface EventPaginationProps {
  /** Labels the page buttons ("Reviews pages"). */
  label: string;
  page: number;
  total: number;
  onPage: (page: number) => void;
}

/** "6–10 of 14" and numbered pages under a card's rows; nothing when one page holds them all. */
export function EventPagination({ label, page, total, onPage }: EventPaginationProps) {
  const { t, i18n } = useTranslation('dashboard');
  const pages = Math.ceil(total / EVENTS_PAGE_SIZE);
  if (pages <= 1) {
    return null;
  }
  const number = (value: number) => new Intl.NumberFormat(i18n.language).format(value);
  const from = page * EVENTS_PAGE_SIZE + 1;
  const to = Math.min(total, from + EVENTS_PAGE_SIZE - 1);
  return (
    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-divider px-4 py-2 sm:px-5">
      <Typography variant="caption" color="textSecondary" className="app-tabular">
        {from === to
          ? t('events.pagination.single', { index: number(from), count: number(total) })
          : t('events.pagination.range', {
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
          onPage(value - 1);
        }}
        aria-label={label}
        getItemAriaLabel={(type, value, selected) =>
          type === 'page'
            ? t(selected ? 'events.pagination.current' : 'events.pagination.page', { page: value })
            : type === 'previous'
              ? t('events.pagination.previous')
              : t('events.pagination.next')
        }
      />
    </div>
  );
}
