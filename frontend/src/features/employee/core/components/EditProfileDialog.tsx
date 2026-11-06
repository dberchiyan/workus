import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormHelperText from '@mui/material/FormHelperText';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { useEditProfileForm } from '../hooks/useEditProfileForm';
import { RESERVED_LINE } from '../hooks/useFieldMessage';
import type { EmployeeProfile } from '../types';
import { EditProfileFields } from './EditProfileFields';

export interface EditProfileDialogProps {
  employee: EmployeeProfile;
  open: boolean;
  onClose: () => void;
  /** After the closing transition — the place to return focus. */
  onExited: () => void;
}

/** The Add employee details, prefilled. Centred modal; full-screen sheet on phones (ux.md). */
export function EditProfileDialog({ employee, open, onClose, onExited }: EditProfileDialogProps) {
  const { t } = useTranslation(['employee', 'errors']);
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const titleId = useId();
  const { form, submit, errorCode, errorRef, isSubmitting } = useEditProfileForm(employee, onClose);

  const close = (): void => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      fullScreen={isPhone}
      fullWidth
      maxWidth="md"
      aria-labelledby={titleId}
      slotProps={{ transition: { onExited } }}
    >
      <form noValidate className="flex min-h-0 flex-1 flex-col" onSubmit={(e) => void submit(e)}>
        <DialogTitle id={titleId}>{t('edit.title')}</DialogTitle>
        <DialogContent dividers>
          <EditProfileFields form={form} />
        </DialogContent>
        <DialogActions className="flex-wrap gap-2 px-4 py-3 sm:px-6 sm:py-4">
          <FormHelperText
            component="div"
            role="alert"
            ref={errorRef}
            tabIndex={-1}
            error
            className="m-0 basis-full outline-none sm:mr-auto sm:basis-auto"
          >
            {errorCode ? t(`errors:${errorCode}`) : RESERVED_LINE}
          </FormHelperText>
          <Button onClick={close} disabled={isSubmitting}>
            {t('edit.cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? t('edit.saving') : t('edit.save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
