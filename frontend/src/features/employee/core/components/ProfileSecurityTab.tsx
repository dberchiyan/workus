import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SECURITY_LOG_PAGE_SIZE, SecurityEventList } from '@/features/auth';
import { useEmployeeSecurityLog } from '../hooks/useEmployeeSecurityLog';

/** The employee's sign-ins, failed attempts, password changes and signed-out sessions. */
export function ProfileSecurityTab({ employeeId }: { employeeId: string }) {
  const { t } = useTranslation('employee');
  const [page, setPage] = useState(0);
  const log = useEmployeeSecurityLog(employeeId, page);
  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="flex flex-col gap-1">
        <Typography variant="h6" component="h2">
          {t('profile.security.title')}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {t('profile.security.description')}
        </Typography>
      </div>
      {log.isError ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void log.refetch()}>
              {t('profile.security.retry')}
            </Button>
          }
        >
          {t('profile.security.error')}
        </Alert>
      ) : log.isPending ? (
        <Skeleton variant="rounded" height={96} />
      ) : (
        <SecurityEventList
          events={log.data.content}
          total={log.data.totalElements}
          page={page}
          pageSize={SECURITY_LOG_PAGE_SIZE}
          onPage={setPage}
          isStale={log.isPlaceholderData}
        />
      )}
    </div>
  );
}
