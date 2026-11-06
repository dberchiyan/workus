import KeyOutlined from '@mui/icons-material/KeyOutlined';
import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export type PasswordFieldProps = Omit<TextFieldProps, 'type' | 'slotProps'>;

export function PasswordField(props: PasswordFieldProps) {
  const { t } = useTranslation('auth');
  const [isVisible, setIsVisible] = useState(false);

  return (
    <TextField
      {...props}
      type={isVisible ? 'text' : 'password'}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <KeyOutlined aria-hidden />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                edge="end"
                aria-label={isVisible ? t('login.hidePassword') : t('login.showPassword')}
                aria-pressed={isVisible}
                onClick={() => {
                  setIsVisible((value) => !value);
                }}
              >
                {isVisible ? (
                  <VisibilityOffOutlined aria-hidden />
                ) : (
                  <VisibilityOutlined aria-hidden />
                )}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
