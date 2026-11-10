import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const DEPARTMENT_NAME_MAX = 100;
export const POSITION_TITLE_MAX = 150;

const departmentName = z
  .string({ error: 'validation.structure.nameRequired' })
  .trim()
  .min(1, 'validation.structure.nameRequired')
  .max(DEPARTMENT_NAME_MAX, 'validation.structure.nameTooLong');

const positionTitle = z
  .string({ error: 'validation.structure.titleRequired' })
  .trim()
  .min(1, 'validation.structure.titleRequired')
  .max(POSITION_TITLE_MAX, 'validation.structure.titleTooLong');

const version = z.number().int().min(0);

export class CreateDepartmentRequest extends createZodDto(z.object({ name: departmentName })) {}

export class RenameDepartmentRequest extends createZodDto(
  z.object({ name: departmentName, version }),
) {}

export class CreatePositionRequest extends createZodDto(z.object({ title: positionTitle })) {}

export class RenamePositionRequest extends createZodDto(
  z.object({ title: positionTitle, version }),
) {}
