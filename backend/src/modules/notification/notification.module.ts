import { Module } from '@nestjs/common';
import { NotificationController } from './controller/notification.controller';
import { NotificationRepository } from './repository/notification.repository';
import { NotificationService } from './service/notification.service';

/** In-app notifications (the bell); other modules send through NotificationService. */
@Module({
  controllers: [NotificationController],
  exports: [NotificationService],
  providers: [NotificationService, NotificationRepository],
})
export class NotificationModule {}
