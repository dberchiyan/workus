import Typography from '@mui/material/Typography';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type SecurityCategory, SecurityLogView } from '@/features/auth';
import { useEmployeeSecurityLog } from '../hooks/useEmployeeSecurityLog';

/**
 * The employee's sign-ins, failed attempts, password changes and signed-out sessions. Laid out
 * like the Activity tab: a header row over the card's padded body.
 */
export function ProfileSecurityTab({ employeeId }: { employeeId: string }) {
  const { t } = useTranslation('employee');
  const headingId = useId();
  const [category, setCategory] = useState<SecurityCategory | undefined>(undefined);
  const [page, setPage] = useState(0);
  const log = useEmployeeSecurityLog(employeeId, category, page);
  return (
    <section aria-labelledby={headingId} className="flex flex-col">
      <div className="flex flex-col gap-0.5 border-b border-divider px-4 py-3 sm:px-6">
        <Typography id={headingId} variant="h6" component="h3">
          {t('profile.security.title')}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {t('profile.security.description')}
        </Typography>
      </div>
      <div className="px-4 py-4 sm:px-6 sm:py-5">
        <SecurityLogView
          log={log}
          category={category}
          onCategory={(next) => {
            setCategory(next);
            setPage(0);
          }}
          page={page}
          onPage={setPage}
        />
      </div>
    </section>
  );
}
