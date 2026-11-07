import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { isSecurityCategory, SecurityLogView, useOwnSecurityLog } from '@/features/auth';
import { SettingsCard } from './SettingsCard';

/** Your security log: sign-ins (and failed ones), password changes, signed-out sessions. */
export function SecuritySection() {
  const { t } = useTranslation('settings');
  // The filter lives in the URL (`?category=`; "All" leaves it out).
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get('category');
  const category = isSecurityCategory(raw) ? raw : undefined;
  const log = useOwnSecurityLog(category);
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
              return params;
            },
            { replace: true },
          );
        }}
      />
    </SettingsCard>
  );
}
