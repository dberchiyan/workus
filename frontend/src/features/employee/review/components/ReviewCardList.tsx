import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { formatMoney } from '@/shared/lib/money';
import { formatReviewDate } from '../format';
import type { Review } from '../types';
import { ReviewPeople } from './ReviewPeople';
import { type OnReviewAction, ReviewDeleteButton, ReviewEditButton } from './ReviewRowActions';
import { ReviewStatusChip } from './ReviewStatusChip';

/** Phones: the table becomes stacked cards with the same actions (ux.md → Patterns). */
export function ReviewCardList({
  reviews,
  onAction,
}: {
  reviews: readonly Review[];
  onAction: OnReviewAction;
}) {
  const { t, i18n } = useTranslation('review');
  return (
    <ul className="m-0 flex list-none flex-col divide-y divide-divider p-0">
      {reviews.map((review) => (
        <li key={review.id} className="flex flex-col gap-2 px-4 py-3">
          <div className="flex items-start gap-2">
            <ButtonBase
              onClick={(event) => {
                onAction('view', review, event.currentTarget);
              }}
              className="min-w-0 flex-1 justify-start rounded-sm text-left"
            >
              <Typography variant="subtitle1" component="span" className="[overflow-wrap:anywhere]">
                {review.title}
              </Typography>
            </ButtonBase>
            <ReviewEditButton review={review} onAction={onAction} />
            <ReviewDeleteButton review={review} onAction={onAction} />
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <ReviewStatusChip status={review.status} />
            <Typography variant="body2" color="textSecondary" className="app-tabular">
              {formatReviewDate(review.date, i18n.language)}
            </Typography>
            <Typography
              variant="body2"
              color={review.salary ? undefined : 'textSecondary'}
              className="app-tabular ml-auto"
            >
              {review.salary ? formatMoney(review.salary, i18n.language) : t('list.noSalary')}
            </Typography>
          </div>
          <ReviewPeople people={review.responsibles} />
        </li>
      ))}
    </ul>
  );
}
