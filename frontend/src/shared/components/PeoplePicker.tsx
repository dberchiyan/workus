import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { type Ref, useEffect, useState } from 'react';
import { InitialsAvatar } from './InitialsAvatar';

export interface PickerPerson {
  id: string;
  firstName: string;
  lastName: string;
  /** Position or role shown under the name. */
  subtitle: string;
}

export interface PeoplePickerProps<P extends PickerPerson> {
  label: string;
  value: P[];
  onChange: (people: P[]) => void;
  /** Server-side search results for the current text. */
  options: P[];
  isLoading: boolean;
  /** Called with the debounced, trimmed search text. */
  onSearch: (text: string) => void;
  max: number;
  helperText: string;
  error: boolean;
  required?: boolean;
  noOptionsText: string;
  loadingText: string;
  inputRef?: Ref<HTMLInputElement>;
}

const DEBOUNCE_MS = 300;
const fullName = (person: PickerPerson): string => `${person.firstName} ${person.lastName}`;

/** Multi-select of people with avatars; the data comes from the caller's query. */
export function PeoplePicker<P extends PickerPerson>({
  label,
  value,
  onChange,
  options,
  isLoading,
  onSearch,
  max,
  helperText,
  error,
  required = false,
  noOptionsText,
  loadingText,
  inputRef,
}: PeoplePickerProps<P>) {
  const [input, setInput] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(input.trim());
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [input, onSearch]);

  return (
    <Autocomplete
      multiple
      autoHighlight
      filterSelectedOptions
      options={options}
      value={value}
      onChange={(_event, people) => {
        onChange(people.slice(0, max));
      }}
      inputValue={input}
      onInputChange={(_event, text) => {
        setInput(text);
      }}
      // Server-side search: show what the API returned.
      filterOptions={(items) => items}
      getOptionLabel={fullName}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      loading={isLoading}
      noOptionsText={noOptionsText}
      loadingText={loadingText}
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
                {person.subtitle}
              </Typography>
            </span>
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          {...(inputRef ? { inputRef } : {})}
          label={label}
          required={required}
          error={error}
          helperText={helperText}
        />
      )}
    />
  );
}
