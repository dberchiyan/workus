import Card from '@mui/material/Card';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { PROFILE_TABS, type ProfileTab, useProfileTab } from '../hooks/useProfileTab';
import type { EmployeeProfileMock } from '../mocks/employeeProfileMock';
import type { EmployeeProfile } from '../types';
import { ReviewTab } from '@/features/employee/review';
import { ProfileActivityTab } from './ProfileActivityTab';
import { ProfileFilesTab } from './ProfileFilesTab';
import { ProfileInfoTab } from './ProfileInfoTab';

export interface ProfileTabsProps {
  employee: EmployeeProfile;
  mock: EmployeeProfileMock;
}

/** Info, Files, Review, Activity — the open tab is kept in the URL. */
export function ProfileTabs({ employee, mock }: ProfileTabsProps) {
  const { t } = useTranslation('employee');
  const { tab, setTab } = useProfileTab();
  const baseId = useId();
  const labels: Record<ProfileTab, string> = {
    info: t('profile.tabs.info'),
    files: t('profile.tabs.files', { count: mock.fileCount }),
    review: t('profile.tabs.review'),
    activity: t('profile.tabs.activity'),
  };

  return (
    // flex-1: on desktop the card reaches at least the bottom of the leave balances beside it.
    <Card variant="outlined" className="flex flex-1 flex-col">
      <Tabs
        value={tab}
        onChange={(_event, value: ProfileTab) => {
          setTab(value);
        }}
        variant="scrollable"
        scrollButtons={false}
        aria-label={t('profile.tabs.label')}
        slotProps={{ indicator: { className: 'h-0.5' } }}
        className="border-b border-divider px-2"
      >
        {PROFILE_TABS.map((value) => (
          <Tab
            key={value}
            value={value}
            label={labels[value]}
            id={`${baseId}-tab-${value}`}
            aria-controls={`${baseId}-panel-${value}`}
            className="min-h-11 min-w-0 px-4"
          />
        ))}
      </Tabs>
      <div
        role="tabpanel"
        id={`${baseId}-panel-${tab}`}
        aria-labelledby={`${baseId}-tab-${tab}`}
        className="min-w-0 flex-1"
      >
        {tab === 'info' && <ProfileInfoTab employee={employee} mock={mock} />}
        {tab === 'files' && <ProfileFilesTab mock={mock} />}
        {tab === 'review' && <ReviewTab employeeId={employee.id} />}
        {tab === 'activity' && <ProfileActivityTab employeeId={employee.id} />}
      </div>
    </Card>
  );
}
