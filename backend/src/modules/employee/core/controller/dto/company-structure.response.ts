import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const StructurePositionSchema = z
  .object({
    id: z.uuid(),
    title: z.string(),
    /** People holding it today (leavers not counted). */
    employeeCount: z.number().int().min(0),
    /** Nobody — current or former — holds it, so it can be removed. */
    removable: z.boolean(),
    version: z.number().int(),
  })
  .meta({ id: 'StructurePosition' });

export const DepartmentSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    /** Positions by title. */
    positions: z.array(StructurePositionSchema).max(200),
    version: z.number().int(),
  })
  .meta({ id: 'Department' });

/** The whole structure: departments in their order. */
export class CompanyStructureResponse extends createZodDto(
  z.object({ departments: z.array(DepartmentSchema).max(50) }),
) {}

export class DepartmentResponse extends createZodDto(z.object(DepartmentSchema.shape)) {}

export class StructurePositionResponse extends createZodDto(
  z.object(StructurePositionSchema.shape),
) {}
