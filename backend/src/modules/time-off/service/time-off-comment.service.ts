import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { ResourceNotFoundException } from '../../../common/exception/api.exception';
import type { TimeOffCommentRecord } from '../repository/record/time-off-request.record';
import { NotificationType } from '../../notification/service/notification-type';
import { TimeOffRequestRepository } from '../repository/time-off-request.repository';
import { TimeOffNotifier } from './time-off-notifier';

/**
 * Comments on a request: any admin and the employee whose request it is write them; only the
 * author edits or deletes one (deleted physically — comments are not under a retention duty).
 * Every change marks the request as changed. Policies have checked who may act.
 */
@Injectable()
export class TimeOffCommentService {
  constructor(
    private readonly requestRepository: TimeOffRequestRepository,
    private readonly notifier: TimeOffNotifier,
  ) {}

  @Transactional()
  async add(requestId: string, body: string, authorId: string): Promise<TimeOffCommentRecord> {
    if (!(await this.requestRepository.findStateById(requestId))) {
      throw new ResourceNotFoundException();
    }
    const comment = await this.requestRepository.addComment(requestId, authorId, body);
    await this.requestRepository.touch(requestId, authorId);
    // The employee and the responsible people hear of it; edits and deletions are quiet.
    await this.notifier.notify(
      requestId,
      NotificationType.TIME_OFF_COMMENTED,
      authorId,
      'everyone',
    );
    return comment;
  }

  @Transactional()
  async edit(
    requestId: string,
    commentId: string,
    body: string,
    authorId: string,
  ): Promise<TimeOffCommentRecord> {
    const comment = await this.requestRepository.editComment(commentId, requestId, authorId, body);
    if (!comment) {
      throw new ResourceNotFoundException();
    }
    await this.requestRepository.touch(requestId, authorId);
    return comment;
  }

  @Transactional()
  async remove(requestId: string, commentId: string, authorId: string): Promise<void> {
    if (!(await this.requestRepository.deleteComment(commentId, requestId, authorId))) {
      throw new ResourceNotFoundException();
    }
    await this.requestRepository.touch(requestId, authorId);
  }
}
