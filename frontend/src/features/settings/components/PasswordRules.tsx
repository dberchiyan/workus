import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import RadioButtonUncheckedOutlined from '@mui/icons-material/RadioButtonUncheckedOutlined';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { PASSWORD_LIMITS, PASSWORD_RULES } from '../schemas';

type RuleKey = (typeof PASSWORD_RULES)[number]['key'] | 'different' | 'match';

export interface PasswordRulesProps {
  id: string;
  newPassword: string;
  confirmPassword: string;
  currentPassword: string;
}

/** What a new password needs, ticked off while typing; the icon and the words say the state. */
export function PasswordRules({
  id,
  newPassword,
  confirmPassword,
  currentPassword,
}: PasswordRulesProps) {
  const { t } = useTranslation('settings');
  const rules: { key: RuleKey; met: boolean }[] = [
    ...PASSWORD_RULES.map((rule) => ({ key: rule.key, met: rule.test(newPassword) })),
    { key: 'different', met: newPassword !== '' && newPassword !== currentPassword },
    { key: 'match', met: newPassword !== '' && newPassword === confirmPassword },
  ];
  return (
    <div className="flex flex-col gap-3 rounded-md border border-divider bg-background p-4">
      <Typography id={id} variant="subtitle2" component="h3">
        {t('account.password.rules.title')}
      </Typography>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {rules.map((rule) => {
          const Icon = rule.met ? CheckCircleOutlined : RadioButtonUncheckedOutlined;
          return (
            <li key={rule.key} className="flex items-start gap-2">
              <Icon
                aria-hidden
                fontSize="small"
                className={cn('mt-px shrink-0', rule.met ? 'text-success' : 'text-text-disabled')}
              />
              <Typography variant="body2" color={rule.met ? 'textPrimary' : 'textSecondary'}>
                {t(`account.password.rules.${rule.key}`, PASSWORD_LIMITS)}
                <span className="sr-only">
                  {' '}
                  {rule.met ? t('account.password.rules.met') : t('account.password.rules.notMet')}
                </span>
              </Typography>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
