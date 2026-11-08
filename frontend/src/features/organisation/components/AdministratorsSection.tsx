import PersonAddOutlined from '@mui/icons-material/PersonAddOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import InputAdornment from '@mui/material/InputAdornment';
import Pagination from '@mui/material/Pagination';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useDeferredValue, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccess, useCurrentUser } from '@/features/auth';
import { InitialsAvatar } from '@/shared/components/InitialsAvatar';
import { cn } from '@/shared/lib/cn';
import { ADMINISTRATORS_PAGE_SIZE } from '../api/organisationApi';
import { useAdministrators } from '../hooks/useOrganisation';
import type { Administrator } from '../types';
import { NEXT_ROLE, ROLE_BADGE } from '../roles';
import { AddAdministratorDialog } from './AddAdministratorDialog';
import { ChangeRoleDialog } from './ChangeRoleDialog';
import { RowSkeleton } from '@/shared/components/RowSkeleton';

const SKELETON_ROWS = ['s1', 's2', 's3'];
const SEARCH_MAX_LENGTH = 100;

/**
 * Settings → Administrators: the owners and admins of the organisation. Admins see the list;
 * owners add admins and make an admin an owner or an owner an admin (the last owner stays one).
 */
export function AdministratorsSection() {
  const { t, i18n } = useTranslation('organisation');
  const titleId = useId();
  const can = useAccess();
  const me = useCurrentUser().data;
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search.trim());
  const [page, setPage] = useState(0);
  const administrators = useAdministrators(deferredSearch, page);
  const [changing, setChanging] = useState<{ administrator: Administrator; key: number } | null>(
    null,
  );
  const [open, setOpen] = useState(false);
  // Add admin: remounted on each opening (a fresh form and Idempotency-Key).
  const [addOpening, setAddOpening] = useState(0);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const number = (value: number): string => new Intl.NumberFormat(i18n.language).format(value);
  const total = administrators.data?.totalElements ?? 0;
  const pages = Math.max(1, Math.ceil(total / ADMINISTRATORS_PAGE_SIZE));

  return (
    <Card component="section" aria-labelledby={titleId} className="flex flex-col">
      <div className="flex flex-col gap-0.5 border-b border-divider px-4 py-4 sm:px-6">
        <Typography id={titleId} variant="h6" component="h2">
          {t('settings.administrators.title')}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {can('administrators.changeRole')
            ? t('settings.administrators.descriptionOwner')
            : t('settings.administrators.description')}
        </Typography>
      </div>
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TextField
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            label={t('settings.administrators.search')}
            type="search"
            size="small"
            className="sm:max-w-xs"
            slotProps={{
              htmlInput: { maxLength: SEARCH_MAX_LENGTH },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined aria-hidden fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
          {can('administrators.add') && (
            <Button
              ref={addButtonRef}
              variant="contained"
              startIcon={<PersonAddOutlined aria-hidden />}
              onClick={() => {
                setAddOpening((count) => count + 1);
                setIsAddOpen(true);
              }}
              className="self-start"
            >
              {t('settings.administrators.add.open')}
            </Button>
          )}
        </div>
        {administrators.isError ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => void administrators.refetch()}>
                {t('settings.retry')}
              </Button>
            }
          >
            {t('settings.administrators.error')}
          </Alert>
        ) : !administrators.data ? (
          <div aria-busy="true" className="flex flex-col divide-y divide-divider">
            <span className="sr-only">{t('settings.loading')}</span>
            {SKELETON_ROWS.map((key) => (
              <RowSkeleton key={key} />
            ))}
          </div>
        ) : administrators.data.content.length === 0 ? (
          <Typography variant="body2" color="textSecondary">
            {t('settings.administrators.empty')}
          </Typography>
        ) : (
          <ul
            aria-busy={administrators.isPlaceholderData}
            className={cn(
              'm-0 flex list-none flex-col divide-y divide-divider p-0',
              administrators.isPlaceholderData && 'opacity-60',
            )}
          >
            {administrators.data.content.map((administrator) => {
              const isSelf = administrator.id === me?.id;
              return (
                <li key={administrator.id} className="flex flex-wrap items-center gap-3 py-3">
                  <InitialsAvatar
                    id={administrator.id}
                    firstName={administrator.firstName}
                    lastName={administrator.lastName}
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Typography variant="subtitle2" component="p" className="truncate">
                      {`${administrator.firstName} ${administrator.lastName}`}
                      {isSelf && (
                        <Typography component="span" variant="body2" color="textSecondary">
                          {' '}
                          {t('settings.administrators.you')}
                        </Typography>
                      )}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" className="truncate">
                      {administrator.email}
                    </Typography>
                  </div>
                  <Typography
                    variant="caption"
                    component="span"
                    className={cn('rounded-full px-2', ROLE_BADGE[administrator.role])}
                  >
                    {t(`settings.administrators.roles.${administrator.role}`)}
                  </Typography>
                  {can('administrators.changeRole') && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setChanging({ administrator, key: Date.now() });
                        setOpen(true);
                      }}
                      aria-label={t(
                        `settings.administrators.makeFor.${NEXT_ROLE[administrator.role]}`,
                        {
                          name: `${administrator.firstName} ${administrator.lastName}`,
                        },
                      )}
                    >
                      {t(`settings.administrators.make.${NEXT_ROLE[administrator.role]}`)}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {pages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-divider pt-3">
            <Typography variant="caption" color="textSecondary" className="app-tabular">
              {t('settings.administrators.count', { count: total, formatted: number(total) })}
            </Typography>
            <Pagination
              shape="rounded"
              color="primary"
              count={pages}
              page={Math.min(page + 1, pages)}
              siblingCount={0}
              aria-label={t('settings.administrators.pages')}
              onChange={(_event, value) => {
                setPage(value - 1);
              }}
            />
          </div>
        )}
      </div>
      {addOpening > 0 && (
        <AddAdministratorDialog
          key={addOpening}
          open={isAddOpen}
          onClose={() => {
            setIsAddOpen(false);
          }}
          onExited={() => {
            addButtonRef.current?.focus();
          }}
        />
      )}
      {changing && (
        <ChangeRoleDialog
          key={changing.key}
          open={open}
          administrator={changing.administrator}
          isSelf={changing.administrator.id === me?.id}
          onClose={() => {
            setOpen(false);
          }}
          onExited={() => {
            setChanging(null);
          }}
        />
      )}
    </Card>
  );
}
