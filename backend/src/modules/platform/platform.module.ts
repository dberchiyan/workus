import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { CompanyController } from './controller/company.controller';
import { CompanyRepository } from './repository/company.repository';
import { CompanyService } from './service/company.service';

/** Workus platform administration (platform admins only): companies and their approval. */
@Module({
  imports: [AuditModule],
  controllers: [CompanyController],
  providers: [CompanyService, CompanyRepository],
})
export class PlatformModule {}
