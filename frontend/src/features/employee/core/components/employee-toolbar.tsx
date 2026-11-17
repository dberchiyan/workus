import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import type { EmployeeListParams, EmployeeStatus } from '../types';
import { EmployeeSearchField } from './employee-search-field';

const STATUSES: readonly EmployeeStatus[] = ['ACTIVE', 'TERMINATED'];
const SORTS = ['name,asc', 'name,desc', 'startsAt,desc', 'startsAt,asc'] as const;
type SortOption = (typeof SORTS)[number];

export interface EmployeeToolbarProps {
    params: EmployeeListParams;
    total: number | undefined;
    onSearch: (search: string) => void;
    onStatus: (status: EmployeeStatus) => void;
    onSort: (sortField: EmployeeListParams['sortField'], sortDirection: EmployeeListParams['sortDirection']) => void;
}

/** Search, Active/Terminated and — on phones, where there are no column headers — sort. */
export function EmployeeToolbar({ params, total, onSearch, onStatus, onSort }: EmployeeToolbarProps): ReactElement {
    const { t, i18n } = useTranslation('employee');
    const sort: SortOption = `${params.sortField},${params.sortDirection}`;

    return (
        <div className="flex flex-col gap-3 border-b border-divider p-4 sm:flex-row sm:flex-wrap sm:items-center">
            <EmployeeSearchField value={params.search} onSearch={onSearch} />
            <Typography variant="body2" color="textSecondary" role="status" className="app-tabular whitespace-nowrap">
                {total === undefined
                    ? ''
                    : t('list.count', {
                          count: total,
                          formatted: new Intl.NumberFormat(i18n.language).format(total),
                      })}
            </Typography>
            <ToggleButtonGroup
                exclusive
                size="small"
                value={params.status}
                onChange={(_event, value: EmployeeStatus | null) => {
                    if (value) {
                        onStatus(value);
                    }
                }}
                aria-label={t('filters.status')}
                className="sm:ml-auto"
            >
                {STATUSES.map((status) => (
                    <ToggleButton key={status} value={status} className="flex-1 sm:flex-none">
                        {t(`status.${status}`)}
                    </ToggleButton>
                ))}
            </ToggleButtonGroup>
            <TextField
                select
                size="small"
                label={t('filters.sort')}
                value={sort}
                onChange={(event) => {
                    const option = SORTS.find((candidate) => candidate === event.target.value);
                    if (option) {
                        const [field, direction] =
                            option === 'name,asc' || option === 'name,desc'
                                ? (['name', option === 'name,asc' ? 'asc' : 'desc'] as const)
                                : (['startsAt', option === 'startsAt,asc' ? 'asc' : 'desc'] as const);
                        onSort(field, direction);
                    }
                }}
                className="md:hidden"
            >
                {SORTS.map((option) => (
                    <MenuItem key={option} value={option}>
                        {t(`filters.sortOptions.${option}`)}
                    </MenuItem>
                ))}
            </TextField>
        </div>
    );
}
