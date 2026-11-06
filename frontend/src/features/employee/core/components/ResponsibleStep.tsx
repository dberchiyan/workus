import Typography from '@mui/material/Typography';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PeoplePicker } from '@/shared/components/PeoplePicker';
import type { AddEmployeeForm } from '../hooks/useAddEmployeeForm';
import { useResponsibleCandidates } from '../hooks/useEmployeeQueries';
import { useFieldMessage } from '../hooks/useFieldMessage';
import { EMPLOYEE_LIMITS } from '../schemas';
import type { ResponsibleOption } from '../types';

export interface ResponsibleStepProps {
  form: AddEmployeeForm['form'];
  responsibles: ResponsibleOption[];
  onChange: (people: ResponsibleOption[]) => void;
}

/** Step 2: optional — the employee can be saved with nobody assigned. */
export function ResponsibleStep({ form, responsibles, onChange }: ResponsibleStepProps) {
  const { t } = useTranslation('employee');
  const message = useFieldMessage();
  const [search, setSearch] = useState('');
  const candidates = useResponsibleCandidates(search, true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Step shown → focus the search field.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const options: ResponsibleOption[] = (candidates.data ?? []).map((person) => ({
    ...person,
    subtitle: person.positionTitle ?? t(`add.responsible.roles.${person.role}`),
  }));
  const error = form.formState.errors.responsibleUserIds;

  return (
    <div className="flex flex-col gap-3">
      <Typography variant="body2" color="textSecondary">
        {t('add.responsible.intro')}
      </Typography>
      <PeoplePicker
        label={t('add.responsible.label')}
        value={responsibles}
        onChange={onChange}
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
    </div>
  );
}
