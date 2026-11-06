import { z } from 'zod';

/** Mirrors backend CreateEmployeeRequestSchema (employee/controller/dto/create-employee.request.ts). */
export const EMPLOYEE_LIMITS = {
  name: 100,
  email: 254,
  mobile: 32,
  linkedin: 255,
  telegram: 33,
  address: 500,
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
  mobileInvalid: 'validation:mobile.invalid',
  personalEmailInvalid: 'validation:personalEmail.invalid',
  linkedinInvalid: 'validation:linkedin.invalid',
  telegramInvalid: 'validation:telegram.invalid',
  addressTooLong: 'validation:address.tooLong',
  responsiblesTooMany: 'validation:responsibles.tooMany',
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
  responsibleUserIds: z
    .array(z.uuid())
    .max(EMPLOYEE_LIMITS.responsibles, MESSAGES.responsiblesTooMany),
});

export type CreateEmployeeFormValues = z.input<typeof createEmployeeSchema>;
export type CreateEmployeeFormOutput = z.output<typeof createEmployeeSchema>;

/** Fields validated when leaving step 1 ("Details"). */
export const DETAILS_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'positionId',
  'startDate',
  'mobile',
  'personalEmail',
  'linkedinUrl',
  'telegram',
  'address',
] as const satisfies readonly (keyof CreateEmployeeFormValues)[];
