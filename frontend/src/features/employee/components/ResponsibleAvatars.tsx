import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { InitialsAvatar } from '@/shared/components/InitialsAvatar';
import type { EmployeeListItem } from '../types';

export interface ResponsibleAvatarsProps {
  employee: Pick<EmployeeListItem, 'responsibles' | 'responsibleCount'>;
}

const fullName = (person: { firstName: string; lastName: string }): string =>
  `${person.firstName} ${person.lastName}`;

/** Always the same shape: first person's avatar and name, then a "+N" badge; all names on hover. */
export function ResponsibleAvatars({ employee }: ResponsibleAvatarsProps) {
  const { t } = useTranslation('employee');
  const [first] = employee.responsibles;

  if (!first) {
    return (
      <Typography variant="body2" color="textSecondary">
        {t('responsibles.none')}
      </Typography>
    );
  }

  const others = employee.responsibleCount - 1;
  const unnamed = employee.responsibleCount - employee.responsibles.length;
  const names = [
    ...employee.responsibles.map(fullName),
    ...(unnamed > 0 ? [t('responsibles.andMore', { count: unnamed })] : []),
  ].join(', ');

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
      {others > 0 && (
        <Typography
          variant="caption"
          component="span"
          className="app-tabular shrink-0 rounded-full bg-badge-neutral-background px-2 text-badge-neutral-text"
        >
          {t('responsibles.more', { count: others })}
        </Typography>
      )}
    </span>
  );

  if (others === 0) {
    return content;
  }
  return (
    <Tooltip title={names}>
      <span
        // WAI-ARIA tooltip pattern: the trigger takes focus so keyboard users see the list too.
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        aria-label={t('responsibles.label', { names })}
        className="relative z-10 inline-flex max-w-full rounded-sm"
      >
        {content}
      </span>
    </Tooltip>
  );
}
