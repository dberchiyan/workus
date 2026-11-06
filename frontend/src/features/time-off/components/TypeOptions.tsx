import Typography from '@mui/material/Typography';
import type { Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { TIME_OFF_TYPES, type TimeOffType } from '../types';
import { TYPE_VISUALS } from './timeOffVisuals';

export interface TypeOptionsProps {
  name: string;
  value: TimeOffType;
  onChange: (value: TimeOffType) => void;
  /** The form focuses the group through the checked option. */
  inputRef: Ref<HTMLInputElement>;
}

/** Native radio buttons styled as cards: arrow keys and screen readers work as for any radio. */
export function TypeOptions({ name, value, onChange, inputRef }: TypeOptionsProps) {
  const { t } = useTranslation('timeOff');
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
      <Typography variant="subtitle1" component="legend" className="mb-3 p-0">
        {t('create.type')}
      </Typography>
      {TIME_OFF_TYPES.map((type) => {
        const { icon: Icon, tone } = TYPE_VISUALS[type];
        const isChecked = value === type;
        return (
          <label
            key={type}
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-lg border border-divider bg-background-paper p-3 hover:border-primary has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary',
              isChecked && 'border-primary bg-badge-active-background',
            )}
          >
            <input
              type="radio"
              name={name}
              value={type}
              checked={isChecked}
              onChange={() => {
                onChange(type);
              }}
              ref={isChecked ? inputRef : undefined}
              className="sr-only"
            />
            <span
              aria-hidden
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-md text-avatar-text',
                tone,
              )}
            >
              <Icon fontSize="small" />
            </span>
            <Typography variant="subtitle1" component="span">
              {t(`cardTitles.${type}`)}
            </Typography>
          </label>
        );
      })}
    </fieldset>
  );
}
