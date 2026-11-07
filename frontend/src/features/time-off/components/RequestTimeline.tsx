import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { formatDateTime, fullName } from '../format';
import type { TimeOffComment, TimeOffHistoryItem } from '../types';
import { CommentItem } from './CommentItem';
import { TimeOffStatusChip } from './TimeOffChips';

type Entry =
  | { kind: 'event'; at: string; item: TimeOffHistoryItem }
  | { kind: 'comment'; at: string; item: TimeOffComment };

export interface RequestTimelineProps {
  requestId: string;
  history: readonly TimeOffHistoryItem[];
  comments: readonly TimeOffComment[];
  /** The reason given with a rejection, shown under it. */
  decisionComment: string | null;
  viewerId: string;
}

/** Status changes and comments in one feed, oldest first. */
export function RequestTimeline({
  requestId,
  history,
  comments,
  decisionComment,
  viewerId,
}: RequestTimelineProps) {
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
          return (
            <li key={`comment-${entry.item.id}`}>
              <CommentItem requestId={requestId} comment={entry.item} viewerId={viewerId} />
            </li>
          );
        }
        const { action, actor } = entry.item;
        return (
          <li key={`event-${entry.item.id}`} className="flex items-start gap-3">
            {/* The rail dot sits where comment avatars do, so the feed reads as one column. */}
            <span aria-hidden className="flex size-7 shrink-0 items-center justify-center">
              <span className="size-2 rounded-full bg-primary" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                <span className="flex flex-wrap items-center gap-2">
                  <Typography variant="body2" component="span">
                    {t(`manage.timeline.${action}`, { name: actor ? fullName(actor) : '—' })}
                  </Typography>
                  {action !== 'CREATED' && action !== 'RESPONSIBLES_CHANGED' && (
                    <TimeOffStatusChip status={action} />
                  )}
                </span>
                {when}
              </div>
              {action === 'REJECTED' && decisionComment && (
                <Typography
                  variant="body2"
                  color="textSecondary"
                  className="border-l-2 border-divider pl-3 [overflow-wrap:anywhere] whitespace-pre-line"
                >
                  {decisionComment}
                </Typography>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
