import AccountTreeOutlined from '@mui/icons-material/AccountTreeOutlined';
import AddOutlined from '@mui/icons-material/AddOutlined';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { trackScrollEdges } from '@/shared/lib/scrollEdges';
import {
  useCompanyStructure,
  useCreateDepartment,
  useRemoveDepartment,
  useRemovePosition,
} from '../hooks/useCompanyStructure';
import type { Department } from '../types';
import { DepartmentPanel } from './DepartmentPanel';
import { type RemoveStructureItem, RemoveStructureItemDialog } from './RemoveStructureItemDialog';
import { StructureNameForm } from './StructureNameForm';

/** People holding the department's positions today. */
const departmentPeople = (department: Department): number =>
  department.positions.reduce((sum, position) => sum + position.employeeCount, 0);

/**
 * Settings → Company structure (admins and owners): the company's departments and the positions
 * in them — what people are given when they are added or edited. Departments on the left (a
 * scrolling row on phones), the open one's positions on the right; names are typed in place.
 */
export function CompanyStructureSection() {
  const { t, i18n } = useTranslation('employee');
  const titleId = useId();
  const structure = useCompanyStructure();
  const createDepartment = useCreateDepartment();
  const removeDepartment = useRemoveDepartment();
  const removePosition = useRemovePosition();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addingDepartment, setAddingDepartment] = useState(false);
  // One key per logical add, reused on a retry of that add; a new one after each success.
  const departmentKey = useRef(crypto.randomUUID());
  const [removing, setRemoving] = useState<RemoveStructureItem | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const number = (value: number) => new Intl.NumberFormat(i18n.language).format(value);

  const departments = structure.data?.departments ?? [];
  const selected =
    departments.find((department) => department.id === selectedId) ?? departments[0] ?? null;

  const startAddDepartment = (): void => {
    departmentKey.current = crypto.randomUUID();
    setAddingDepartment(true);
  };

  const addDepartmentForm = addingDepartment && (
    <StructureNameForm
      kind="department"
      label={t('structure.departmentName')}
      onSave={async (name) => {
        const created = await createDepartment.mutateAsync({
          name,
          idempotencyKey: departmentKey.current,
        });
        departmentKey.current = crypto.randomUUID();
        setAddingDepartment(false);
        setSelectedId(created.id);
      }}
      onCancel={() => {
        setAddingDepartment(false);
      }}
    />
  );

  const body = (() => {
    if (structure.isPending) {
      return (
        <div aria-busy="true" className="grid gap-4 p-4 sm:p-6 md:grid-cols-[15rem_minmax(0,1fr)]">
          <span className="sr-only">{t('structure.loading')}</span>
          <div className="flex flex-col gap-2">
            {['d1', 'd2', 'd3', 'd4'].map((key) => (
              <Skeleton key={key} variant="rounded" height={52} />
            ))}
          </div>
          <div className="flex flex-col gap-2">
            {['p1', 'p2', 'p3'].map((key) => (
              <Skeleton key={key} variant="rounded" height={56} />
            ))}
          </div>
        </div>
      );
    }
    if (structure.isError) {
      return (
        <div className="p-4 sm:p-6">
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => void structure.refetch()}>
                {t('structure.retry')}
              </Button>
            }
          >
            {t('structure.error')}
          </Alert>
        </div>
      );
    }
    if (departments.length === 0 && !addingDepartment) {
      return (
        <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
          <span className="rounded-2xl flex size-14 items-center justify-center bg-badge-active-background text-badge-active-text">
            <AccountTreeOutlined aria-hidden />
          </span>
          <Typography variant="subtitle1" component="p">
            {t('structure.empty')}
          </Typography>
          <Typography variant="body2" color="textSecondary" className="max-w-sm">
            {t('structure.emptyHint')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddOutlined aria-hidden />}
            onClick={startAddDepartment}
          >
            {t('structure.addDepartment')}
          </Button>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-[15rem_minmax(0,1fr)]">
        <nav
          aria-label={t('structure.departments')}
          className="min-w-0 border-b border-divider p-3 md:border-r md:border-b-0"
        >
          <ul
            ref={trackScrollEdges}
            className="app-scroll-fade m-0 flex list-none gap-1 overflow-x-auto p-0 md:flex-col md:overflow-visible"
          >
            {departments.map((department) => {
              const isSelected = department.id === selected?.id;
              return (
                <li key={department.id} className="shrink-0">
                  <button
                    type="button"
                    aria-current={isSelected ? 'true' : undefined}
                    onClick={() => {
                      setSelectedId(department.id);
                    }}
                    className={cn(
                      'flex w-full min-w-0 cursor-pointer flex-col items-start gap-0.5 rounded-md border-0 bg-transparent px-3 py-2 text-left transition-colors',
                      'outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary',
                      isSelected
                        ? 'bg-badge-active-background text-badge-active-text'
                        : 'text-text-primary hover:bg-badge-neutral-background',
                    )}
                  >
                    <Typography
                      variant="subtitle2"
                      component="span"
                      className="max-w-full truncate"
                    >
                      {department.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      component="span"
                      className={cn(
                        'app-tabular whitespace-nowrap',
                        !isSelected && 'text-text-secondary',
                      )}
                    >
                      {t('structure.departmentSummary', {
                        positions: number(department.positions.length),
                        count: departmentPeople(department),
                        people: number(departmentPeople(department)),
                      })}
                    </Typography>
                  </button>
                </li>
              );
            })}
          </ul>
          {addDepartmentForm && <div className="mt-2 hidden md:block">{addDepartmentForm}</div>}
        </nav>
        <div className="min-w-0">
          {addDepartmentForm && (
            <div className="border-b border-divider p-3 md:hidden">{addDepartmentForm}</div>
          )}
          {selected && (
            <DepartmentPanel
              // A fresh panel (and its open forms) per department; it fades in.
              key={selected.id}
              department={selected}
              onRemoveDepartment={() => {
                setRemoving({ kind: 'department', id: selected.id, name: selected.name });
                setRemoveOpen(true);
              }}
              onRemovePosition={(position) => {
                setRemoving({ kind: 'position', id: position.id, name: position.title });
                setRemoveOpen(true);
              }}
            />
          )}
        </div>
      </div>
    );
  })();

  return (
    <Card component="section" aria-labelledby={titleId} className="flex flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-divider px-4 py-4 sm:px-6">
        <div className="flex min-w-0 flex-col gap-0.5">
          <Typography id={titleId} variant="h6" component="h2">
            {t('structure.title')}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {t('structure.description')}
          </Typography>
        </div>
        {departments.length > 0 && (
          <Button
            variant="outlined"
            startIcon={<AddOutlined aria-hidden />}
            onClick={startAddDepartment}
            disabled={addingDepartment}
          >
            {t('structure.addDepartment')}
          </Button>
        )}
      </div>
      {body}
      <RemoveStructureItemDialog
        item={removing}
        open={removeOpen}
        busy={removeDepartment.isPending || removePosition.isPending}
        onConfirm={async (item) => {
          if (item.kind === 'department') {
            await removeDepartment.mutateAsync(item.id);
            setSelectedId(null);
          } else {
            await removePosition.mutateAsync(item.id);
          }
        }}
        onClose={() => {
          setRemoveOpen(false);
        }}
        onExited={() => {
          setRemoving(null);
        }}
      />
    </Card>
  );
}
