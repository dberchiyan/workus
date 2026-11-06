import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { InitialsAvatar } from '@/shared/components/InitialsAvatar';
import type { AddEmployeeForm } from '../hooks/useAddEmployeeForm';
import { useResponsibleCandidates } from '../hooks/useEmployeeQueries';
import { useFieldMessage } from '../hooks/useFieldMessage';
import { EMPLOYEE_LIMITS } from '../schemas';
import type { ResponsibleCandidate } from '../types';

const DEBOUNCE_MS = 300;

export interface ResponsibleStepProps {
  form: AddEmployeeForm['form'];
  responsibles: ResponsibleCandidate[];
  onChange: (people: ResponsibleCandidate[]) => void;
}

const fullName = (person: ResponsibleCandidate): string => `${person.firstName} ${person.lastName}`;

/** Step 2: optional — the employee can be saved with nobody assigned. */
export function ResponsibleStep({ form, responsibles, onChange }: ResponsibleStepProps) {
  const { t } = useTranslation('employee');
  const message = useFieldMessage();
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const candidates = useResponsibleCandidates(search, true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Step shown → focus the search field.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(input.trim());
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [input]);

  const error = form.formState.errors.responsibleUserIds;

  return (
    <div className="flex flex-col gap-3">
      <Typography variant="body2" color="textSecondary">
        {t('add.responsible.intro')}
      </Typography>
      <Autocomplete
        multiple
        autoHighlight
        filterSelectedOptions
        options={candidates.data ?? []}
        value={responsibles}
        onChange={(_event, people) => {
          onChange(people.slice(0, EMPLOYEE_LIMITS.responsibles));
        }}
        inputValue={input}
        onInputChange={(_event, value) => {
          setInput(value);
        }}
        // Server-side search: show what the API returned.
        filterOptions={(options) => options}
        getOptionLabel={fullName}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        loading={candidates.isFetching}
        noOptionsText={t('add.responsible.noOptions')}
        loadingText={t('add.responsible.loading')}
        renderOption={(props, person) => {
          const { key, ...optionProps } = props;
          return (
            <li
              key={key}
              {...optionProps}
              className={`${optionProps.className ?? ''} flex items-center gap-3`}
            >
              <InitialsAvatar
                id={person.id}
                firstName={person.firstName}
                lastName={person.lastName}
                size="sm"
              />
              <span className="flex min-w-0 flex-col">
                <Typography variant="body2" component="span" className="truncate">
                  {fullName(person)}
                </Typography>
                <Typography
                  variant="caption"
                  component="span"
                  color="textSecondary"
                  className="truncate"
                >
                  {person.positionTitle ?? t(`add.responsible.roles.${person.role}`)}
                </Typography>
              </span>
            </li>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            inputRef={inputRef}
            label={t('add.responsible.label')}
            error={Boolean(error)}
            helperText={message(error, EMPLOYEE_LIMITS.responsibles, t('add.responsible.hint'))}
          />
        )}
      />
    </div>
  );
}
