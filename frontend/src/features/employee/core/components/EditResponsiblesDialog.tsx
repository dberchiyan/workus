import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormHelperText from '@mui/material/FormHelperText';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useEffect, useId, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { isApiError } from '@/shared/api/apiError';
import { PeoplePicker } from '@/shared/components/PeoplePicker';
import type { ErrorCode } from '@/shared/types';
import { useResponsibleCandidates, useUpdateResponsibles } from '../hooks/useEmployeeQueries';
import { RESERVED_LINE, useFieldMessage } from '../hooks/useFieldMessage';
import { EMPLOYEE_LIMITS } from '../schemas';
import type { EmployeeProfile, ResponsibleOption } from '../types';

const schema = z.object({
  responsibleUserIds: z
    .array(z.uuid())
    .max(EMPLOYEE_LIMITS.responsibles, 'validation:responsibles.tooMany'),
});
type Values = z.infer<typeof schema>;

export interface EditResponsiblesDialogProps {
  employee: EmployeeProfile;
  open: boolean;
  onClose: () => void;
  /** After the closing transition — the place to return focus. */
  onExited: () => void;
}

/**
 * Replaces who is responsible for the employee (0–10 people). Remounts on every opening (parent
 * `key`), so it always starts from the profile as read; the version it read goes with the save.
 */
export function EditResponsiblesDialog({
  employee,
  open,
  onClose,
  onExited,
}: EditResponsiblesDialogProps) {
  const { t } = useTranslation(['employee', 'errors']);
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const titleId = useId();
  const introId = useId();
  const message = useFieldMessage();
  const update = useUpdateResponsibles(employee.id);
  const [search, setSearch] = useState('');
  const candidates = useResponsibleCandidates(search, open);
  const [people, setPeople] = useState<ResponsibleOption[]>(() =>
    employee.responsibles.map((person) => ({
      ...person,
      subtitle: person.positionTitle ?? t(`add.responsible.roles.${person.role}`),
    })),
  );
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  const [fieldErrorCount, setFieldErrorCount] = useState(0);
  const errorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: { responsibleUserIds: people.map((person) => person.id) },
  });
  const error = form.formState.errors.responsibleUserIds;
  const isSaving = form.formState.isSubmitting;

  // Dialog open → the search field (ux.md → Focus moves with the UI).
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [open]);

  // An actionable async error takes focus: the form line, or the field it is about.
  useEffect(() => {
    if (errorCount > 0) {
      errorRef.current?.focus();
    }
  }, [errorCount]);
  useEffect(() => {
    if (fieldErrorCount > 0) {
      inputRef.current?.focus();
    }
  }, [fieldErrorCount]);

  // Nobody is responsible for themselves: the employee is not offered.
  const options: ResponsibleOption[] = (candidates.data ?? [])
    .filter((person) => person.id !== employee.userId)
    .map((person) => ({
      ...person,
      subtitle: person.positionTitle ?? t(`add.responsible.roles.${person.role}`),
    }));

  const select = (next: ResponsibleOption[]): void => {
    setPeople(next);
    form.setValue(
      'responsibleUserIds',
      next.map((person) => person.id),
    );
  };

  const close = (): void => {
    if (!isSaving) {
      onClose();
    }
  };

  const submit = form.handleSubmit(async (values) => {
    setErrorCode(null);
    try {
      await update.mutateAsync({
        responsibleUserIds: values.responsibleUserIds,
        version: employee.version,
      });
      onClose();
    } catch (caught) {
      if (!isApiError(caught)) {
        throw caught;
      }
      const detail = caught.details.find((item) => item.field === 'responsibleUserIds');
      if (detail) {
        form.setError('responsibleUserIds', { type: 'server', message: detail.message });
        setFieldErrorCount((count) => count + 1);
      } else {
        setErrorCode(caught.code);
        setErrorCount((count) => count + 1);
      }
    }
  });

  return (
    <Dialog
      open={open}
      onClose={close}
      fullScreen={isPhone}
      fullWidth
      maxWidth="sm"
      aria-labelledby={titleId}
      aria-describedby={introId}
      slotProps={{ transition: { onExited } }}
    >
      <form noValidate className="flex min-h-0 flex-1 flex-col" onSubmit={(e) => void submit(e)}>
        <DialogTitle id={titleId}>{t('profile.responsible.dialogTitle')}</DialogTitle>
        <DialogContent dividers className="flex flex-col gap-3">
          <Typography id={introId} variant="body2" color="textSecondary">
            {t('profile.responsible.intro', {
              name: `${employee.firstName} ${employee.lastName}`,
            })}
          </Typography>
          <PeoplePicker
            label={t('add.responsible.label')}
            value={people}
            onChange={select}
            options={options}
            isLoading={candidates.isFetching}
            onSearch={setSearch}
            max={EMPLOYEE_LIMITS.responsibles}
            error={Boolean(error)}
            helperText={message(error, EMPLOYEE_LIMITS.responsibles)}
            noOptionsText={t('add.responsible.noOptions')}
            loadingText={t('add.responsible.loading')}
            inputRef={inputRef}
          />
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
          <Button onClick={close} disabled={isSaving}>
            {t('profile.responsible.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={isSaving} aria-busy={isSaving}>
            {isSaving ? t('profile.responsible.saving') : t('profile.responsible.save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
