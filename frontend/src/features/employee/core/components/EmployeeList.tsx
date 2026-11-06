import Card from '@mui/material/Card';
import LinearProgress from '@mui/material/LinearProgress';
import { useTheme } from '@mui/material/styles';
import TablePagination from '@mui/material/TablePagination';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTranslation } from 'react-i18next';
import { PAGE_SIZES } from '../hooks/useEmployeeListParams';
import { useEmployees } from '../hooks/useEmployeeQueries';
import type { EmployeeListParams, EmployeeStatus } from '../types';
import { EmployeeCardList } from './EmployeeCardList';
import { EmployeeListEmpty, EmployeeListError, EmployeeListLoading } from './EmployeeListStates';
import { EmployeeTable } from './EmployeeTable';
import { EmployeeToolbar } from './EmployeeToolbar';

export interface EmployeeListProps {
  id: string;
  params: EmployeeListParams;
  onSort: (
    field: EmployeeListParams['sortField'],
    direction?: EmployeeListParams['sortDirection'],
  ) => void;
  onSearch: (search: string) => void;
  onStatus: (status: EmployeeStatus) => void;
  onPage: (page: number, size: number) => void;
  onClear: () => void;
}

/** Toolbar, list and pagination as one block; table ↔ cards by width. */
export function EmployeeList({
  id,
  params,
  onSort,
  onSearch,
  onStatus,
  onPage,
  onClear,
}: EmployeeListProps) {
  const { t } = useTranslation('employee');
  const theme = useTheme();
  // Behaviour CSS cannot express: which markup (table or cards) is rendered.
  const isTable = useMediaQuery(theme.breakpoints.up('md'));
  const { data, isPending, isError, error, refetch, isPlaceholderData, isFetching } =
    useEmployees(params);

  const content = () => {
    if (isPending) {
      return <EmployeeListLoading />;
    }
    if (isError) {
      return <EmployeeListError error={error} onRetry={() => void refetch()} />;
    }
    if (data.content.length === 0) {
      return <EmployeeListEmpty onClear={onClear} />;
    }
    return isTable ? (
      <EmployeeTable
        employees={data.content}
        params={params}
        onSort={(field) => {
          onSort(field);
        }}
      />
    ) : (
      <EmployeeCardList employees={data.content} />
    );
  };

  return (
    // overflow-visible: the table header sticks to the page, which `overflow: hidden` would stop.
    <Card variant="outlined" id={id} aria-busy={isFetching} className="relative overflow-visible">
      <EmployeeToolbar
        params={params}
        total={data?.totalElements}
        onSearch={onSearch}
        onStatus={onStatus}
        onSort={(field, direction) => {
          onSort(field, direction);
        }}
      />
      {isFetching && isPlaceholderData && <LinearProgress aria-hidden className="h-0.5" />}
      {content()}
      {data && data.totalElements > 0 && (
        <TablePagination
          component="div"
          count={data.totalElements}
          page={params.page - 1}
          rowsPerPage={params.size}
          rowsPerPageOptions={[...PAGE_SIZES]}
          onPageChange={(_event, page) => {
            onPage(page + 1, params.size);
          }}
          onRowsPerPageChange={(event) => {
            onPage(1, Number(event.target.value));
          }}
          labelRowsPerPage={t('pagination.rowsPerPage')}
          labelDisplayedRows={({ from, to, count }) =>
            t('pagination.displayed', { from, to, count })
          }
          className="border-t border-divider"
        />
      )}
    </Card>
  );
}
