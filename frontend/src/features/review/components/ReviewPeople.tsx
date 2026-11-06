import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { InitialsAvatar } from '@/shared/components/InitialsAvatar';
import type { Review } from '../types';

const fullName = (person: { firstName: string; lastName: string }): string =>
  `${person.firstName} ${person.lastName}`;

/** First responsible with avatar and name, then "+N"; all names on hover/focus. */
export function ReviewPeople({ people }: { people: Review['responsibles'] }) {
  const { t } = useTranslation('review');
  const [first] = people;
  if (!first) {
    return null;
  }
  const names = people.map(fullName).join(', ');
  const content = (
    <span className="flex min-w-0 items-center gap-2">
      <InitialsAvatar
        id={first.id}
        firstName={first.firstName}
        lastName={first.lastName}
        size="sm"
      />
      <Typography variant="body2" component="span" className="truncate">
        {fullName(first)}
      </Typography>
      {people.length > 1 && (
        <Typography
          variant="caption"
          component="span"
          className="app-tabular shrink-0 rounded-full bg-badge-neutral-background px-2 text-badge-neutral-text"
        >
          {t('table.more', { count: people.length - 1 })}
        </Typography>
      )}
    </span>
  );
  if (people.length === 1) {
    return content;
  }
  return (
    <Tooltip title={names}>
      <span
        // WAI-ARIA tooltip pattern: the trigger takes focus so keyboard users see the list too.
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        aria-label={t('table.responsibleLabel', { names })}
        className="inline-flex max-w-full rounded-sm"
      >
        {content}
      </span>
    </Tooltip>
  );
}
