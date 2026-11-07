import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type SecurityCategory, SecurityLogView } from '@/features/auth';
import { useEmployeeSecurityLog } from '../hooks/useEmployeeSecurityLog';

/** The employee's sign-ins, failed attempts, password changes and signed-out sessions. */
export function ProfileSecurityTab({ employeeId }: { employeeId: string }) {
  const { t } = useTranslation('employee');
  const [category, setCategory] = useState<SecurityCategory | undefined>(undefined);
  const log = useEmployeeSecurityLog(employeeId, category);
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
      <SecurityLogView log={log} category={category} onCategory={setCategory} />
    </div>
  );
}
