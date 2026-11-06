import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/features/auth';
import { MyTimeOff } from '@/features/time-off';
import { AdminOverview } from '../components/AdminOverview';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { usePageHeadingFocus } from '@/shared/hooks/usePageHeadingFocus';

/**
 * Admins: what needs attention (requests, absences, reviews, people starting / leaving).
 * Employees and managers: their time off (balances and requests).
 */
export default function DashboardPage() {
  const { t } = useTranslation('dashboard');
  useDocumentTitle(t('pageTitle'));
  const headingRef = usePageHeadingFocus<HTMLHeadingElement>();
  // RequireAuth renders this route only with a loaded user.
  const { data: user } = useCurrentUser();

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <Typography
        ref={headingRef}
        tabIndex={-1}
        variant="h4"
        component="h1"
        // No visible greeting (product decision); the page keeps its h1 for focus and screen readers.
        className="sr-only"
      >
        {t('title')}
      </Typography>
      {user.role === 'ADMIN' ? <AdminOverview /> : <MyTimeOff />}
    </div>
  );
}
