import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { isApiError } from '@/shared/api/apiError';
import type { ErrorCode } from '@/shared/types';
import {
  type CreateEmployeeFormOutput,
  type CreateEmployeeFormValues,
  createEmployeeSchema,
  DETAILS_FIELDS,
} from '../schemas';
import type { CreatedEmployee, CreateEmployeeRequest, ResponsibleOption } from '../types';
import { useCreateEmployee } from './useEmployeeQueries';

export const AddEmployeeStep = { DETAILS: 0, RESPONSIBLE: 1, ACCESS: 2 } as const;
export type AddEmployeeStep = (typeof AddEmployeeStep)[keyof typeof AddEmployeeStep];

const todayIso = (): string => new Date().toISOString().slice(0, 10);

const emptyValues = (): CreateEmployeeFormValues => ({
  firstName: '',
  lastName: '',
  email: '',
  positionId: '',
  startDate: todayIso(),
  startingSalary: '',
  mobile: '',
  personalEmail: '',
  linkedinUrl: '',
  telegram: '',
  address: '',
  dateOfBirth: '',
  responsibleUserIds: [],
});

const FORM_FIELDS: ReadonlySet<string> = new Set(Object.keys(emptyValues()));
const DETAILS: ReadonlySet<string> = new Set(DETAILS_FIELDS);
const isFormField = (field: string): field is keyof CreateEmployeeFormValues =>
  FORM_FIELDS.has(field);

/** Blank optional fields are left out of the request. */
const toRequest = (values: CreateEmployeeFormOutput): CreateEmployeeRequest => {
  const optional = (value: string) => (value === '' ? undefined : value);
  return {
    firstName: values.firstName,
    lastName: values.lastName,
    email: values.email,
    positionId: values.positionId,
    startDate: values.startDate,
    startingSalary: values.startingSalary,
    ...(optional(values.mobile) ? { mobile: values.mobile } : {}),
    ...(optional(values.personalEmail) ? { personalEmail: values.personalEmail } : {}),
    ...(optional(values.linkedinUrl) ? { linkedinUrl: values.linkedinUrl } : {}),
    ...(optional(values.telegram) ? { telegram: values.telegram } : {}),
    ...(optional(values.address) ? { address: values.address } : {}),
    ...(optional(values.dateOfBirth) ? { dateOfBirth: values.dateOfBirth } : {}),
    responsibleUserIds: values.responsibleUserIds,
  };
};

/** The created employee and their sign-in details, shown on the Access step. */
export interface AddedEmployee {
  employee: CreatedEmployee;
  email: string;
}

/**
 * "Add employee": details, then responsibles, then — once created — the sign-in details with the
 * generated password (shown this once). One Idempotency-Key per opening of the dialog, reused on
 * every retry of that submission (api.md → Idempotency).
 */
export const useAddEmployeeForm = (onCreated: (employee: CreatedEmployee) => void) => {
  const create = useCreateEmployee();
  const [step, setStep] = useState<AddEmployeeStep>(AddEmployeeStep.DETAILS);
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  const [responsibles, setResponsibles] = useState<ResponsibleOption[]>([]);
  const [added, setAdded] = useState<AddedEmployee | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  const form = useForm<CreateEmployeeFormValues, unknown, CreateEmployeeFormOutput>({
    resolver: zodResolver(createEmployeeSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: emptyValues(),
  });

  // An actionable async error takes focus (ux.md → Focus moves with the UI).
  useEffect(() => {
    if (errorCount > 0) {
      errorRef.current?.focus();
    }
  }, [errorCount]);

  const reset = (): void => {
    form.reset(emptyValues());
    setResponsibles([]);
    setStep(AddEmployeeStep.DETAILS);
    setErrorCode(null);
    setIdempotencyKey(crypto.randomUUID());
    // The password leaves memory with the dialog.
    create.reset();
    setAdded(null);
    setIsSaved(false);
  };

  /** Done on the Access step: the parent hears of the new employee, the form starts afresh. */
  const finish = (): void => {
    if (added) {
      onCreated(added.employee);
    }
    reset();
  };

  const goNext = async (): Promise<void> => {
    setErrorCode(null);
    if (await form.trigger([...DETAILS_FIELDS], { shouldFocus: true })) {
      setStep(AddEmployeeStep.RESPONSIBLE);
    }
  };

  const goBack = (): void => {
    setErrorCode(null);
    setStep(AddEmployeeStep.DETAILS);
  };

  const selectResponsibles = (people: ResponsibleOption[]): void => {
    setResponsibles(people);
    form.setValue(
      'responsibleUserIds',
      people.map((person) => person.id),
    );
  };

  const submit = form.handleSubmit(async (values) => {
    setErrorCode(null);
    try {
      const created = await create.mutateAsync({ request: toRequest(values), idempotencyKey });
      setAdded({ employee: created, email: values.email });
      setStep(AddEmployeeStep.ACCESS);
    } catch (error) {
      if (!isApiError(error)) {
        throw error;
      }
      let hasFieldError = false;
      let hasDetailsError = false;
      for (const detail of error.details) {
        if (isFormField(detail.field)) {
          form.setError(detail.field, { type: 'server', message: detail.message });
          hasFieldError = true;
          hasDetailsError ||= DETAILS.has(detail.field);
        }
      }
      if (hasDetailsError) {
        // Step 1 remounts and focuses the first field in error.
        setStep(AddEmployeeStep.DETAILS);
      }
      if (!hasFieldError) {
        // Nothing to point at: the form-level line says what happened and takes focus.
        setErrorCode(error.code);
        setErrorCount((count) => count + 1);
      }
    }
  });

  return {
    form,
    step,
    goNext,
    goBack,
    submit,
    reset,
    finish,
    added,
    isSaved,
    setIsSaved,
    errorCode,
    errorRef,
    responsibles,
    selectResponsibles,
    isSubmitting: form.formState.isSubmitting,
  };
};

export type AddEmployeeForm = ReturnType<typeof useAddEmployeeForm>;
