import SearchOutlined from '@mui/icons-material/SearchOutlined';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const DEBOUNCE_MS = 300;
const MAX_LENGTH = 100;

export interface RequestSearchFieldProps {
  value: string;
  onSearch: (value: string) => void;
}

/** Typing is local; the URL gets the value after a short pause. */
export function RequestSearchField({ value, onSearch }: RequestSearchFieldProps) {
  const { t } = useTranslation('timeOff');
  const [text, setText] = useState(value);
  const [urlValue, setUrlValue] = useState(value);

  // The URL changed from outside (back/forward, "clear filters"): show what it says.
  if (value !== urlValue) {
    setUrlValue(value);
    setText(value);
  }

  useEffect(() => {
    if (text === value) {
      return undefined;
    }
    const timer = setTimeout(() => {
      onSearch(text);
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [text, value, onSearch]);

  return (
    <TextField
      type="search"
      size="small"
      label={t('manage.filters.search')}
      value={text}
      onChange={(event) => {
        setText(event.target.value);
      }}
      className="w-full sm:max-w-xs"
      slotProps={{
        htmlInput: { maxLength: MAX_LENGTH, autoComplete: 'off', spellCheck: false },
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchOutlined aria-hidden />
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
