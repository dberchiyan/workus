import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import RadioButtonUncheckedOutlined from '@mui/icons-material/RadioButtonUncheckedOutlined';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { PASSWORD_LIMITS, PASSWORD_RULES } from '@/shared/lib/passwordRules';

/** A rule of the form using the box (e.g. "differs from the current one"), already worded. */
export interface ExtraPasswordRule {
  key: string;
  label: string;
  met: boolean;
}

export interface PasswordRulesProps {
  id: string;
  password: string;
  extraRules?: readonly ExtraPasswordRule[];
}

/** What a new password needs, ticked off while typing; the icon and the words say the state. */
export function PasswordRules({ id, password, extraRules = [] }: PasswordRulesProps) {
  const { t } = useTranslation('common');
  const rules = [
    ...PASSWORD_RULES.map((rule) => ({
      key: rule.key,
      label: t(`password.rules.${rule.key}`, PASSWORD_LIMITS),
      met: rule.test(password),
    })),
    ...extraRules,
  ];
  return (
    <div className="flex flex-col gap-3 rounded-md border border-divider bg-background p-4">
      <Typography id={id} variant="subtitle2" component="h3">
        {t('password.rules.title')}
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
                {rule.label}
                <span className="sr-only">
                  {' '}
                  {rule.met ? t('password.rules.met') : t('password.rules.notMet')}
                </span>
              </Typography>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
