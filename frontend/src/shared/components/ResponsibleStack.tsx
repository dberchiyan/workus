import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { InitialsAvatar } from './InitialsAvatar';

export interface StackPerson {
  id: string;
  firstName: string;
  lastName: string;
}

export interface ResponsibleStackProps {
  /** In order; may be the first few of `total`. */
  people: readonly StackPerson[];
  /** Everyone, when the data names only the first few. */
  total?: number;
  /** A single person: avatar and full name (tables); otherwise the avatar alone. */
  showSoleName?: boolean;
}

/** At most this many circles, the last one "+N" when there are more people. */
const MAX_CIRCLES = 3;

const fullName = (person: StackPerson): string => `${person.firstName} ${person.lastName}`;

/** Paper-coloured ring: overlapping circles stay apart. */
const RING = 'ring-2 ring-background-paper';

/**
 * Responsible people as overlapping avatars — how many and who at a glance; every name in the
 * tooltip and the accessible name. Always the same width (≤ 3 circles), so table columns hold.
 */
export function ResponsibleStack({ people, total, showSoleName = false }: ResponsibleStackProps) {
  const { t } = useTranslation();
  const count = Math.max(total ?? people.length, people.length);
  const [first] = people;
  if (!first) {
    return null;
  }

  if (count === 1 && showSoleName) {
    return (
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
      </span>
    );
  }

  const shown = people.slice(0, count > MAX_CIRCLES ? MAX_CIRCLES - 1 : MAX_CIRCLES);
  const hidden = count - shown.length;
  const unnamed = count - people.length;
  const names = [
    ...people.map(fullName),
    ...(unnamed > 0 ? [t('people.andMore', { count: unnamed })] : []),
  ].join(', ');

  return (
    <Tooltip title={names}>
      <span
        // WAI-ARIA tooltip pattern: the trigger takes focus so keyboard users get the names too.
        // `relative z-10`: above a row's stretched link.
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        aria-label={t('people.responsible', { names })}
        className="relative z-10 inline-flex shrink-0 items-center rounded-full"
      >
        {shown.map((person, index) => (
          <InitialsAvatar
            key={person.id}
            id={person.id}
            firstName={person.firstName}
            lastName={person.lastName}
            size="sm"
            className={cn(RING, index > 0 && '-ml-2')}
          />
        ))}
        {hidden > 0 && (
          <span
            aria-hidden
            className={cn(
              RING,
              '-ml-2 flex size-7 items-center justify-center rounded-full bg-badge-neutral-background text-badge-neutral-text',
            )}
          >
            <Typography variant="caption" component="span" className="app-tabular">
              {t('people.more', { count: hidden })}
            </Typography>
          </span>
        )}
      </span>
    </Tooltip>
  );
}
