import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { formatCalendarDate } from '../format';
import type { EmployeeListItem, EmployeeListParams } from '../types';
import { EmployeeIdentity } from './EmployeeIdentity';
import { EmployeeStatusChip } from './EmployeeStatusChip';
import { ResponsibleAvatars } from './ResponsibleAvatars';

type SortField = EmployeeListParams['sortField'];

/** Fixed widths, so columns never jump between pages and tabs. */
const COLUMNS = [
  { key: 'name', width: 'w-[30%]' },
  { key: 'position', width: 'w-[22%]' },
  { key: 'responsible', width: 'w-[22%]' },
  { key: 'startDate', width: 'w-[14%]' },
  { key: 'status', width: 'w-[12%]' },
] as const;

/** Header cells stick below the top bar while the page scrolls. */
// z-20: above the row's interactive bits (`relative z-10` — responsible tooltip, stretched link).
const HEAD_CELL = 'top-top-bar-height z-20';

export interface EmployeeTableProps {
  employees: readonly EmployeeListItem[];
  params: EmployeeListParams;
  onSort: (field: SortField) => void;
}

export function EmployeeTable({ employees, params, onSort }: EmployeeTableProps) {
  const { t, i18n } = useTranslation('employee');

  const sortableHeader = (field: SortField, label: string) => {
    const isActive = params.sortField === field;
    return (
      <TableCell
        scope="col"
        className={HEAD_CELL}
        sortDirection={isActive ? params.sortDirection : false}
        aria-sort={
          isActive ? (params.sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'
        }
      >
        {/* Arrow only on the active column; on the others it appears on hover (MUI default). */}
        <TableSortLabel
          active={isActive}
          direction={isActive ? params.sortDirection : 'asc'}
          onClick={() => {
            onSort(field);
          }}
        >
          {label}
        </TableSortLabel>
      </TableCell>
    );
  };

  return (
    // `isolate`: the row and header z-indexes stay inside the table, under the app top bar.
    <Table stickyHeader size="small" className="isolate table-fixed">
      <caption className="sr-only">{t('table.caption')}</caption>
      {/* Percentages are one-off geometry for this table's columns. */}
      <colgroup>
        {COLUMNS.map((column) => (
          <col key={column.key} className={column.width} />
        ))}
      </colgroup>
      <TableHead>
        <TableRow>
          {sortableHeader('name', t('table.name'))}
          <TableCell scope="col" className={HEAD_CELL}>
            {t('table.position')}
          </TableCell>
          <TableCell scope="col" className={HEAD_CELL}>
            {t('table.responsible')}
          </TableCell>
          {sortableHeader('startDate', t('table.startDate'))}
          <TableCell scope="col" className={HEAD_CELL}>
            {t('table.status')}
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {employees.map((employee) => (
          <TableRow key={employee.id} hover className="relative h-15 cursor-pointer">
            <TableCell component="th" scope="row">
              <EmployeeIdentity employee={employee} isCompact />
            </TableCell>
            <TableCell>
              <Typography variant="body2" className="truncate" title={employee.position.title}>
                {employee.position.title}
              </Typography>
            </TableCell>
            <TableCell>
              <ResponsibleAvatars employee={employee} />
            </TableCell>
            <TableCell>
              <Typography variant="body2" className="app-tabular whitespace-nowrap">
                {formatCalendarDate(employee.startDate, i18n.language)}
              </Typography>
            </TableCell>
            <TableCell>
              <EmployeeStatusChip status={employee.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
