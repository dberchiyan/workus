import PersonAddAltOutlined from '@mui/icons-material/PersonAddAltOutlined';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Typography from '@mui/material/Typography';
import { useCallback, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { usePageHeadingFocus } from '@/shared/hooks/usePageHeadingFocus';
import { AddEmployeeDialog } from '../components/AddEmployeeDialog';
import { CategoryTabs } from '../components/CategoryTabs';
import { EmployeeList } from '../components/EmployeeList';
import { EmployeeStatsCards } from '../components/EmployeeStatsCards';
import { useEmployeeListParams } from '../hooks/useEmployeeListParams';
import { usePositionCategories } from '../hooks/useEmployeeQueries';

export default function EmployeesPage() {
  const { t } = useTranslation('employee');
  useDocumentTitle(t('pageTitle'));
  const headingRef = usePageHeadingFocus<HTMLHeadingElement>();
  const listId = useId();
  const { params, update } = useEmployeeListParams();
  const { data: counts } = usePositionCategories({ status: params.status, search: params.search });
  const onSearch = useCallback(
    (search: string) => {
      update({ search });
    },
    [update],
  );
  const [isAddOpen, setIsAddOpen] = useState(false);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const [createdName, setCreatedName] = useState<string | null>(null);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Typography
          ref={headingRef}
          tabIndex={-1}
          variant="h4"
          component="h1"
          className="outline-none"
        >
          {t('title')}
        </Typography>
        <Button
          ref={addButtonRef}
          variant="contained"
          startIcon={<PersonAddAltOutlined aria-hidden />}
          onClick={() => {
            setCreatedName(null);
            setIsAddOpen(true);
          }}
        >
          {t('add.open')}
        </Button>
      </div>
      <EmployeeStatsCards />
      <div className="flex flex-col gap-4">
        <CategoryTabs
          counts={counts}
          categoryId={params.categoryId}
          onChange={(categoryId) => {
            update({ categoryId });
          }}
          controlsId={listId}
        />
        <EmployeeList
          id={listId}
          params={params}
          onSort={(field, direction) => {
            // Header click toggles; the phone sort menu passes the direction explicitly.
            const sortDirection =
              direction ??
              (params.sortField === field && params.sortDirection === 'asc' ? 'desc' : 'asc');
            update({ sortField: field, sortDirection });
          }}
          onSearch={onSearch}
          onStatus={(status) => {
            update({ status });
          }}
          onPage={(page, size) => {
            update({ page, size });
          }}
          onClear={() => {
            update({ search: '', status: 'ACTIVE', categoryId: undefined });
          }}
        />
      </div>
      <AddEmployeeDialog
        open={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
        }}
        onCreated={(employee) => {
          setIsAddOpen(false);
          setCreatedName(`${employee.firstName} ${employee.lastName}`);
        }}
        onExited={() => {
          // Dialog closed → focus returns to its trigger (ux.md → Focus moves with the UI).
          addButtonRef.current?.focus();
        }}
      />
      {/* Polite status; stays until dismissed or replaced (no auto-dismiss of unread messages). */}
      <Snackbar
        open={createdName !== null}
        onClose={(_event, reason) => {
          if (reason !== 'clickaway') {
            setCreatedName(null);
          }
        }}
        message={createdName ? t('add.created', { name: createdName }) : ''}
        action={
          <Button
            color="inherit"
            size="small"
            onClick={() => {
              setCreatedName(null);
            }}
          >
            {t('add.dismiss')}
          </Button>
        }
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        slotProps={{ content: { role: 'status' } }}
      />
    </div>
  );
}
