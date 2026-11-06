import FolderOpenOutlined from '@mui/icons-material/FolderOpenOutlined';
import { useTranslation } from 'react-i18next';
import type { EmployeeProfileMock } from '../mocks/employeeProfileMock';
import { ProfileEmptyState } from './ProfileEmptyState';

export function ProfileFilesTab({ mock }: { mock: EmployeeProfileMock }) {
  const { t } = useTranslation('employee');
  return mock.fileCount === 0 ? (
    <ProfileEmptyState
      icon={<FolderOpenOutlined fontSize="large" />}
      title={t('profile.files.empty')}
      hint={t('profile.files.emptyHint')}
    />
  ) : null;
}
