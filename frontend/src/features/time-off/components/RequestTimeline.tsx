import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { InitialsAvatar } from '@/shared/components/InitialsAvatar';
import { formatDateTime, fullName } from '../format';
import type { TimeOffComment, TimeOffHistoryItem } from '../types';
import { TimeOffStatusChip } from './TimeOffChips';

type Entry =
  | { kind: 'event'; at: string; item: TimeOffHistoryItem }
  | { kind: 'comment'; at: string; item: TimeOffComment };

export interface RequestTimelineProps {
  history: readonly TimeOffHistoryItem[];
  comments: readonly TimeOffComment[];
}

/** Status changes and comments in one feed, oldest first. */
export function RequestTimeline({ history, comments }: RequestTimelineProps) {
  const { t, i18n } = useTranslation('timeOff');
  const entries: Entry[] = [
    ...history.map((item): Entry => ({ kind: 'event', at: item.occurredAt, item })),
    ...comments.map((item): Entry => ({ kind: 'comment', at: item.createdAt, item })),
  ].sort((left, right) => left.at.localeCompare(right.at));

  return (
    <ol className="m-0 flex list-none flex-col gap-4 p-0">
      {entries.map((entry) => {
        const when = (
          <Typography variant="caption" color="textSecondary" className="app-tabular">
            <time dateTime={entry.at}>{formatDateTime(entry.at, i18n.language)}</time>
          </Typography>
        );
        if (entry.kind === 'comment') {
          const { author, body } = entry.item;
          return (
            <li key={`comment-${entry.item.id}`} className="flex gap-3">
              <InitialsAvatar
                id={author.id}
                firstName={author.firstName}
                lastName={author.lastName}
                size="sm"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1 rounded-lg bg-background px-3 py-2">
                <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <Typography variant="subtitle2" component="span">
                    {fullName(author)}
                  </Typography>
                  {when}
                </div>
                <Typography
                  variant="body2"
                  className="[overflow-wrap:anywhere] whitespace-pre-line"
                >
                  {body}
                </Typography>
              </div>
            </li>
          );
        }
        const { action, actor } = entry.item;
        return (
          <li key={`event-${entry.item.id}`} className="flex items-center gap-3">
            {/* The rail dot sits where comment avatars do, so the feed reads as one column. */}
            <span aria-hidden className="flex size-7 shrink-0 items-center justify-center">
              <span className="size-2 rounded-full bg-primary" />
            </span>
            <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2">
              <span className="flex flex-wrap items-center gap-2">
                <Typography variant="body2" component="span">
                  {t(`manage.timeline.${action}`, { name: actor ? fullName(actor) : '—' })}
                </Typography>
                {action !== 'CREATED' && <TimeOffStatusChip status={action} />}
              </span>
              {when}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
