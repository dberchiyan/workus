import { z } from 'zod';
import type { TerminationReason } from './types';

/** Mirrors backend CreateEmployeeRequestSchema (employee/controller/dto/create-employee.request.ts). */
export const EMPLOYEE_LIMITS = {
  name: 100,
  email: 254,
  mobile: 32,
  linkedin: 255,
  telegram: 33,
  address: 500,
  salary: 16,
  responsibles: 10,
} as const;

const MESSAGES = {
  firstNameRequired: 'validation:firstName.required',
  firstNameTooLong: 'validation:firstName.tooLong',
  lastNameRequired: 'validation:lastName.required',
  lastNameTooLong: 'validation:lastName.tooLong',
  emailRequired: 'validation:workEmail.required',
  emailInvalid: 'validation:email.invalid',
  emailTooLong: 'validation:email.tooLong',
  positionRequired: 'validation:position.required',
  startDateInvalid: 'validation:startDate.invalid',
  startingSalaryRequired: 'validation:startingSalary.required',
  salaryInvalid: 'validation:salary.invalid',
  mobileInvalid: 'validation:mobile.invalid',
  personalEmailInvalid: 'validation:personalEmail.invalid',
  linkedinInvalid: 'validation:linkedin.invalid',
  telegramInvalid: 'validation:telegram.invalid',
  addressTooLong: 'validation:address.tooLong',
  dateOfBirthInvalid: 'validation:dateOfBirth.invalid',
  dateOfBirthInFuture: 'validation:dateOfBirth.inFuture',
  responsiblesTooMany: 'validation:responsibles.tooMany',
  terminationDateInvalid: 'validation:terminationDate.invalid',
  terminationReasonRequired: 'validation:terminationReason.required',
  terminationCommentTooLong: 'validation:terminationComment.tooLong',
  terminationCommentRequired: 'validation:terminationComment.requiredForOther',
  structureNameRequired: 'validation:structure.nameRequired',
  structureNameTooLong: 'validation:structure.nameTooLong',
  structureTitleRequired: 'validation:structure.titleRequired',
  structureTitleTooLong: 'validation:structure.titleTooLong',
} as const;

export type EmployeeValidationMessage = (typeof MESSAGES)[keyof typeof MESSAGES];
const MESSAGE_SET: ReadonlySet<string> = new Set(Object.values(MESSAGES));
export const isEmployeeValidationMessage = (
  message: string,
): message is EmployeeValidationMessage => MESSAGE_SET.has(message);

/** Optional field: blank is fine, anything else must match. */
const optionalMatching = (max: number, pattern: RegExp, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .refine((value) => value === '' || pattern.test(value), message);

export const createEmployeeSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, MESSAGES.firstNameRequired)
    .max(EMPLOYEE_LIMITS.name, MESSAGES.firstNameTooLong),
  lastName: z
    .string()
    .trim()
    .min(1, MESSAGES.lastNameRequired)
    .max(EMPLOYEE_LIMITS.name, MESSAGES.lastNameTooLong),
  email: z
    .string()
    .trim()
    .min(1, MESSAGES.emailRequired)
    .max(EMPLOYEE_LIMITS.email, MESSAGES.emailTooLong)
    .pipe(z.email(MESSAGES.emailInvalid)),
  positionId: z.uuid(MESSAGES.positionRequired),
  startDate: z.iso.date(MESSAGES.startDateInvalid),
  /** Monthly USD, a decimal string with up to two places — never a number (data.md → Money). */
  startingSalary: z
    .string()
    .trim()
    .min(1, MESSAGES.startingSalaryRequired)
    .max(EMPLOYEE_LIMITS.salary, MESSAGES.salaryInvalid)
    .refine(
      (value) => /^\d{1,13}(\.\d{1,2})?$/.test(value) && /[1-9]/.test(value),
      MESSAGES.salaryInvalid,
    ),
  mobile: optionalMatching(
    EMPLOYEE_LIMITS.mobile,
    /^\+?[0-9][0-9 ()-]{5,30}$/,
    MESSAGES.mobileInvalid,
  ),
  personalEmail: optionalMatching(
    EMPLOYEE_LIMITS.email,
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MESSAGES.personalEmailInvalid,
  ),
  linkedinUrl: optionalMatching(
    EMPLOYEE_LIMITS.linkedin,
    /^https:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]{2,100}\/?$/,
    MESSAGES.linkedinInvalid,
  ),
  telegram: optionalMatching(
    EMPLOYEE_LIMITS.telegram,
    /^@?[A-Za-z0-9_]{5,32}$/,
    MESSAGES.telegramInvalid,
  ),
  address: z.string().trim().max(EMPLOYEE_LIMITS.address, MESSAGES.addressTooLong),
  /** Optional `YYYY-MM-DD`; blank is fine. The server checks "not in the future" by its own date. */
  dateOfBirth: z
    .string()
    .refine(
      (value) => value === '' || (/^\d{4}-\d{2}-\d{2}$/.test(value) && value >= '1900-01-01'),
      MESSAGES.dateOfBirthInvalid,
    )
    .refine(
      (value) => value === '' || value <= new Date().toISOString().slice(0, 10),
      MESSAGES.dateOfBirthInFuture,
    ),
  responsibleUserIds: z
    .array(z.uuid())
    .max(EMPLOYEE_LIMITS.responsibles, MESSAGES.responsiblesTooMany),
});

export type CreateEmployeeFormValues = z.input<typeof createEmployeeSchema>;
export type CreateEmployeeFormOutput = z.output<typeof createEmployeeSchema>;

/** Edit profile: the Add employee details without the starting salary (edited as its review). */
export const updateEmployeeSchema = createEmployeeSchema.omit({
  startingSalary: true,
  responsibleUserIds: true,
});
export type UpdateEmployeeFormValues = z.input<typeof updateEmployeeSchema>;
export type UpdateEmployeeFormOutput = z.output<typeof updateEmployeeSchema>;

export const TERMINATION_COMMENT_MAX = 500;

/** Mirrors backend TerminateEmployeeRequest. */
export const terminateEmployeeSchema = z
  .object({
    date: z.iso.date('validation:terminationDate.invalid'),
    reason: z.string().min(1, 'validation:terminationReason.required'),
    comment: z
      .string()
      .trim()
      .max(TERMINATION_COMMENT_MAX, 'validation:terminationComment.tooLong'),
  })
  .superRefine((values, context) => {
    if (values.reason === 'OTHER' && values.comment === '') {
      context.addIssue({
        code: 'custom',
        path: ['comment'],
        message: 'validation:terminationComment.requiredForOther',
      });
    }
  });
export type TerminateEmployeeFormValues = z.input<typeof terminateEmployeeSchema>;

/** Fields validated when leaving step 1 ("Details"). */
export const DETAILS_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'positionId',
  'startDate',
  'startingSalary',
  'mobile',
  'personalEmail',
  'linkedinUrl',
  'telegram',
  'address',
  'dateOfBirth',
] as const satisfies readonly (keyof CreateEmployeeFormValues)[];

export const TERMINATION_REASONS = [
  'RESIGNATION',
  'DISMISSAL',
  'END_OF_CONTRACT',
  'LAYOFF',
  'OTHER',
] as const satisfies readonly TerminationReason[];
const TERMINATION_REASON_SET: ReadonlySet<string> = new Set(TERMINATION_REASONS);
export const isTerminationReason = (value: string): value is TerminationReason =>
  TERMINATION_REASON_SET.has(value);

/** Mirrors backend company-structure.request.ts. */
export const STRUCTURE_LIMITS = { departmentName: 100, positionTitle: 150 } as const;

/** One name in the company structure: a department's name or a position's title. */
export const structureNameSchema = (kind: 'department' | 'position') =>
  z.object({
    value:
      kind === 'department'
        ? z
            .string()
            .trim()
            .min(1, MESSAGES.structureNameRequired)
            .max(STRUCTURE_LIMITS.departmentName, MESSAGES.structureNameTooLong)
        : z
            .string()
            .trim()
            .min(1, MESSAGES.structureTitleRequired)
            .max(STRUCTURE_LIMITS.positionTitle, MESSAGES.structureTitleTooLong),
  });
export type StructureNameValues = z.input<ReturnType<typeof structureNameSchema>>;
export type StructureNameOutput = z.output<ReturnType<typeof structureNameSchema>>;
