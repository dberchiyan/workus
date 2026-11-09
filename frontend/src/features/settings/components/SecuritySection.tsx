import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { isSecurityCategory, SecurityLogView, useOwnSecurityLog } from '@/features/auth';
import { SettingsCard } from './SettingsCard';

/** Your security log: sign-ins (and failed ones), password changes, signed-out sessions. */
export function SecuritySection() {
  const { t } = useTranslation('settings');
  // The filter and the page live in the URL (`?category=&logPage=`; "All" and the first page
  // leave them out — `page` is the sessions list's, on the same screen).
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get('category');
  const category = isSecurityCategory(raw) ? raw : undefined;
  const rawPage = Number(searchParams.get('logPage'));
  const page = Number.isInteger(rawPage) && rawPage >= 0 ? rawPage : 0;
  const log = useOwnSecurityLog(category, page);
  return (
    <SettingsCard
      id="settings-security"
      title={t('security.title')}
      description={t('security.description')}
    >
      <SecurityLogView
        log={log}
        category={category}
        onCategory={(next) => {
          setSearchParams(
            (current) => {
              const params = new URLSearchParams(current);
              if (next) {
                params.set('category', next);
              } else {
                params.delete('category');
              }
              params.delete('logPage');
              return params;
            },
            { replace: true },
          );
        }}
        page={page}
        onPage={(next) => {
          setSearchParams(
            (current) => {
              const params = new URLSearchParams(current);
              if (next === 0) {
                params.delete('logPage');
              } else {
                params.set('logPage', String(next));
              }
              return params;
            },
            { replace: true },
          );
        }}
      />
    </SettingsCard>
  );
}
