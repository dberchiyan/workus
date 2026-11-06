import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { formatCalendarDate } from '../format';
import type { EmployeeListItem } from '../types';
import { EmployeeIdentity } from './EmployeeIdentity';
import { EmployeeStatusChip } from './EmployeeStatusChip';
import { ResponsibleAvatars } from './ResponsibleAvatars';

export interface EmployeeCardListProps {
  employees: readonly EmployeeListItem[];
}

/** Phones: the table becomes stacked cards (ux.md → Patterns). */
export function EmployeeCardList({ employees }: EmployeeCardListProps) {
  const { t, i18n } = useTranslation('employee');
  return (
    <ul className="m-0 flex list-none flex-col divide-y divide-divider p-0">
      {employees.map((employee) => (
        <li key={employee.id} className="flex flex-col gap-3 px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <EmployeeIdentity employee={employee} />
            <EmployeeStatusChip status={employee.status} />
          </div>
          <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2">
            <Typography variant="caption" component="dt" color="textSecondary">
              {t('table.position')}
            </Typography>
            <Typography variant="body2" component="dd">
              {employee.position.title}
            </Typography>
            <Typography variant="caption" component="dt" color="textSecondary">
              {t('table.startDate')}
            </Typography>
            <Typography variant="body2" component="dd" className="app-tabular">
              {formatCalendarDate(employee.startDate, i18n.language)}
            </Typography>
            <Typography variant="caption" component="dt" color="textSecondary">
              {t('table.responsible')}
            </Typography>
            <dd className="m-0">
              <ResponsibleAvatars employee={employee} />
            </dd>
          </dl>
        </li>
      ))}
    </ul>
  );
}
