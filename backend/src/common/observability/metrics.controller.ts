import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { can } from '../security/policies';
import { Authorize } from '../security/security.decorators';
import { MetricsService } from './metrics.service';

@ApiExcludeController()
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  @Authorize(can.admin)
  @Header('Content-Type', 'text/plain; version=0.0.4')
  scrape(): Promise<string> {
    return this.metrics.registry.metrics();
  }
}
