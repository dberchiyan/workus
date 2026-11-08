import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import InputAdornment from '@mui/material/InputAdornment';
import Pagination from '@mui/material/Pagination';
import Skeleton from '@mui/material/Skeleton';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useDeferredValue, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useParams } from 'react-router';
import { InitialsAvatar } from '@/shared/components/InitialsAvatar';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { usePageHeadingFocus } from '@/shared/hooks/usePageHeadingFocus';
import { cn } from '@/shared/lib/cn';
import { PATHS } from '@/shared/lib/paths';
import { COMPANY_PEOPLE_PAGE_SIZE } from '../api/platformApi';
import { CompanyStatusChip } from '../components/CompanyStatusChip';
import { DecideCompanyDialog } from '../components/DecideCompanyDialog';
import { useCompany, useCompanyPeople } from '../hooks/usePlatform';
import type { Company, CompanyPeople } from '../types';
import { RowSkeleton } from '@/shared/components/RowSkeleton';

const PEOPLE: readonly CompanyPeople[] = ['OWNER', 'ADMIN', 'EMPLOYEE'];

/** One company (platform admins): who owns it, how big it is, the decision, and its people. */
export default function CompanyPage() {
  const { t } = useTranslation('platform');
  const { organisationId = '' } = useParams();
  const company = useCompany(organisationId);
  useDocumentTitle(company.data?.name ?? t('company.pageTitle'));

  return (
    <div className="flex flex-col gap-6">
      <Button
        component={RouterLink}
        to={PATHS.platform}
        startIcon={<ArrowBackOutlined aria-hidden />}
        className="self-start"
      >
        {t('company.back')}
      </Button>
      {company.isError ? (
        <Alert severity="error">{t('company.error')}</Alert>
      ) : !company.data ? (
        <Skeleton variant="rounded" height={180} />
      ) : (
        <>
          <CompanyHeader company={company.data} />
          <PeopleCard organisationId={company.data.id} />
        </>
      )}
    </div>
  );
}

function CompanyHeader({ company }: { company: Company }) {
  const { t, i18n } = useTranslation('platform');
  const headingRef = usePageHeadingFocus<HTMLHeadingElement>();
  const [dialog, setDialog] = useState<{ decision: 'approve' | 'reject'; key: number } | null>(
    null,
  );
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const date = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeZone: 'UTC' });
  const number = new Intl.NumberFormat(i18n.language);
  const start = (decision: 'approve' | 'reject', trigger: HTMLButtonElement): void => {
    triggerRef.current = trigger;
    setDialog({ decision, key: Date.now() });
    setOpen(true);
  };

  return (
    <Card className="flex flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-3">
            <Typography
              ref={headingRef}
              tabIndex={-1}
              variant="h4"
              component="h1"
              className="outline-none"
            >
              {company.name}
            </Typography>
            <CompanyStatusChip status={company.status} />
          </div>
          <Typography variant="body2" color="textSecondary">
            {t('companies.registered', { date: date.format(new Date(company.createdAt)) })}
            {' · '}
            {t('companies.size', {
              admins: number.format(company.adminCount),
              employees: number.format(company.activeEmployeeCount),
            })}
          </Typography>
        </div>
        <div className="flex flex-wrap gap-2">
          {company.status === 'PENDING' && (
            <Button
              variant="outlined"
              color="error"
              onClick={(event) => {
                start('reject', event.currentTarget);
              }}
            >
              {t('decide.reject')}
            </Button>
          )}
          {company.status !== 'ACTIVE' && (
            <Button
              variant="contained"
              onClick={(event) => {
                start('approve', event.currentTarget);
              }}
            >
              {t('decide.approve')}
            </Button>
          )}
        </div>
      </div>
      {company.decidedAt && company.decidedBy && (
        <Typography variant="body2" color="textSecondary">
          {t(company.status === 'REJECTED' ? 'company.rejectedBy' : 'company.approvedBy', {
            name: `${company.decidedBy.firstName} ${company.decidedBy.lastName}`,
            date: date.format(new Date(company.decidedAt)),
          })}
        </Typography>
      )}
      {company.status === 'REJECTED' && company.rejectionReason && (
        <Alert severity="error">{company.rejectionReason}</Alert>
      )}
      {dialog && (
        <DecideCompanyDialog
          key={dialog.key}
          company={company}
          decision={dialog.decision}
          open={open}
          onClose={() => {
            setOpen(false);
          }}
          onExited={() => {
            setDialog(null);
            triggerRef.current?.focus();
          }}
        />
      )}
    </Card>
  );
}

function PeopleCard({ organisationId }: { organisationId: string }) {
  const { t, i18n } = useTranslation('platform');
  const titleId = useId();
  const [people, setPeople] = useState<CompanyPeople>('OWNER');
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search.trim());
  const [page, setPage] = useState(0);
  const result = useCompanyPeople(organisationId, people, deferredSearch, page);
  const date = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeZone: 'UTC' });
  const number = new Intl.NumberFormat(i18n.language);
  const total = result.data?.totalElements ?? 0;
  const pages = Math.max(1, Math.ceil(total / COMPANY_PEOPLE_PAGE_SIZE));

  return (
    <Card component="section" aria-labelledby={titleId} className="flex flex-col">
      <div className="flex flex-col gap-1 border-b border-divider px-4 pt-4 sm:px-6">
        <Typography id={titleId} variant="h6" component="h2">
          {t('company.people')}
        </Typography>
        <Tabs
          value={people}
          onChange={(_event, value: CompanyPeople) => {
            setPeople(value);
            setPage(0);
          }}
          variant="scrollable"
          allowScrollButtonsMobile
          aria-label={t('company.people')}
        >
          {PEOPLE.map((value) => (
            <Tab key={value} value={value} label={t(`people.${value}`)} />
          ))}
        </Tabs>
      </div>
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <TextField
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(0);
          }}
          label={t('company.search')}
          type="search"
          size="small"
          className="sm:max-w-xs"
          slotProps={{
            htmlInput: { maxLength: 100 },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined aria-hidden fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        {result.isError ? (
          <Alert severity="error">{t('company.peopleError')}</Alert>
        ) : !result.data ? (
          <div aria-busy="true" className="flex flex-col divide-y divide-divider">
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </div>
        ) : result.data.content.length === 0 ? (
          <Typography variant="body2" color="textSecondary" className="py-6 text-center">
            {t('company.noPeople')}
          </Typography>
        ) : (
          <ul
            aria-busy={result.isPlaceholderData}
            className={cn(
              'm-0 flex list-none flex-col divide-y divide-divider p-0',
              result.isPlaceholderData && 'opacity-60',
            )}
          >
            {result.data.content.map((user) => (
              <li key={user.id} className="flex flex-wrap items-center gap-3 py-3">
                <InitialsAvatar id={user.id} firstName={user.firstName} lastName={user.lastName} />
                <div className="flex min-w-0 flex-1 basis-48 flex-col">
                  <Typography variant="subtitle2" component="p" className="truncate">
                    {`${user.firstName} ${user.lastName}`}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" className="truncate">
                    {user.email}
                  </Typography>
                </div>
                <Typography variant="body2" color="textSecondary" className="whitespace-nowrap">
                  {t(`role.${user.role}`)}
                </Typography>
                <Typography
                  variant="caption"
                  component="span"
                  className={cn(
                    'rounded-full px-2',
                    user.status === 'ACTIVE'
                      ? 'bg-success/15 text-success'
                      : 'bg-badge-neutral-background text-text-secondary',
                  )}
                >
                  {t(`userStatus.${user.status}`)}
                </Typography>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  className="app-tabular whitespace-nowrap"
                >
                  {t('company.added', { date: date.format(new Date(user.createdAt)) })}
                </Typography>
              </li>
            ))}
          </ul>
        )}
        {pages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-divider pt-3">
            <Typography variant="caption" color="textSecondary" className="app-tabular">
              {t('company.range', {
                from: number.format(page * COMPANY_PEOPLE_PAGE_SIZE + 1),
                to: number.format(Math.min(total, (page + 1) * COMPANY_PEOPLE_PAGE_SIZE)),
                count: total,
                total: number.format(total),
              })}
            </Typography>
            <Pagination
              shape="rounded"
              color="primary"
              count={pages}
              page={Math.min(page + 1, pages)}
              siblingCount={0}
              aria-label={t('company.pages')}
              onChange={(_event, value) => {
                setPage(value - 1);
              }}
            />
          </div>
        )}
      </div>
    </Card>
  );
}
