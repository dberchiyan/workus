import FolderOpenOutlined from '@mui/icons-material/FolderOpenOutlined';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import type { EmployeeProfileMock } from '../mocks/employee-profile-mock';
import { ProfileEmptyState } from './profile-empty-state';

export function ProfileFilesTab({ mock }: { mock: EmployeeProfileMock }): ReactElement | null {
    const { t } = useTranslation('employee');
    return mock.fileCount === 0 ? (
        <ProfileEmptyState
            icon={<FolderOpenOutlined fontSize="large" />}
            title={t('profile.files.empty')}
            hint={t('profile.files.emptyHint')}
        />
    ) : null;
}
