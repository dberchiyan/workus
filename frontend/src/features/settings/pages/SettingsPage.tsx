import Typography from '@mui/material/Typography';
import { useEffect, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, NavLink, useParams } from 'react-router';
import { useAccess } from '@/features/auth';
import { AdministratorsSection, OrganisationSection } from '@/features/organisation';
import { CompanyStructureSection } from '@/features/employee/core';
import { HolidaysSection } from '@/features/time-off';
import { usePageHeadingFocus } from '@/shared/hooks/usePageHeadingFocus';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { cn } from '@/shared/lib/cn';
import { settingsPath } from '@/shared/lib/paths';
import { AccountSection } from '../components/AccountSection';
import { SecuritySection } from '../components/SecuritySection';
import { SessionsSection } from '../components/SessionsSection';
import {
  isSettingsSection,
  sectionAccessPart,
  SETTINGS_GROUPS,
  SETTINGS_SECTIONS,
} from '../sections';
import { trackScrollEdges } from '@/shared/lib/scrollEdges';

/**
 * Your account, sessions and security log, and (by role) the company's details, structure,
 * holidays and administrators — one section at a time, each with its own URL. The menu is
 * grouped (You, Company); with one group only, it needs no heading.
 */
export default function SettingsPage() {
  const { t } = useTranslation('settings');
  const headingRef = usePageHeadingFocus<HTMLHeadingElement>();
  const { section } = useParams();
  const can = useAccess();
  const navRef = useRef<HTMLElement>(null);
  const groupId = useId();

  // On a phone the menu is one scrolling row: keep the open section in view.
  useEffect(() => {
    navRef.current
      ?.querySelector('[aria-current="page"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [section]);
  useDocumentTitle(t('pageTitle'));

  const sections = SETTINGS_SECTIONS.filter(({ key }) => {
    const part = sectionAccessPart(key);
    return part === undefined || can(part);
  });
  const groups = SETTINGS_GROUPS.map((group) => ({
    group,
    items: sections.filter((item) => item.group === group),
  })).filter(({ items }) => items.length > 0);
  const grouped = groups.length > 1;
  if (!isSettingsSection(section) || !sections.some(({ key }) => key === section)) {
    return <Navigate to={settingsPath('account')} replace />;
  }

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
          {t('title')}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {t('subtitle')}
        </Typography>
      </div>
      {/* One-off geometry: the section menu keeps a fixed width beside the content. */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[13rem_minmax(0,1fr)]">
        <nav ref={navRef} aria-label={t('menu')}>
          {/* Phones: one scrolling row, groups split by a rule. From md: a column, groups headed. */}
          <ul
            ref={trackScrollEdges}
            className="app-scroll-fade m-0 flex list-none gap-1 overflow-x-auto p-0 md:flex-col md:gap-6"
          >
            {groups.map(({ group, items }, index) => (
              <li
                key={group}
                className={cn(
                  'flex shrink-0 items-center gap-1 md:flex-col md:items-stretch',
                  index > 0 && 'ml-1 border-l border-divider pl-2 md:ml-0 md:border-l-0 md:pl-0',
                )}
              >
                {grouped && (
                  <Typography
                    id={`${groupId}-${group}`}
                    variant="overline"
                    color="textSecondary"
                    className="hidden px-3 pb-1 md:block"
                  >
                    {t(`groups.${group}`)}
                  </Typography>
                )}
                <ul
                  aria-labelledby={grouped ? `${groupId}-${group}` : undefined}
                  className="m-0 flex list-none gap-1 p-0 md:flex-col"
                >
                  {items.map(({ key, icon: Icon }) => (
                    <li key={key} className="shrink-0">
                      <NavLink
                        to={settingsPath(key)}
                        className={({ isActive }) =>
                          cn(
                            'flex min-h-11 items-center gap-3 rounded-sm px-3 text-text-secondary no-underline hover:bg-badge-neutral-background',
                            'outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary',
                            isActive && 'bg-badge-active-background text-badge-active-text',
                          )
                        }
                      >
                        <Icon aria-hidden fontSize="small" />
                        <Typography variant="subtitle2" component="span">
                          {t(`nav.${key}`)}
                        </Typography>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0">
          {section === 'account' && <AccountSection />}
          {section === 'sessions' && <SessionsSection />}
          {section === 'security' && <SecuritySection />}
          {section === 'holidays' && <HolidaysSection />}
          {section === 'structure' && <CompanyStructureSection />}
          {section === 'organisation' && <OrganisationSection />}
          {section === 'administrators' && <AdministratorsSection />}
        </div>
      </div>
    </div>
  );
}
