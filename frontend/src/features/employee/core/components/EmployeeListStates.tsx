import SearchOffOutlined from '@mui/icons-material/SearchOffOutlined';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/shared/api/apiError';
import { RowSkeleton } from '@/shared/components/RowSkeleton';

const SKELETON_ROWS = ['s1', 's2', 's3', 's4', 's5'] as const;

export function EmployeeListLoading() {
  const { t } = useTranslation();
  return (
    <div role="status" aria-busy="true" className="flex flex-col divide-y divide-divider px-4 py-2">
      <span className="sr-only">{t('status.loading')}</span>
      {SKELETON_ROWS.map((id) => (
        <RowSkeleton key={id} />
      ))}
    </div>
  );
}

export function EmployeeListEmpty({ onClear }: { onClear: () => void }) {
  const { t } = useTranslation('employee');
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
      <SearchOffOutlined aria-hidden fontSize="large" color="disabled" />
      <Typography variant="h6" component="p">
        {t('empty.title')}
      </Typography>
      <Typography variant="body2" color="textSecondary">
        {t('empty.description')}
      </Typography>
      <Button variant="outlined" onClick={onClear}>
        {t('empty.clear')}
      </Button>
    </div>
  );
}

export function EmployeeListError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const { t } = useTranslation(['employee', 'errors']);
  return (
    <div className="p-4">
      <Alert
        severity="error"
        role="alert"
        action={
          <Button color="inherit" size="small" onClick={onRetry}>
            {t('error.retry')}
          </Button>
        }
      >
        {t(`errors:${isApiError(error) ? error.code : 'INTERNAL_ERROR'}`)}
      </Alert>
    </div>
  );
}
