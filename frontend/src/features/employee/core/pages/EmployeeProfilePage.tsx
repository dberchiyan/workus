import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import BeachAccessOutlined from '@mui/icons-material/BeachAccessOutlined';
import EventBusyOutlined from '@mui/icons-material/EventBusyOutlined';
import LocalHospitalOutlined from '@mui/icons-material/LocalHospitalOutlined';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useLocation, useParams } from 'react-router';
import { isApiError } from '@/shared/api/apiError';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { usePageHeadingFocus } from '@/shared/hooks/usePageHeadingFocus';
import { PATHS } from '@/shared/lib/paths';
import { EmployeeListError, EmployeeListLoading } from '../components/EmployeeListStates';
import { LeaveBalanceCard } from '../components/LeaveBalanceCard';
import { ProfileEmptyState } from '../components/ProfileEmptyState';
import { ProfileHeader } from '../components/ProfileHeader';
import { ProfileTabs } from '../components/ProfileTabs';
import { ResponsiblesCard } from '../components/ResponsiblesCard';
import { useEmployeeProfile } from '../hooks/useEmployeeQueries';
import { mockEmployeeProfile } from '../mocks/employeeProfileMock';

/** The list passes its query string, so "Employees" returns to the same tab/filters/page. */
const backHref = (state: unknown): string => {
  const from =
    typeof state === 'object' && state !== null && 'from' in state && typeof state.from === 'string'
      ? state.from
      : '';
  return from.startsWith('?') ? `${PATHS.employees}${from}` : PATHS.employees;
};

export default function EmployeeProfilePage() {
  const { t } = useTranslation('employee');
  const { employeeId = '' } = useParams();
  const location = useLocation();
  const { data: employee, isPending, isError, error, refetch } = useEmployeeProfile(employeeId);
  useDocumentTitle(
    employee
      ? t('profile.pageTitle', { name: `${employee.firstName} ${employee.lastName}` })
      : t('pageTitle'),
  );
  const headingRef = usePageHeadingFocus<HTMLHeadingElement>();
  const state: unknown = location.state;

  const back = (
    <Button
      component={RouterLink}
      to={backHref(state)}
      startIcon={<ArrowBackOutlined aria-hidden />}
      className="self-start"
    >
      {t('profile.back')}
    </Button>
  );

  if (isPending) {
    return <EmployeeListLoading />;
  }
  if (isError) {
    const isMissing =
      isApiError(error) &&
      (error.code === 'RESOURCE_NOT_FOUND' || error.code === 'INVALID_PARAMETER');
    return (
      <div className="flex flex-col gap-4">
        {back}
        {isMissing ? (
          <>
            <Typography variant="h4" component="h1">
              {t('profile.notFound.title')}
            </Typography>
            <ProfileEmptyState icon={null} title={t('profile.notFound.description')} />
          </>
        ) : (
          <EmployeeListError error={error} onRetry={() => void refetch()} />
        )}
      </div>
    );
  }

  const mock = mockEmployeeProfile(employee.id, employee.startDate);
  return (
    <div className="flex flex-col gap-4">
      {back}
      {/*
        Two rows on desktop, each stretched to its taller cell: header | Responsible, then
        tabs | leave balances. Phones stack them in this order.
      */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex min-w-0 lg:col-span-2">
          <ProfileHeader employee={employee} headingRef={headingRef} />
        </div>
        <div className="flex min-w-0">
          <ResponsiblesCard employee={employee} />
        </div>
        <div className="flex min-w-0 lg:col-span-2">
          <ProfileTabs employee={employee} mock={mock} />
        </div>
        <aside className="flex flex-col gap-4">
          <LeaveBalanceCard
            title={t('profile.leave.vacation')}
            icon={<BeachAccessOutlined fontSize="small" />}
            toneClass="bg-avatar-c2"
            balance={mock.vacation}
          />
          <LeaveBalanceCard
            title={t('profile.leave.daysOff')}
            icon={<EventBusyOutlined fontSize="small" />}
            toneClass="bg-avatar-c5"
            balance={mock.daysOff}
          />
          <LeaveBalanceCard
            title={t('profile.leave.sickDays')}
            icon={<LocalHospitalOutlined fontSize="small" />}
            toneClass="bg-avatar-c4"
            balance={mock.sickDays}
          />
        </aside>
      </div>
    </div>
  );
}
