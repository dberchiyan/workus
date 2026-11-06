import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FEEDBACK_SOURCES, type FeedbackSource, type Review } from '../types';
import { RichTextView } from './RichTextView';

/** Feedback by source, one at a time; opens on the first source that has any. */
export function ViewFeedbackTabs({ review }: { review: Review }) {
  const { t } = useTranslation('review');
  const baseId = useId();
  const [source, setSource] = useState<FeedbackSource>(
    () => FEEDBACK_SOURCES.find((item) => review.feedback[item] !== null) ?? 'hr',
  );
  const doc = review.feedback[source];

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
        {FEEDBACK_SOURCES.map((item) => (
          <Tab
            key={item}
            value={item}
            id={`${baseId}-tab-${item}`}
            aria-controls={`${baseId}-panel`}
            className="min-h-11 min-w-0 px-3"
            label={t(`feedback.${item}`)}
          />
        ))}
      </Tabs>
      <div
        role="tabpanel"
        id={`${baseId}-panel`}
        aria-labelledby={`${baseId}-tab-${source}`}
        className="min-h-24 rounded-md bg-background p-4"
      >
        {doc ? (
          <RichTextView key={source} value={doc} />
        ) : (
          <Typography variant="body2" color="textSecondary">
            {t('feedback.none')}
          </Typography>
        )}
      </div>
    </div>
  );
}
