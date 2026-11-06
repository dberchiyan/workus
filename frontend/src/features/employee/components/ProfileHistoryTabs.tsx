import FolderOpenOutlined from '@mui/icons-material/FolderOpenOutlined';
import HistoryOutlined from '@mui/icons-material/HistoryOutlined';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { formatCalendarDate } from '../format';
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

/** Newest first. */
export function ProfileActionsTab({ mock }: { mock: EmployeeProfileMock }) {
  const { t, i18n } = useTranslation('employee');
  if (mock.actions.length === 0) {
    return (
      <ProfileEmptyState
        icon={<HistoryOutlined fontSize="large" />}
        title={t('profile.actions.empty')}
      />
    );
  }
  return (
    <ol className="m-0 flex list-none flex-col divide-y divide-divider p-0">
      {[...mock.actions].reverse().map((action) => (
        <li
          key={action.id}
          className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-1 px-4 py-3 sm:grid-cols-[10rem_8rem_1fr] sm:px-6"
        >
          {/* Column widths: one-off geometry for this timeline. */}
          <Typography variant="body2" color="textSecondary" className="app-tabular">
            {formatCalendarDate(action.date, i18n.language)}
          </Typography>
          <Chip
            size="small"
            label={t(`profile.actions.kind.${action.kind}`)}
            className="justify-self-start"
          />
          <Typography variant="body2" className="col-span-2 sm:col-span-1">
            {action.text}
          </Typography>
        </li>
      ))}
    </ol>
  );
}
