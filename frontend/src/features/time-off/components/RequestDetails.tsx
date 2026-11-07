import ChatBubbleOutlineOutlined from '@mui/icons-material/ChatBubbleOutlineOutlined';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/features/auth';
import { formatDateTime, fullName } from '../format';
import type { TimeOffRequest } from '../types';
import { CommentComposer } from './CommentComposer';
import { CommentItem } from './CommentItem';
import { PersonLine } from './PersonLine';
import { TimeOffStatusChip } from './TimeOffChips';

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card variant="outlined" className="h-full">
      <CardContent className="flex h-full flex-col gap-3 p-4">
        <Typography variant="overline" component="h3" color="textSecondary">
          {title}
        </Typography>
        {children}
      </CardContent>
    </Card>
  );
}

export interface RequestDetailsProps {
  request: TimeOffRequest;
  onCancel: (request: TimeOffRequest) => void;
}

/** Responsible people, status, history and comments of one request. */
export function RequestDetails({ request, onCancel }: RequestDetailsProps) {
  const { t, i18n } = useTranslation('timeOff');
  // The employee's note and the reason for a decision first; then the comments, oldest first.
  const comments = [
    ...(request.note ? [{ key: 'note', author: t('details.note'), text: request.note }] : []),
    ...(request.decisionComment && request.decidedBy
      ? [
          {
            key: 'decision',
            author: t('details.decisionComment', { name: fullName(request.decidedBy) }),
            text: request.decisionComment,
          },
        ]
      : []),
  ];
  const viewerId = useCurrentUser().data?.id;
  return (
    // One grid, row by row: Responsible | Status, then History | Comments — each row as tall
    // as its taller panel.
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Panel title={t('details.responsible', { count: request.responsibles.length })}>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {request.responsibles.map((person) => (
            <li key={person.id}>
              <PersonLine person={person} />
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title={t('details.status')}>
        <div className="flex flex-wrap items-center gap-3">
          <TimeOffStatusChip status={request.status} />
          <Typography variant="body2" color="textSecondary">
            {request.decidedBy && request.decidedAt
              ? t('details.decidedBy', {
                  name: fullName(request.decidedBy),
                  date: formatDateTime(request.decidedAt, i18n.language),
                })
              : request.status === 'PENDING'
                ? t('details.waiting')
                : null}
          </Typography>
        </div>
        {request.canCancel && (
          <div>
            <Button
              variant="outlined"
              color="error"
              onClick={() => {
                onCancel(request);
              }}
            >
              {t('details.cancel')}
            </Button>
          </div>
        )}
      </Panel>
      <Panel title={t('details.history')}>
        <ol className="m-0 flex list-none flex-col p-0">
          {request.history.map((item, index) => (
            <li key={item.id} className="relative flex gap-3 pb-4 pl-5 last:pb-0">
              {/* Timeline: a dot and, between items, the rail. */}
              <span aria-hidden className="absolute top-3 left-0 size-2 rounded-full bg-primary" />
              {index < request.history.length - 1 && (
                <span aria-hidden className="absolute top-5 bottom-0 left-[3px] w-px bg-divider" />
              )}
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {item.actor ? (
                    <PersonLine person={item.actor} />
                  ) : (
                    <Typography variant="subtitle2">—</Typography>
                  )}
                  {item.action === 'CREATED' || item.action === 'RESPONSIBLES_CHANGED' ? (
                    <Typography variant="caption" color="primary">
                      {t(`details.actions.${item.action}`)}
                    </Typography>
                  ) : (
                    <TimeOffStatusChip status={item.action} />
                  )}
                </div>
                <Typography variant="caption" color="textSecondary" className="app-tabular">
                  <time dateTime={item.occurredAt}>
                    {formatDateTime(item.occurredAt, i18n.language)}
                  </time>
                </Typography>
              </div>
            </li>
          ))}
        </ol>
      </Panel>
      <Panel title={t('details.comments')}>
        {comments.length === 0 && request.comments.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-1 rounded-md border border-dashed border-divider p-6">
            <ChatBubbleOutlineOutlined aria-hidden className="text-text-secondary" />
            <Typography variant="body2" color="textSecondary">
              {t('details.noComments')}
            </Typography>
          </div>
        )}
        {comments.length > 0 && (
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {comments.map((comment) => (
              <li key={comment.key} className="flex flex-col gap-0.5">
                <Typography variant="caption" color="textSecondary">
                  {comment.author}
                </Typography>
                <Typography
                  variant="body2"
                  className="[overflow-wrap:anywhere] whitespace-pre-line"
                >
                  {comment.text}
                </Typography>
              </li>
            ))}
          </ul>
        )}
        {request.comments.length > 0 && (
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {request.comments.map((comment) => (
              <li key={comment.id}>
                <CommentItem requestId={request.id} comment={comment} viewerId={viewerId} />
              </li>
            ))}
          </ul>
        )}
        <CommentComposer key={request.id} requestId={request.id} scope="own" />
      </Panel>
    </div>
  );
}
