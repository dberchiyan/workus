import Typography from '@mui/material/Typography';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, NavLink, useParams } from 'react-router';
import { useAccess } from '@/features/auth';
import { AdministratorsSection, OrganisationSection } from '@/features/organisation';
import { HolidaysSection } from '@/features/time-off';
import { usePageHeadingFocus } from '@/shared/hooks/usePageHeadingFocus';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { cn } from '@/shared/lib/cn';
import { settingsPath } from '@/shared/lib/paths';
import { AccountSection } from '../components/AccountSection';
import { SecuritySection } from '../components/SecuritySection';
import { SessionsSection } from '../components/SessionsSection';
import { isSettingsSection, sectionAccessPart, SETTINGS_SECTIONS } from '../sections';
import { trackScrollEdges } from '@/shared/lib/scrollEdges';

/**
 * Your account, sessions and security log, and (by role) holidays, the company and its
 * administrators — one section at a time, each with its own URL.
 */
export default function SettingsPage() {
  const { t } = useTranslation('settings');
  const headingRef = usePageHeadingFocus<HTMLHeadingElement>();
  const { section } = useParams();
  const can = useAccess();
  const navRef = useRef<HTMLElement>(null);

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
          <ul
            ref={trackScrollEdges}
            className="app-scroll-fade m-0 flex list-none gap-1 overflow-x-auto p-0 md:flex-col"
          >
            {sections.map(({ key, icon: Icon }) => (
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
                    {t(`sections.${key}`)}
                  </Typography>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0">
          {section === 'account' && <AccountSection />}
          {section === 'sessions' && <SessionsSection />}
          {section === 'security' && <SecuritySection />}
          {section === 'holidays' && <HolidaysSection />}
          {section === 'organisation' && <OrganisationSection />}
          {section === 'administrators' && <AdministratorsSection />}
        </div>
      </div>
    </div>
  );
}
