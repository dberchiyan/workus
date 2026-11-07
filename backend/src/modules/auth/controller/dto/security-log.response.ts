import { createZodDto } from 'nestjs-zod';
import { SecurityEventPageSchema } from '../../../../common/dto/security-event.response';

export class SecurityLogResponse extends createZodDto(SecurityEventPageSchema) {}
