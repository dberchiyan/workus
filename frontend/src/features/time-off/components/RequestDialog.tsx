import CloseOutlined from '@mui/icons-material/CloseOutlined';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Skeleton from '@mui/material/Skeleton';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router';
import { InitialsAvatar } from '@/shared/components/InitialsAvatar';
import { employeeProfilePath } from '@/shared/lib/paths';
import { fullName } from '../format';
import { useManagedRequest } from '../hooks/useManagedRequests';
import type { ManagedRequest, TimeOffDecision } from '../types';
import { CommentComposer } from './CommentComposer';
import { RequestDecisionActions } from './RequestDecisionActions';
import { RequestSummary } from './RequestSummary';
import { RequestTimeline } from './RequestTimeline';
import { TimeOffStatusChip } from './TimeOffChips';

export interface RequestDialogProps {
  requestId: string;
  open: boolean;
  viewerId: string;
  busy: boolean;
  onDecide: (request: ManagedRequest, decision: TimeOffDecision) => void;
  onClose: () => void;
}

/** One request: summary and who decides on the left; history and comments on the right. */
export function RequestDialog({
  requestId,
  open,
  viewerId,
  busy,
  onDecide,
  onClose,
}: RequestDialogProps) {
  const { t } = useTranslation('timeOff');
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const titleId = useId();
  const query = useManagedRequest(requestId);
  const request = query.data;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isPhone}
      fullWidth
      maxWidth="md"
      aria-labelledby={titleId}
    >
      <DialogTitle
        id={titleId}
        component="div"
        className="flex items-start gap-3 pr-3 sm:items-center"
      >
        {request ? (
          <>
            <InitialsAvatar
              id={request.employee.userId}
              firstName={request.employee.firstName}
              lastName={request.employee.lastName}
            />
            <span className="flex min-w-0 flex-1 flex-col">
              {/* A phone has no room to cut the name short: it wraps there, truncates from sm. */}
              <Typography variant="h6" component="h2" className="sm:truncate">
                {t('manage.dialog.title', { name: fullName(request.employee) })}
              </Typography>
              <Link
                component={RouterLink}
                to={employeeProfilePath(request.employee.id)}
                variant="caption"
                className="self-start"
              >
                {t('manage.dialog.profile', { position: request.employee.positionTitle })}
              </Link>
              {/* Phone: the status goes under the name; from sm it sits beside it. */}
              <span className="mt-1 sm:hidden">
                <TimeOffStatusChip status={request.status} />
              </span>
            </span>
            <span className="hidden sm:flex">
              <TimeOffStatusChip status={request.status} />
            </span>
          </>
        ) : (
          <Typography variant="h6" component="h2" className="flex-1">
            {t('manage.dialog.loadingTitle')}
          </Typography>
        )}
        <IconButton aria-label={t('create.close')} onClick={onClose}>
          <CloseOutlined aria-hidden />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers className="bg-background-paper">
        {request ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <RequestSummary request={request} viewerId={viewerId} />
            <section
              aria-labelledby={`${titleId}-activity`}
              className="flex min-w-0 flex-col gap-4 md:border-l md:border-divider md:pl-6"
            >
              <Typography
                id={`${titleId}-activity`}
                variant="overline"
                component="h3"
                color="textSecondary"
              >
                {t('manage.dialog.activity')}
              </Typography>
              <RequestTimeline
                requestId={request.id}
                history={request.history}
                comments={request.comments}
                decisionComment={request.decisionComment}
                viewerId={viewerId}
              />
              <CommentComposer key={request.id} requestId={request.id} scope="managed" />
            </section>
          </div>
        ) : query.isError ? (
          <Alert severity="error">{t('manage.dialog.error')}</Alert>
        ) : (
          <div className="flex flex-col gap-3" aria-busy="true">
            <span className="sr-only">{t('manage.loading')}</span>
            <Skeleton variant="rounded" className="h-24" />
            <Skeleton variant="rounded" className="h-48" />
          </div>
        )}
      </DialogContent>
      {request && <RequestDecisionActions request={request} busy={busy} onDecide={onDecide} />}
    </Dialog>
  );
}
