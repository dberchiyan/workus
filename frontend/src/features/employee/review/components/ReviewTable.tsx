import ButtonBase from '@mui/material/ButtonBase';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { formatMoney } from '@/shared/lib/money';
import { formatReviewDate } from '../format';
import type { Review } from '../types';
import { ReviewPeople } from './ReviewPeople';
import { type OnReviewAction, ReviewDeleteButton, ReviewEditButton } from './ReviewRowActions';
import { ReviewStatusChip } from './ReviewStatusChip';

/**
 * Columns with known content get fixed widths (rem); Title and Responsible share the rest, so
 * nothing in Date/Status/Salary is ever cut (one-off geometry for this table).
 */
const COLUMNS = [
  { key: 'title', width: undefined },
  { key: 'date', width: 'w-32' },
  { key: 'status', width: 'w-32' },
  { key: 'salary', width: 'w-26' },
  { key: 'responsible', width: undefined },
  { key: 'edit', width: 'w-12' },
  { key: 'delete', width: 'w-12' },
] as const;

export interface ReviewTableProps {
  reviews: readonly Review[];
  onAction: OnReviewAction;
}

/** Tablet and desktop: Title (opens the review), Date, Status, Salary, Responsible, Edit, Delete. */
export function ReviewTable({ reviews, onAction }: ReviewTableProps) {
  const { t, i18n } = useTranslation('review');
  return (
    <Table size="small" className="table-fixed">
      <caption className="sr-only">{t('table.caption')}</caption>
      <colgroup>
        {COLUMNS.map((column) => (
          <col key={column.key} {...(column.width ? { className: column.width } : {})} />
        ))}
      </colgroup>
      <TableHead>
        <TableRow>
          <TableCell scope="col">{t('table.title')}</TableCell>
          <TableCell scope="col">{t('table.date')}</TableCell>
          <TableCell scope="col">{t('table.status')}</TableCell>
          <TableCell scope="col" align="right">
            {t('table.salary')}
          </TableCell>
          <TableCell scope="col">{t('table.responsible')}</TableCell>
          <TableCell scope="col" align="center">
            <span className="sr-only">{t('actions.edit')}</span>
          </TableCell>
          <TableCell scope="col" align="center">
            <span className="sr-only">{t('actions.delete')}</span>
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {reviews.map((review) => (
          <TableRow key={review.id} hover className="h-14">
            <TableCell component="th" scope="row">
              <ButtonBase
                onClick={(event) => {
                  onAction('view', review, event.currentTarget);
                }}
                className="max-w-full justify-start rounded-sm text-left hover:underline"
              >
                <Typography
                  variant="subtitle2"
                  component="span"
                  className="truncate"
                  title={review.title}
                >
                  {review.title}
                </Typography>
              </ButtonBase>
            </TableCell>
            <TableCell>
              <Typography variant="body2" className="app-tabular whitespace-nowrap">
                {formatReviewDate(review.date, i18n.language)}
              </Typography>
            </TableCell>
            <TableCell>
              <ReviewStatusChip status={review.status} />
            </TableCell>
            <TableCell align="right">
              <Typography
                variant="body2"
                color={review.salary ? undefined : 'textSecondary'}
                className="app-tabular whitespace-nowrap"
              >
                {review.salary ? formatMoney(review.salary, i18n.language) : '—'}
                {!review.salary && <span className="sr-only">{t('list.noSalary')}</span>}
              </Typography>
            </TableCell>
            <TableCell>
              <ReviewPeople people={review.responsibles} />
            </TableCell>
            <TableCell align="center" padding="none">
              <ReviewEditButton review={review} onAction={onAction} />
            </TableCell>
            <TableCell align="center" padding="none">
              <ReviewDeleteButton review={review} onAction={onAction} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
