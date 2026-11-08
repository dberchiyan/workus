import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useTranslation } from 'react-i18next';
import { isTimeOffType, TIME_OFF_TYPES, type TimeOffType } from '../types';
import { RequestSearchField } from './RequestSearchField';
import { TYPE_VISUALS } from './timeOffVisuals';
import { trackScrollEdges } from '@/shared/lib/scrollEdges';

const ALL = 'ALL';

export interface RequestsFiltersProps {
  search: string;
  type: TimeOffType | undefined;
  mine: boolean;
  onSearch: (search: string) => void;
  onType: (type: TimeOffType | undefined) => void;
  onMine: (mine: boolean) => void;
}

/** Name search, request type and "only mine to decide" — apply to both sections. */
export function RequestsFilters({
  search,
  type,
  mine,
  onSearch,
  onType,
  onMine,
}: RequestsFiltersProps) {
  const { t } = useTranslation('timeOff');
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <RequestSearchField value={search} onSearch={onSearch} />
      {/* On a phone the options stay on one line and scroll sideways, edge to edge. */}
      <div
        ref={trackScrollEdges}
        className="app-scroll-fade -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0"
      >
        <ToggleButtonGroup
          exclusive
          size="small"
          value={type ?? ALL}
          aria-label={t('manage.filters.type')}
          onChange={(_event, value: string | null) => {
            // Clicking the selected button again keeps it (one option is always on).
            if (value !== null) {
              onType(isTimeOffType(value) ? value : undefined);
            }
          }}
          className="w-max"
        >
          <ToggleButton value={ALL} className="whitespace-nowrap">
            {t('manage.filters.allTypes')}
          </ToggleButton>
          {TIME_OFF_TYPES.map((option) => {
            const { icon: Icon, text } = TYPE_VISUALS[option];
            return (
              <ToggleButton key={option} value={option} className="gap-1.5 whitespace-nowrap">
                <Icon aria-hidden fontSize="small" className={text} />
                {t(`types.${option}`)}
              </ToggleButton>
            );
          })}
        </ToggleButtonGroup>
      </div>
      <FormControlLabel
        className="m-0 lg:ml-auto"
        control={
          <Switch
            checked={mine}
            onChange={(event) => {
              onMine(event.target.checked);
            }}
          />
        }
        label={t('manage.filters.mine')}
      />
    </div>
  );
}
