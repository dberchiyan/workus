import { Controller, Get, HttpStatus, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { ApiPageable, type Pageable, PageableQuery } from '../../../common/dto/pageable';
import { UuidParam } from '../../../common/dto/uuid-param';
import { ApiErrors } from '../../../common/exception/api-errors.decorator';
import { ResourceNotFoundException } from '../../../common/exception/api.exception';
import { CurrentPrincipal } from '../../../common/security/current-principal.decorator';
import { can } from '../../../common/security/policies';
import type { Principal } from '../../../common/security/principal';
import { Authorize } from '../../../common/security/security.decorators';
import { NOTIFICATION_PAGEABLE, type NotificationSortField } from '../service/notification-sort';
import { NotificationService } from '../service/notification.service';
import {
  NotificationPageResponse,
  NotificationResponse,
  UnreadNotificationsResponse,
} from './dto/notification.response';
import { toNotificationResponse } from './mapper/notification.mapper';

/** The caller's own notifications (the bell). */
@ApiTags('Notifications')
@Controller('api/v1/notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @Authorize(can.authenticated)
  @ApiOperation({ summary: "A page of the caller's notifications, newest first" })
  @ApiPageable(NOTIFICATION_PAGEABLE)
  @ZodResponse({ status: HttpStatus.OK, type: NotificationPageResponse })
  @ApiErrors('INVALID_PARAMETER', 'UNAUTHORIZED', 'SESSION_EXPIRED')
  async findPage(
    @CurrentPrincipal() principal: Principal,
    @PageableQuery(NOTIFICATION_PAGEABLE) pageable: Pageable<NotificationSortField>,
  ): Promise<NotificationPageResponse> {
    const page = await this.notificationService.findPage(
      principal.organisationId,
      principal.userId,
      pageable,
    );
    return {
      content: page.content.flatMap((row) => toNotificationResponse(row) ?? []),
      totalElements: page.totalElements,
    };
  }

  @Get('unread-count')
  @Authorize(can.authenticated)
  @ApiOperation({
    summary: "How many of the caller's notifications are unread (the bell polls it)",
  })
  @ZodResponse({ status: HttpStatus.OK, type: UnreadNotificationsResponse })
  @ApiErrors('UNAUTHORIZED', 'SESSION_EXPIRED')
  async unreadCount(
    @CurrentPrincipal() principal: Principal,
  ): Promise<UnreadNotificationsResponse> {
    return {
      count: await this.notificationService.countUnread(principal.organisationId, principal.userId),
    };
  }

  @Put('read')
  @Authorize(can.authenticated)
  @ApiOperation({
    summary: "Mark all of the caller's notifications read; answers the unread count",
  })
  @ZodResponse({ status: HttpStatus.OK, type: UnreadNotificationsResponse })
  @ApiErrors('UNAUTHORIZED', 'SESSION_EXPIRED', 'FORBIDDEN')
  async markAllRead(
    @CurrentPrincipal() principal: Principal,
  ): Promise<UnreadNotificationsResponse> {
    await this.notificationService.markAllRead(principal.organisationId, principal.userId);
    return {
      count: await this.notificationService.countUnread(principal.organisationId, principal.userId),
    };
  }

  @Put(':notificationId/read')
  @Authorize(can.readOwnNotification)
  @ApiOperation({ summary: 'Mark one of own notifications read (repeating changes nothing)' })
  @ZodResponse({ status: HttpStatus.OK, type: NotificationResponse })
  @ApiErrors('INVALID_PARAMETER', 'UNAUTHORIZED', 'SESSION_EXPIRED', 'FORBIDDEN')
  async markRead(
    @UuidParam('notificationId') notificationId: string,
    @CurrentPrincipal() principal: Principal,
  ): Promise<NotificationResponse> {
    const notification = toNotificationResponse(
      await this.notificationService.markRead(
        principal.organisationId,
        principal.userId,
        notificationId,
      ),
    );
    if (!notification) {
      throw new ResourceNotFoundException();
    }
    return notification;
  }
}
