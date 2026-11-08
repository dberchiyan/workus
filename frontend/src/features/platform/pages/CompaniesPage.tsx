import SearchOutlined from '@mui/icons-material/SearchOutlined';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import Pagination from '@mui/material/Pagination';
import Skeleton from '@mui/material/Skeleton';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useDeferredValue, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { usePageHeadingFocus } from '@/shared/hooks/usePageHeadingFocus';
import { cn } from '@/shared/lib/cn';
import { platformCompanyPath } from '@/shared/lib/paths';
import { COMPANIES_PAGE_SIZE } from '../api/platformApi';
import { CompanyStatusChip } from '../components/CompanyStatusChip';
import { useCompanies, useCompanyCounts } from '../hooks/usePlatform';
import type { CompanyStatus } from '../types';

const STATUSES: readonly CompanyStatus[] = ['PENDING', 'ACTIVE', 'REJECTED'];
const SKELETON_ROWS = ['s1', 's2', 's3', 's4'];

/** Companies (platform admins): the approval queue first, then active and rejected ones. */
export default function CompaniesPage() {
  const { t, i18n } = useTranslation('platform');
  useDocumentTitle(t('companies.pageTitle'));
  const headingRef = usePageHeadingFocus<HTMLHeadingElement>();
  const [status, setStatus] = useState<CompanyStatus>('PENDING');
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search.trim());
  const [page, setPage] = useState(0);
  const companies = useCompanies(status, deferredSearch, page);
  const counts = useCompanyCounts().data;
  const date = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeZone: 'UTC' });
  const number = new Intl.NumberFormat(i18n.language);
  const total = companies.data?.totalElements ?? 0;
  const pages = Math.max(1, Math.ceil(total / COMPANIES_PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Typography
          ref={headingRef}
          tabIndex={-1}
          variant="h4"
          component="h1"
          className="outline-none"
        >
          {t('companies.title')}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {t('companies.subtitle')}
        </Typography>
      </div>
      <Card className="flex flex-col">
        <div className="flex flex-col gap-3 border-b border-divider px-4 pt-2 sm:px-6">
          <Tabs
            value={status}
            onChange={(_event, value: CompanyStatus) => {
              setStatus(value);
              setPage(0);
            }}
            variant="scrollable"
            allowScrollButtonsMobile
            aria-label={t('companies.tabs')}
          >
            {STATUSES.map((value) => (
              <Tab
                key={value}
                value={value}
                label={
                  <span className="flex items-center gap-2">
                    {t(`tabs.${value}`)}
                    {counts && (
                      <Typography
                        variant="caption"
                        component="span"
                        className={cn(
                          'app-tabular rounded-full px-2',
                          value === 'PENDING' && counts.PENDING > 0
                            ? 'bg-badge-active-background text-badge-active-text'
                            : 'bg-badge-neutral-background text-text-secondary',
                        )}
                      >
                        {number.format(counts[value])}
                      </Typography>
                    )}
                  </span>
                }
              />
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
            label={t('companies.search')}
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
          {companies.isError ? (
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={() => void companies.refetch()}>
                  {t('retry')}
                </Button>
              }
            >
              {t('companies.error')}
            </Alert>
          ) : !companies.data ? (
            <div aria-busy="true" className="flex flex-col gap-2">
              <span className="sr-only">{t('loading')}</span>
              {SKELETON_ROWS.map((key) => (
                <Skeleton key={key} variant="rounded" height={64} />
              ))}
            </div>
          ) : companies.data.content.length === 0 ? (
            <Typography variant="body2" color="textSecondary" className="py-8 text-center">
              {deferredSearch ? t('companies.emptySearch') : t(`companies.empty.${status}`)}
            </Typography>
          ) : (
            <ul
              aria-busy={companies.isPlaceholderData}
              className={cn(
                'm-0 flex list-none flex-col divide-y divide-divider p-0',
                companies.isPlaceholderData && 'opacity-60',
              )}
            >
              {companies.data.content.map((company) => {
                const owner = company.owners[0];
                return (
                  <li
                    key={company.id}
                    className="relative flex flex-wrap items-center gap-x-4 gap-y-1 py-3"
                  >
                    <div className="flex min-w-0 flex-1 basis-60 flex-col">
                      <Link
                        component={RouterLink}
                        to={platformCompanyPath(company.id)}
                        underline="hover"
                        color="textPrimary"
                        className="font-medium truncate after:absolute after:inset-0"
                      >
                        {company.name}
                      </Link>
                      <Typography variant="body2" color="textSecondary" className="truncate">
                        {owner
                          ? `${owner.firstName} ${owner.lastName} · ${owner.email}`
                          : t('companies.noOwner')}
                      </Typography>
                    </div>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      className="app-tabular whitespace-nowrap"
                    >
                      {t('companies.size', {
                        admins: number.format(company.adminCount),
                        employees: number.format(company.activeEmployeeCount),
                      })}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      className="app-tabular whitespace-nowrap"
                    >
                      {t('companies.registered', {
                        date: date.format(new Date(company.createdAt)),
                      })}
                    </Typography>
                    <CompanyStatusChip status={company.status} />
                  </li>
                );
              })}
            </ul>
          )}
          {pages > 1 && (
            <div className="flex justify-end border-t border-divider pt-3">
              <Pagination
                shape="rounded"
                color="primary"
                count={pages}
                page={Math.min(page + 1, pages)}
                siblingCount={0}
                aria-label={t('companies.pages')}
                onChange={(_event, value) => {
                  setPage(value - 1);
                }}
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
