import AddOutlined from '@mui/icons-material/AddOutlined';
import ChevronRightOutlined from '@mui/icons-material/ChevronRightOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import WorkOutlineOutlined from '@mui/icons-material/WorkOutlineOutlined';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import {
  useCreatePosition,
  useRenameDepartment,
  useRenamePosition,
} from '../hooks/useCompanyStructure';
import type { Department, StructurePosition } from '../types';
import { PositionHoldersDialog } from './PositionHoldersDialog';
import { StructureNameForm } from './StructureNameForm';

/** Row actions: shown on hover or focus where there is a mouse, always on touch screens. */
const ROW_ACTIONS =
  'flex shrink-0 items-center transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100';

/** A disabled button says why in a tooltip (the wrapper takes the hover and focus). */
function ActionButton({
  label,
  reason,
  onClick,
  children,
}: {
  label: string;
  reason?: string | undefined;
  onClick: () => void;
  children: React.ReactNode;
}) {
  if (reason) {
    return (
      <Tooltip title={reason}>
        {/* A disabled button gets no events; its focusable wrapper explains why. */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- tooltip trigger for a disabled action (WAI-ARIA tooltip pattern) */}
        <span tabIndex={0} aria-label={`${label}. ${reason}`} className="inline-flex rounded-full">
          <IconButton aria-label={label} disabled>
            {children}
          </IconButton>
        </span>
      </Tooltip>
    );
  }
  return (
    <IconButton aria-label={label} onClick={onClick}>
      {children}
    </IconButton>
  );
}

export interface DepartmentPanelProps {
  department: Department;
  onRemoveDepartment: () => void;
  onRemovePosition: (position: StructurePosition) => void;
}

/** One department: its name (renamed in place), then its positions with who holds them. */
export function DepartmentPanel({
  department,
  onRemoveDepartment,
  onRemovePosition,
}: DepartmentPanelProps) {
  const { t, i18n } = useTranslation('employee');
  const renameDepartment = useRenameDepartment();
  const renamePosition = useRenamePosition();
  const createPosition = useCreatePosition();
  const [renaming, setRenaming] = useState(false);
  const [renamingPositionId, setRenamingPositionId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  // Kept after closing until the dialog has faded out; `opening` remounts it on page 1.
  const [holders, setHolders] = useState<{ position: StructurePosition; opening: number } | null>(
    null,
  );
  const [holdersOpen, setHoldersOpen] = useState(false);
  const positionKey = useRef(crypto.randomUUID());
  const number = (value: number) => new Intl.NumberFormat(i18n.language).format(value);
  const people = department.positions.reduce((sum, position) => sum + position.employeeCount, 0);

  return (
    <div className="app-value-in flex flex-col">
      <div className="flex min-h-18 items-center justify-between gap-3 border-b border-divider px-4 py-3 sm:px-6">
        {renaming ? (
          <StructureNameForm
            kind="department"
            label={t('structure.departmentName')}
            defaultValue={department.name}
            onSave={async (name) => {
              await renameDepartment.mutateAsync({
                departmentId: department.id,
                name,
                version: department.version,
              });
              setRenaming(false);
            }}
            onCancel={() => {
              setRenaming(false);
            }}
            className="-mb-5 flex-1"
          />
        ) : (
          <>
            <div className="flex min-w-0 flex-col">
              <Typography variant="h6" component="h3" className="truncate">
                {department.name}
              </Typography>
              <Typography variant="caption" color="textSecondary" className="app-tabular">
                {t('structure.departmentSummary', {
                  positions: number(department.positions.length),
                  count: people,
                  people: number(people),
                })}
              </Typography>
            </div>
            <div className="flex shrink-0 items-center">
              <ActionButton
                label={t('structure.renameDepartment', { name: department.name })}
                onClick={() => {
                  setRenaming(true);
                }}
              >
                <EditOutlined fontSize="small" />
              </ActionButton>
              <ActionButton
                label={t('structure.removeDepartment', { name: department.name })}
                reason={
                  department.positions.length > 0
                    ? t('structure.departmentHasPositions')
                    : undefined
                }
                onClick={onRemoveDepartment}
              >
                <DeleteOutlineOutlined fontSize="small" />
              </ActionButton>
            </div>
          </>
        )}
      </div>

      <ul className="m-0 flex list-none flex-col p-2 sm:px-3">
        {department.positions.map((position) => (
          <li
            key={position.id}
            className="group flex min-h-14 items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-badge-neutral-background/60 sm:px-3"
          >
            {renamingPositionId === position.id ? (
              <StructureNameForm
                kind="position"
                label={t('structure.positionTitle')}
                defaultValue={position.title}
                onSave={async (title) => {
                  await renamePosition.mutateAsync({
                    positionId: position.id,
                    title,
                    version: position.version,
                  });
                  setRenamingPositionId(null);
                }}
                onCancel={() => {
                  setRenamingPositionId(null);
                }}
                className="-mb-5 flex-1 pt-1"
              />
            ) : (
              <>
                <span
                  aria-hidden
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-badge-active-background text-badge-active-text"
                >
                  <WorkOutlineOutlined fontSize="small" />
                </span>
                {/* On a phone the count goes under the title, so the title keeps its width. */}
                <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5 sm:flex-row sm:items-center sm:gap-3">
                  <Typography
                    variant="subtitle2"
                    component="span"
                    className="max-w-full min-w-0 truncate sm:flex-1"
                  >
                    {position.title}
                  </Typography>
                  {position.employeeCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setHolders((current) => ({
                          position,
                          opening: (current?.opening ?? 0) + 1,
                        }));
                        setHoldersOpen(true);
                      }}
                      aria-label={t('structure.holders.open', {
                        count: position.employeeCount,
                        people: number(position.employeeCount),
                        title: position.title,
                      })}
                      className={cn(
                        'group/count -mx-1 flex shrink-0 cursor-pointer items-center gap-0.5 rounded-full border-0 bg-transparent py-0.5 pr-1 pl-1 text-badge-active-text transition-colors sm:mx-0 sm:bg-badge-active-background sm:pr-1 sm:pl-2.5',
                        'hover:bg-badge-active-background sm:hover:bg-primary sm:hover:text-primary-contrast-text',
                        'outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary',
                      )}
                    >
                      <Typography variant="caption" component="span" className="app-tabular">
                        {t('structure.people', {
                          count: position.employeeCount,
                          people: number(position.employeeCount),
                        })}
                      </Typography>
                      <ChevronRightOutlined
                        aria-hidden
                        className="size-4 transition-transform group-hover/count:translate-x-0.5"
                      />
                    </button>
                  ) : (
                    <Typography
                      variant="caption"
                      component="span"
                      color="textSecondary"
                      className="app-tabular shrink-0 py-0.5"
                    >
                      {t('structure.nobody')}
                    </Typography>
                  )}
                </span>
                <span className={ROW_ACTIONS}>
                  <ActionButton
                    label={t('structure.renamePosition', { title: position.title })}
                    onClick={() => {
                      setRenamingPositionId(position.id);
                    }}
                  >
                    <EditOutlined fontSize="small" />
                  </ActionButton>
                  <ActionButton
                    label={t('structure.removePosition', { title: position.title })}
                    reason={
                      position.removable
                        ? undefined
                        : position.employeeCount > 0
                          ? t('structure.positionHeld')
                          : t('structure.positionHeldBefore')
                    }
                    onClick={() => {
                      onRemovePosition(position);
                    }}
                  >
                    <DeleteOutlineOutlined fontSize="small" />
                  </ActionButton>
                </span>
              </>
            )}
          </li>
        ))}
        {department.positions.length === 0 && !adding && (
          <li className="px-3 py-6 text-center">
            <Typography variant="body2" color="textSecondary">
              {t('structure.noPositions')}
            </Typography>
          </li>
        )}
        <li className="px-2 pt-1 pb-1 sm:px-3">
          {adding ? (
            <StructureNameForm
              kind="position"
              label={t('structure.positionTitle')}
              keepOpen
              onSave={async (title) => {
                await createPosition.mutateAsync({
                  departmentId: department.id,
                  title,
                  idempotencyKey: positionKey.current,
                });
                positionKey.current = crypto.randomUUID();
              }}
              onCancel={() => {
                setAdding(false);
              }}
              className="pt-1"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                positionKey.current = crypto.randomUUID();
                setAdding(true);
              }}
              className={cn(
                'flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-divider bg-transparent text-text-secondary transition-colors',
                'hover:border-primary hover:bg-badge-active-background hover:text-badge-active-text',
                'outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary',
              )}
            >
              <AddOutlined aria-hidden fontSize="small" />
              <Typography variant="subtitle2" component="span">
                {t('structure.addPosition')}
              </Typography>
            </button>
          )}
        </li>
      </ul>
      {holders && (
        <PositionHoldersDialog
          key={holders.opening}
          open={holdersOpen}
          departmentName={department.name}
          position={holders.position}
          onClose={() => {
            setHoldersOpen(false);
          }}
          onExited={() => {
            setHolders(null);
          }}
        />
      )}
    </div>
  );
}
