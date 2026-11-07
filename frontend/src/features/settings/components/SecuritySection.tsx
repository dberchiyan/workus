import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import { useTranslation } from 'react-i18next';
import { SECURITY_LOG_PAGE_SIZE, SecurityEventList, useOwnSecurityLog } from '@/features/auth';
import { useUrlPage } from '../useUrlPage';
import { SettingsCard } from './SettingsCard';

/** Your security log: sign-ins (and failed ones), password changes, signed-out sessions. */
export function SecuritySection() {
  const { t } = useTranslation('settings');
  const [page, setPage] = useUrlPage();
  const log = useOwnSecurityLog(page);
  return (
    <SettingsCard
      id="settings-security"
      title={t('security.title')}
      description={t('security.description')}
    >
      {log.isError ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void log.refetch()}>
              {t('security.retry')}
            </Button>
          }
        >
          {t('security.error')}
        </Alert>
      ) : log.isPending ? (
        <div className="flex flex-col gap-3">
          <Skeleton variant="rounded" height={48} />
          <Skeleton variant="rounded" height={48} />
        </div>
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
    </SettingsCard>
  );
}
