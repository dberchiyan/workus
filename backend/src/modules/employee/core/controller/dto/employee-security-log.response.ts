import { createZodDto } from 'nestjs-zod';
import { SecurityEventPageSchema } from '../../../../../common/dto/security-event.response';

export class EmployeeSecurityLogResponse extends createZodDto(SecurityEventPageSchema) {}
