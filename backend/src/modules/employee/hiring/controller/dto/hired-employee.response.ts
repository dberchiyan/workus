import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class HiredEmployeeResponse extends createZodDto(
  z.object({ id: z.uuid(), firstName: z.string(), lastName: z.string() }),
) {}
