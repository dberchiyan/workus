import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { isReviewStatus, ReviewStatusChip } from '@/features/employee/review';
import { InitialsAvatar } from '@/shared/components/InitialsAvatar';
import { formatMoney } from '@/shared/lib/money';
import { fullName } from '../activityFormat';
import { formatCalendarDate } from '../format';
import type { ActivityValue } from '../types';

type Person = Extract<ActivityValue, { kind: 'people' }>['people'][number];

/** Avatar + name chips, wrapping. */
export function PeopleList({ people }: { people: Person[] }) {
  const { t } = useTranslation('employee');
  if (people.length === 0) {
    return (
      <Typography variant="body2" component="span" color="textSecondary">
        {t('profile.activity.nobody')}
      </Typography>
    );
  }
  return (
    <ul className="m-0 flex list-none flex-wrap gap-x-3 gap-y-1 p-0">
      {people.map((person) => (
        <li key={person.id} className="flex min-w-0 items-center gap-1.5">
          <InitialsAvatar
            id={person.id}
            firstName={person.firstName}
            lastName={person.lastName}
            size="sm"
          />
          <Typography variant="body2" component="span" className="truncate">
            {fullName(person)}
          </Typography>
        </li>
      ))}
    </ul>
  );
}

/** One logged value, formatted by its kind. */
export function ActivityValueView({ value }: { value: ActivityValue }) {
  const { i18n } = useTranslation();
  switch (value.kind) {
    case 'text':
      return (
        <Typography variant="body2" component="span" className="[overflow-wrap:anywhere]">
          {value.text}
        </Typography>
      );
    case 'date':
      return (
        <Typography variant="body2" component="span" className="app-tabular">
          {formatCalendarDate(value.date, i18n.language)}
        </Typography>
      );
    case 'money':
      return (
        <Typography variant="body2" component="span" className="app-tabular">
          {formatMoney(value.money, i18n.language)}
        </Typography>
      );
    case 'reviewStatus':
      return isReviewStatus(value.status) ? (
        <ReviewStatusChip status={value.status} />
      ) : (
        <Typography variant="body2" component="span">
          {value.status}
        </Typography>
      );
    case 'people':
      return <PeopleList people={value.people} />;
    case 'feedback':
      // Rendered by the change row (added / edited / removed); the text is never logged.
      return null;
  }
}
