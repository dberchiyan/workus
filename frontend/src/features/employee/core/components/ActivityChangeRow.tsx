import ArrowForwardOutlined from '@mui/icons-material/ArrowForwardOutlined';
import TrendingDownOutlined from '@mui/icons-material/TrendingDownOutlined';
import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { formatSalaryChange, fullName } from '../activityFormat';
import type { ActivityChange, ActivityValue } from '../types';
import { ActivityValueView, PeopleList } from './ActivityValueView';

const FEEDBACK_FIELDS = new Set<ActivityChange['field']>([
  'feedbackHr',
  'feedbackTeamLead',
  'feedbackTeam',
  'feedbackClient',
]);

/** Old value: struck through and muted; screen readers hear "Before:". */
function Before({ children }: { children: ReactNode }) {
  const { t } = useTranslation('employee');
  return (
    <del className="inline-flex min-w-0 items-center text-text-secondary line-through decoration-text-secondary">
      <span className="sr-only">{t('profile.activity.previous')} </span>
      {children}
    </del>
  );
}

/** New value; screen readers hear "After:". */
function After({ children }: { children: ReactNode }) {
  const { t } = useTranslation('employee');
  return (
    <ins className="inline-flex min-w-0 items-center no-underline">
      <span className="sr-only">{t('profile.activity.current')} </span>
      {children}
    </ins>
  );
}

const Arrow = () => (
  <ArrowForwardOutlined aria-hidden fontSize="small" className="shrink-0 text-text-disabled" />
);

function SalaryDelta({ from, to }: { from: ActivityValue; to: ActivityValue }) {
  const { t, i18n } = useTranslation('employee');
  if (from.kind !== 'money' || to.kind !== 'money') {
    return null;
  }
  const percent = formatSalaryChange(from.money, to.money, i18n.language);
  if (!percent) {
    return null;
  }
  const isDown = percent.startsWith('-') || percent.startsWith('−');
  const Icon = isDown ? TrendingDownOutlined : TrendingUpOutlined;
  return (
    <Typography
      variant="caption"
      component="span"
      className={cn(
        'app-tabular inline-flex items-center gap-1 rounded-full px-2',
        isDown
          ? 'bg-badge-neutral-background text-error'
          : 'bg-success-light text-success-dark dark:text-success',
      )}
    >
      <Icon aria-hidden fontSize="inherit" />
      {t('profile.activity.salaryChange', { percent })}
    </Typography>
  );
}

/** Responsibles: who joined and who left, rather than two long lists. */
function PeopleDiff({ from, to }: { from: ActivityValue; to: ActivityValue }) {
  const { t } = useTranslation('employee');
  if (from.kind !== 'people' || to.kind !== 'people') {
    return null;
  }
  const before = new Set(from.people.map((person) => person.id));
  const after = new Set(to.people.map((person) => person.id));
  const added = to.people.filter((person) => !before.has(person.id));
  const removed = from.people.filter((person) => !after.has(person.id));
  return (
    <span className="flex min-w-0 flex-col gap-1">
      {added.length > 0 && (
        <span className="flex flex-wrap items-center gap-2">
          <Typography
            variant="caption"
            component="span"
            className="text-success-dark dark:text-success"
          >
            <span aria-hidden>+ </span>
            <span className="sr-only">
              {t('profile.activity.peopleAdded', { names: added.map(fullName).join(', ') })}
            </span>
          </Typography>
          <span aria-hidden className="min-w-0">
            <PeopleList people={added} />
          </span>
        </span>
      )}
      {removed.length > 0 && (
        <span className="flex flex-wrap items-center gap-2">
          <Typography variant="caption" component="span" className="text-error">
            <span aria-hidden>− </span>
            <span className="sr-only">
              {t('profile.activity.peopleRemoved', { names: removed.map(fullName).join(', ') })}
            </span>
          </Typography>
          <del aria-hidden className="min-w-0 text-text-secondary line-through">
            <PeopleList people={removed} />
          </del>
        </span>
      )}
    </span>
  );
}

/** One field: "Before → After", only "After" for a new value, only "Before" for a removed one. */
export function ActivityChangeRow({ change }: { change: ActivityChange }) {
  const { t } = useTranslation('employee');
  const { field, from, to } = change;

  let value: ReactNode;
  // Feedback and personal contacts are logged without their values: only that they changed.
  if (FEEDBACK_FIELDS.has(field) || from?.kind === 'redacted' || to?.kind === 'redacted') {
    const state = from && to ? 'edited' : to ? 'added' : 'removed';
    value = (
      <Typography
        variant="body2"
        component="span"
        color={state === 'removed' ? 'textSecondary' : 'textPrimary'}
      >
        {t(`profile.activity.presence.${state}`)}
      </Typography>
    );
  } else if (from && to && from.kind === 'people') {
    value = <PeopleDiff from={from} to={to} />;
  } else if (from && to) {
    value = (
      <>
        <Before>
          <ActivityValueView value={from} />
        </Before>
        <Arrow />
        <After>
          <ActivityValueView value={to} />
        </After>
        <SalaryDelta from={from} to={to} />
      </>
    );
  } else if (to) {
    value = (
      <After>
        <ActivityValueView value={to} />
      </After>
    );
  } else if (from) {
    value = (
      <Before>
        <ActivityValueView value={from} />
      </Before>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-0.5 py-1.5 sm:grid-cols-[11rem_1fr]">
      {/* 11rem: one-off label column, fits the longest field name ("Responsible people"). */}
      <dt className="min-w-0">
        <Typography variant="body2" component="span" color="textSecondary">
          {t(`profile.activity.fields.${field}`)}
        </Typography>
      </dt>
      <dd className="m-0 flex min-w-0 flex-wrap items-center gap-2">{value}</dd>
    </div>
  );
}
