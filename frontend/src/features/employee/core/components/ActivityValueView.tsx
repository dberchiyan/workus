import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { isReviewStatus, ReviewStatusChip } from '@/features/employee/review';
import {
  isTimeOffStatus,
  isTimeOffType,
  TimeOffStatusChip,
  TimeOffTypeChip,
} from '@/features/time-off';
import { InitialsAvatar } from '@/shared/components/InitialsAvatar';
import { formatMoney } from '@/shared/lib/money';
import { fullName } from '../activityFormat';
import { formatCalendarDate } from '../format';
import { isTerminationReason } from '../schemas';
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
  const { t, i18n } = useTranslation('employee');
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
    case 'terminationReason':
      return (
        <Typography variant="body2" component="span">
          {isTerminationReason(value.reason)
            ? t(`termination.reasons.${value.reason}`)
            : value.reason}
        </Typography>
      );
    case 'timeOffType':
      return isTimeOffType(value.type) ? (
        <TimeOffTypeChip type={value.type} />
      ) : (
        <Typography variant="body2" component="span">
          {value.type}
        </Typography>
      );
    case 'timeOffStatus':
      return isTimeOffStatus(value.status) ? (
        <TimeOffStatusChip status={value.status} />
      ) : (
        <Typography variant="body2" component="span">
          {value.status}
        </Typography>
      );
    case 'number':
      return (
        <Typography variant="body2" component="span" className="app-tabular">
          {new Intl.NumberFormat(i18n.language).format(value.number)}
        </Typography>
      );
    case 'flag':
      return (
        <Typography variant="body2" component="span">
          {value.flag ? t('profile.activity.flag.yes') : t('profile.activity.flag.no')}
        </Typography>
      );
    case 'feedback':
    case 'redacted':
      // Rendered by the change row (added / edited / removed); the value is never logged.
      return null;
  }
}
