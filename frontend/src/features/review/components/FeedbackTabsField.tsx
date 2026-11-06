import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { useId, useState } from 'react';
import { type Control, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { useFieldMessage } from '../hooks/useFieldMessage';
import type { CreateReviewFormValues } from '../schemas';
import { FEEDBACK_SOURCES, type FeedbackSource } from '../types';
import { RichTextEditor } from './RichTextEditor';

const FIELD: Readonly<
  Record<FeedbackSource, 'feedbackHr' | 'feedbackTeamLead' | 'feedbackTeam' | 'feedbackClient'>
> = {
  hr: 'feedbackHr',
  teamLead: 'feedbackTeamLead',
  team: 'feedbackTeam',
  client: 'feedbackClient',
};

export interface FeedbackTabsFieldProps {
  control: Control<CreateReviewFormValues>;
  values: Pick<
    CreateReviewFormValues,
    'feedbackHr' | 'feedbackTeamLead' | 'feedbackTeam' | 'feedbackClient'
  >;
  /** Error message per source: an i18n key from the schema or a localised server message. */
  errors: Partial<Record<FeedbackSource, string | undefined>>;
}

/** One rich-text editor at a time, switched by source tabs; a dot marks sources with feedback. */
export function FeedbackTabsField({ control, values, errors }: FeedbackTabsFieldProps) {
  const { t } = useTranslation('review');
  const message = useFieldMessage();
  const baseId = useId();
  const [source, setSource] = useState<FeedbackSource>('hr');

  return (
    <div className="flex flex-col gap-3">
      <Tabs
        value={source}
        onChange={(_event, value: FeedbackSource) => {
          setSource(value);
        }}
        variant="scrollable"
        scrollButtons={false}
        aria-label={t('feedback.tabsLabel')}
        slotProps={{ indicator: { className: 'h-0.5' } }}
        className="min-h-11 border-b border-divider"
      >
        {FEEDBACK_SOURCES.map((item) => {
          const hasValue = values[FIELD[item]] !== null;
          const hasError = Boolean(errors[item]);
          return (
            <Tab
              key={item}
              value={item}
              id={`${baseId}-tab-${item}`}
              aria-controls={`${baseId}-panel`}
              aria-label={
                hasValue
                  ? t('feedback.filled', { source: t(`feedback.${item}`) })
                  : t(`feedback.${item}`)
              }
              className="min-h-11 min-w-0 px-3"
              label={
                <span className="flex items-center gap-2">
                  {t(`feedback.${item}`)}
                  {(hasValue || hasError) && (
                    <span
                      aria-hidden
                      className={cn('size-1.5 rounded-full', hasError ? 'bg-error' : 'bg-primary')}
                    />
                  )}
                </span>
              }
            />
          );
        })}
      </Tabs>
      <div role="tabpanel" id={`${baseId}-panel`} aria-labelledby={`${baseId}-tab-${source}`}>
        <Controller
          key={source}
          control={control}
          name={FIELD[source]}
          render={({ field }) => (
            <RichTextEditor
              label={t(`feedback.${source}`)}
              value={field.value}
              onChange={field.onChange}
              placeholder={t('editor.placeholder', { source: t(`feedback.${source}`) })}
              error={errors[source] ? message({ message: errors[source] }) : undefined}
            />
          )}
        />
      </div>
    </div>
  );
}
