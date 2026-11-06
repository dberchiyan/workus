import ListSubheader from '@mui/material/ListSubheader';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect } from 'react';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { usePositionOptions } from '../hooks/useEmployeeQueries';
import { useFieldMessage } from '../hooks/useFieldMessage';
import {
  EMPLOYEE_LIMITS,
  type UpdateEmployeeFormOutput,
  type UpdateEmployeeFormValues,
} from '../schemas';

type TextFieldName = Exclude<keyof UpdateEmployeeFormValues, 'positionId' | 'startDate'>;

export interface EditProfileFieldsProps {
  form: UseFormReturn<UpdateEmployeeFormValues, unknown, UpdateEmployeeFormOutput>;
}

/** Overall info (required) and contact info (optional) — the Add employee details step. */
export function EditProfileFields({ form }: EditProfileFieldsProps) {
  const { t } = useTranslation('employee');
  const message = useFieldMessage();
  const positions = usePositionOptions(true);
  const { register, control, formState } = form;
  const { errors } = formState;

  // Dialog open → first control (ux.md → Focus moves with the UI).
  useEffect(() => {
    requestAnimationFrame(() => {
      form.setFocus('firstName');
    });
  }, [form]);

  const text = (
    name: TextFieldName,
    options: {
      max: number;
      required?: boolean;
      type?: string;
      inputMode?: 'tel' | 'email' | 'url';
      hint?: string;
      wide?: boolean;
    },
  ) => (
    <TextField
      {...register(name)}
      label={t(`add.fields.${name}`)}
      required={options.required ?? false}
      type={options.type ?? 'text'}
      autoComplete="off"
      error={Boolean(errors[name])}
      helperText={message(errors[name], options.max, options.hint)}
      className={options.wide ? 'sm:col-span-2' : undefined}
      slotProps={{
        htmlInput: {
          maxLength: options.max,
          ...(options.inputMode ? { inputMode: options.inputMode } : {}),
        },
      }}
    />
  );

  return (
    <div className="flex flex-col gap-6">
      <fieldset className="m-0 grid grid-cols-1 gap-x-4 gap-y-2 border-0 p-0 sm:grid-cols-2">
        <Typography variant="subtitle2" component="legend" className="mb-3 p-0">
          {t('add.sections.overall')}
        </Typography>
        {text('firstName', { max: EMPLOYEE_LIMITS.name, required: true })}
        {text('lastName', { max: EMPLOYEE_LIMITS.name, required: true })}
        {text('email', {
          max: EMPLOYEE_LIMITS.email,
          required: true,
          type: 'email',
          inputMode: 'email',
          hint: t('add.hints.email'),
          wide: true,
        })}
        <Controller
          control={control}
          name="positionId"
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              select
              required
              label={t('add.fields.positionId')}
              error={Boolean(fieldState.error)}
              helperText={message(fieldState.error)}
              disabled={positions.isPending}
            >
              {(positions.data ?? []).flatMap((position, index, all) => [
                ...(index === 0 || all[index - 1]?.category.id !== position.category.id
                  ? [
                      <ListSubheader key={`group-${position.category.id}`}>
                        {position.category.name}
                      </ListSubheader>,
                    ]
                  : []),
                <MenuItem key={position.id} value={position.id}>
                  {position.title}
                </MenuItem>,
              ])}
            </TextField>
          )}
        />
        <TextField
          {...register('startDate')}
          type="date"
          required
          label={t('add.fields.startDate')}
          error={Boolean(errors.startDate)}
          helperText={message(errors.startDate, undefined, t('edit.hints.startDate'))}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </fieldset>
      <fieldset className="m-0 grid grid-cols-1 gap-x-4 gap-y-2 border-0 p-0 sm:grid-cols-2">
        <Typography variant="subtitle2" component="legend" className="mb-3 p-0">
          {t('add.sections.contact')}
        </Typography>
        {text('mobile', { max: EMPLOYEE_LIMITS.mobile, type: 'tel', inputMode: 'tel' })}
        {text('personalEmail', { max: EMPLOYEE_LIMITS.email, type: 'email', inputMode: 'email' })}
        {text('linkedinUrl', { max: EMPLOYEE_LIMITS.linkedin, type: 'url', inputMode: 'url' })}
        {text('telegram', { max: EMPLOYEE_LIMITS.telegram })}
        {text('address', { max: EMPLOYEE_LIMITS.address, wide: true })}
      </fieldset>
    </div>
  );
}
