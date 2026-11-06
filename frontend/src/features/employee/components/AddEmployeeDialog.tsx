import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormHelperText from '@mui/material/FormHelperText';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { AddEmployeeStep, useAddEmployeeForm } from '../hooks/useAddEmployeeForm';
import { RESERVED_LINE } from '../hooks/useFieldMessage';
import type { CreatedEmployee } from '../types';
import { EmployeeDetailsStep } from './EmployeeDetailsStep';
import { ResponsibleStep } from './ResponsibleStep';

export interface AddEmployeeDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (employee: CreatedEmployee) => void;
  /** After the closing transition — the place to return focus. */
  onExited: () => void;
}

/** Centred modal on tablet/desktop, full-screen sheet on phones (ux.md → Patterns). */
export function AddEmployeeDialog({ open, onClose, onCreated, onExited }: AddEmployeeDialogProps) {
  const { t } = useTranslation(['employee', 'errors']);
  const theme = useTheme();
  // Behaviour CSS cannot express: the dialog variant.
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const titleId = useId();
  const {
    form,
    step,
    goNext,
    goBack,
    submit,
    reset,
    errorCode,
    errorRef,
    responsibles,
    selectResponsibles,
    isSubmitting,
  } = useAddEmployeeForm(onCreated);
  const isDetails = step === AddEmployeeStep.DETAILS;

  const close = (): void => {
    if (isSubmitting) {
      return;
    }
    reset();
    onClose();
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
      {/* Enter submits the current step: Next on step 1, Create on step 2. */}
      <form
        noValidate
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(event) => {
          if (isDetails) {
            event.preventDefault();
            void goNext();
          } else {
            void submit(event);
          }
        }}
      >
        <DialogTitle id={titleId}>{t('add.title')}</DialogTitle>
        <DialogContent dividers className="flex flex-col gap-6">
          <Stepper activeStep={step} aria-label={t('add.stepsLabel')}>
            <Step>
              <StepLabel>{t('add.steps.details')}</StepLabel>
            </Step>
            <Step>
              <StepLabel optional={t('add.steps.optional')}>{t('add.steps.responsible')}</StepLabel>
            </Step>
          </Stepper>
          {isDetails ? (
            <EmployeeDetailsStep form={form} />
          ) : (
            <ResponsibleStep
              form={form}
              responsibles={responsibles}
              onChange={selectResponsibles}
            />
          )}
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
            {t('add.actions.cancel')}
          </Button>
          {!isDetails && (
            <Button onClick={goBack} disabled={isSubmitting}>
              {t('add.actions.back')}
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isDetails
              ? t('add.actions.next')
              : isSubmitting
                ? t('add.actions.submitting')
                : t('add.actions.submit')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
