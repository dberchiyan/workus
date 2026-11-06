import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { HealthResponse } from '../dto/health.response';
import { ApiErrors } from '../exception/api-errors.decorator';
import { UpstreamUnavailableException } from '../exception/api.exception';
import { PersistenceHealthIndicator } from '../persistence/persistence-health.indicator';
import { Public } from '../security/security.decorators';

const DATABASE_INDICATOR = 'database';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly persistence: PersistenceHealthIndicator) {}

  @Get('live')
  @Public()
  @ApiOperation({ summary: 'Report that the process is running' })
  @ZodResponse({ status: HttpStatus.OK, type: HealthResponse })
  live(): HealthResponse {
    return { status: 'ok' };
  }

  @Get('ready')
  @Public()
  @ApiOperation({ summary: 'Report whether the service can take traffic' })
  @ZodResponse({ status: HttpStatus.OK, type: HealthResponse })
  @ApiErrors('UPSTREAM_UNAVAILABLE')
  async ready(): Promise<HealthResponse> {
    const result = await this.persistence.isHealthy(DATABASE_INDICATOR);
    if (result[DATABASE_INDICATOR]?.status !== 'up') {
      throw new UpstreamUnavailableException();
    }
    return { status: 'ok' };
  }
}
