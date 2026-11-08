import CheckOutlined from '@mui/icons-material/CheckOutlined';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';
import LockOutlined from '@mui/icons-material/LockOutlined';
import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

type Copied = 'email' | 'password' | 'both' | null;

export interface EmployeeCredentialsProps {
  name: string;
  email: string;
  /** Null when the answer was a replay: the password was shown before and is gone. */
  password: string | null;
  saved: boolean;
  onSavedChange: (saved: boolean) => void;
}

/**
 * The new employee's sign-in details, shown this once: the password is never stored in plain text,
 * so the admin copies it here (each value or both) and confirms it is saved before closing.
 */
export function EmployeeCredentials({
  name,
  email,
  password,
  saved,
  onSavedChange,
}: EmployeeCredentialsProps) {
  const { t } = useTranslation('employee');
  const [copied, setCopied] = useState<Copied>(null);
  const [copyFailed, setCopyFailed] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));

  const copy = async (what: Exclude<Copied, null>, text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setCopyFailed(false);
      if (what !== 'email') {
        onSavedChange(true);
      }
    } catch {
      setCopyFailed(true);
    }
  };

  const copyButton = (what: 'email' | 'password', text: string, label: string) => (
    <Tooltip title={copied === what ? t('add.access.copied') : label}>
      <IconButton aria-label={label} onClick={() => void copy(what, text)}>
        {copied === what ? (
          <CheckOutlined fontSize="small" className="text-success" />
        ) : (
          <ContentCopyOutlined fontSize="small" />
        )}
      </IconButton>
    </Tooltip>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Typography variant="h6" component="h3">
          {t('add.access.title', { name })}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {t('add.access.description')}
        </Typography>
      </div>

      {password === null ? (
        <Alert severity="info">{t('add.access.alreadyShown')}</Alert>
      ) : (
        <>
          <Alert severity="warning" icon={<LockOutlined />}>
            <AlertTitle>{t('add.access.onceTitle')}</AlertTitle>
            {t('add.access.onceText', { name })}
          </Alert>

          <dl className="m-0 flex flex-col divide-y divide-divider rounded-md border border-divider bg-background">
            <div className="flex items-center gap-3 py-2 pr-2 pl-4">
              <div className="flex min-w-0 flex-1 flex-col">
                <Typography component="dt" variant="caption" color="textSecondary">
                  {t('add.access.email')}
                </Typography>
                <Typography component="dd" variant="body1" className="m-0 [overflow-wrap:anywhere]">
                  {email}
                </Typography>
              </div>
              {copyButton('email', email, t('add.access.copyEmail'))}
            </div>
            <div className="flex items-center gap-3 py-2 pr-2 pl-4">
              <div className="flex min-w-0 flex-1 flex-col">
                <Typography component="dt" variant="caption" color="textSecondary">
                  {t('add.access.password')}
                </Typography>
                {/* The type scale comes from the theme: one size smaller on a phone keeps it on one line. */}
                <Typography
                  component="dd"
                  variant={isPhone ? 'body1' : 'h6'}
                  className="app-tabular m-0 break-all"
                >
                  {isVisible ? password : '•'.repeat(password.length)}
                  {!isVisible && <span className="sr-only">{t('add.access.hidden')}</span>}
                </Typography>
              </div>
              <Tooltip title={isVisible ? t('add.access.hide') : t('add.access.show')}>
                <IconButton
                  aria-label={isVisible ? t('add.access.hide') : t('add.access.show')}
                  aria-pressed={!isVisible}
                  onClick={() => {
                    setIsVisible((value) => !value);
                  }}
                >
                  {isVisible ? (
                    <VisibilityOffOutlined fontSize="small" />
                  ) : (
                    <VisibilityOutlined fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
              {copyButton('password', password, t('add.access.copyPassword'))}
            </div>
          </dl>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="outlined"
              startIcon={copied === 'both' ? <CheckOutlined /> : <ContentCopyOutlined />}
              onClick={() =>
                void copy('both', t('add.access.clipboard', { name, email, password }))
              }
              className="self-start"
            >
              {copied === 'both' ? t('add.access.copiedBoth') : t('add.access.copyBoth')}
            </Button>
            <FormControlLabel
              control={
                <Checkbox
                  checked={saved}
                  onChange={(event) => {
                    onSavedChange(event.target.checked);
                  }}
                />
              }
              label={t('add.access.saved')}
              className="m-0"
            />
          </div>
          <Typography
            component="p"
            variant="caption"
            role="status"
            color="error"
            className="min-h-5"
          >
            {copyFailed ? t('add.access.copyFailed') : ''}
          </Typography>
          <span className="sr-only" role="status">
            {copied ? t('add.access.copied') : ''}
          </span>
        </>
      )}
    </div>
  );
}
