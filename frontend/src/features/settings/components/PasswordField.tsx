import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import { forwardRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

export type PasswordFieldProps = Omit<TextFieldProps, 'type' | 'slotProps'> & {
  autoComplete: 'current-password' | 'new-password';
  /** Id of more help (e.g. the password rules), read with the field. */
  describedBy?: string;
};

/** A password input with a show / hide button. */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField({ autoComplete, describedBy, ...props }, ref) {
    const { t } = useTranslation('settings');
    const [visible, setVisible] = useState(false);
    return (
      <TextField
        {...props}
        inputRef={ref}
        type={visible ? 'text' : 'password'}
        slotProps={{
          htmlInput: {
            autoComplete,
            spellCheck: false,
            maxLength: 128,
            ...(describedBy ? { 'aria-describedby': describedBy } : {}),
          },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={visible ? t('account.password.hide') : t('account.password.show')}
                  onClick={() => {
                    setVisible((value) => !value);
                  }}
                  edge="end"
                >
                  {visible ? <VisibilityOffOutlined /> : <VisibilityOutlined />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
    );
  },
);
