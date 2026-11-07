import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormHelperText from '@mui/material/FormHelperText';
import Typography from '@mui/material/Typography';
import { useMediaQuery, useTheme } from '@mui/material';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/shared/api/apiError';
import { PeoplePicker } from '@/shared/components/PeoplePicker';
import type { ErrorCode } from '@/shared/types';
import { fullName } from '../format';
import {
  useRequestResponsibleCandidates,
  useUpdateRequestResponsibles,
} from '../hooks/useManagedRequests';
import type { ManagedRequest } from '../types';

/** As on an employee: at most ten. */
const MAX_RESPONSIBLES = 10;
/** Keeps the form line's height while it is empty, so the dialog never shifts. */
const RESERVED_LINE = ' ';

interface Option {
  id: string;
  firstName: string;
  lastName: string;
  subtitle: string;
}

export interface EditRequestResponsiblesDialogProps {
  request: ManagedRequest;
  open: boolean;
  onClose: () => void;
  onExited: () => void;
}

/**
 * Any admin changes who decides a pending request (1–10 admins), so no request is left with
 * nobody able to decide it. Remounts on each opening (parent `key`).
 */
export function EditRequestResponsiblesDialog({
  request,
  open,
  onClose,
  onExited,
}: EditRequestResponsiblesDialogProps) {
  const { t } = useTranslation(['timeOff', 'errors', 'validation']);
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const titleId = useId();
  const introId = useId();
  const [search, setSearch] = useState('');
  const candidates = useRequestResponsibleCandidates(search, open);
  const update = useUpdateRequestResponsibles(request.id);
  const subtitleOf = (positionTitle: string | null) =>
    positionTitle ?? t('manage.responsibles.admin');
  const [people, setPeople] = useState<Option[]>(() =>
    request.responsibles.map((person) => ({
      ...person,
      subtitle: subtitleOf(person.positionTitle),
    })),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  const errorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [open]);
  // A failed save takes focus to what explains it (the field or the form line).
  useEffect(() => {
    if (errorCount > 0) {
      (fieldError ? inputRef.current : errorRef.current)?.focus();
    }
  }, [errorCount, fieldError]);

  const options: Option[] = (candidates.data ?? []).map((person) => ({
    id: person.id,
    firstName: person.firstName,
    lastName: person.lastName,
    subtitle: subtitleOf(person.positionTitle),
  }));

  const save = async () => {
    setMessage(null);
    setFieldError(null);
    if (people.length === 0) {
      setFieldError(t('validation:responsibles.required'));
      setErrorCount((count) => count + 1);
      return;
    }
    try {
      await update.mutateAsync(people.map((person) => person.id));
      onClose();
    } catch (caught) {
      if (!isApiError(caught)) {
        throw caught;
      }
      const detail = caught.details.find((item) => item.field === 'responsibleUserIds');
      if (detail) {
        setFieldError(detail.message);
      } else {
        setMessage(t(`errors:${caught.code satisfies ErrorCode}`));
      }
      setErrorCount((count) => count + 1);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!update.isPending) {
          onClose();
        }
      }}
      fullScreen={isPhone}
      fullWidth
      maxWidth="sm"
      aria-labelledby={titleId}
      aria-describedby={introId}
      slotProps={{ transition: { onExited } }}
    >
      <form
        noValidate
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <DialogTitle id={titleId}>{t('manage.responsibles.title')}</DialogTitle>
        <DialogContent dividers className="flex flex-col gap-3">
          <Typography id={introId} variant="body2" color="textSecondary">
            {t('manage.responsibles.intro', { name: fullName(request.employee) })}
          </Typography>
          <PeoplePicker
            label={t('manage.responsibles.label')}
            value={people}
            onChange={setPeople}
            options={options}
            isLoading={candidates.isFetching}
            onSearch={setSearch}
            max={MAX_RESPONSIBLES}
            required
            error={fieldError !== null}
            helperText={fieldError ?? t('manage.responsibles.hint', { max: MAX_RESPONSIBLES })}
            noOptionsText={t('manage.responsibles.noOptions')}
            loadingText={t('manage.responsibles.loading')}
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
            {message ?? RESERVED_LINE}
          </FormHelperText>
          <Button onClick={onClose} disabled={update.isPending}>
            {t('manage.responsibles.cancel')}
          </Button>
          <Button type="submit" variant="contained" loading={update.isPending}>
            {t('manage.responsibles.save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
