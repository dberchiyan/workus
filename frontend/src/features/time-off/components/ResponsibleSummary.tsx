import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { InitialsAvatar } from '@/shared/components/InitialsAvatar';
import { fullName } from '../format';
import type { TimeOffPerson } from '../types';

/** First responsible's avatar, then "+N"; all names in a tooltip and the accessible name. */
export function ResponsibleSummary({ people }: { people: TimeOffPerson[] }) {
  const { t } = useTranslation('timeOff');
  const [first] = people;
  if (!first) {
    return null;
  }
  const names = people.map(fullName).join(', ');
  return (
    <Tooltip title={names}>
      <span
        // WAI-ARIA tooltip pattern: the trigger takes focus so keyboard users see the names too.
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        aria-label={t('requests.responsibleLabel', { names })}
        className="inline-flex items-center gap-2 rounded-sm"
      >
        <InitialsAvatar
          id={first.id}
          firstName={first.firstName}
          lastName={first.lastName}
          size="sm"
        />
        {people.length > 1 && (
          <Typography
            variant="caption"
            component="span"
            className="app-tabular rounded-full bg-badge-neutral-background px-2 text-badge-neutral-text"
          >
            {t('requests.more', { count: people.length - 1 })}
          </Typography>
        )}
      </span>
    </Tooltip>
  );
}
