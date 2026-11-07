import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/features/auth';
import { InitialsAvatar } from '@/shared/components/InitialsAvatar';
import { ChangePasswordForm } from './ChangePasswordForm';
import { SettingsCard } from './SettingsCard';

/** Who you are (read-only — an admin changes it) and your password. */
export function AccountSection() {
  const { t } = useTranslation(['settings', 'shell']);
  const user = useCurrentUser().data;
  return (
    <div className="flex flex-col gap-4">
      <SettingsCard
        id="settings-profile"
        title={t('account.profile.title')}
        description={t('account.profile.description')}
      >
        {user && (
          <div className="flex flex-wrap items-center gap-4">
            <InitialsAvatar
              id={user.id}
              firstName={user.firstName}
              lastName={user.lastName}
              size="lg"
            />
            <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
              <Typography component="dt" variant="body2" color="textSecondary">
                {t('account.profile.name')}
              </Typography>
              <Typography component="dd" variant="body2" className="m-0">
                {`${user.firstName} ${user.lastName}`}
              </Typography>
              <Typography component="dt" variant="body2" color="textSecondary">
                {t('account.profile.email')}
              </Typography>
              <Typography component="dd" variant="body2" className="m-0 [overflow-wrap:anywhere]">
                {user.email}
              </Typography>
              <Typography component="dt" variant="body2" color="textSecondary">
                {t('account.profile.role')}
              </Typography>
              <Typography component="dd" variant="body2" className="m-0">
                {t(`shell:role.${user.role}`)}
              </Typography>
            </dl>
          </div>
        )}
      </SettingsCard>
      <SettingsCard
        id="settings-password"
        title={t('account.password.title')}
        description={t('account.password.description')}
      >
        {/* A container: the rules box sits beside the fields when the card is wide enough. */}
        <div className="@container">
          <ChangePasswordForm />
        </div>
      </SettingsCard>
    </div>
  );
}
