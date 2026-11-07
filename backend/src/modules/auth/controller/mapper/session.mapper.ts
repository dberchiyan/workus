import { ClientType } from '../../../../common/security/principal';
import type { SessionListRecord } from '../../repository/record/session.record';
import type { SessionsResponse } from '../dto/sessions.response';

type SessionItem = SessionsResponse['others']['content'][number];

const toSession = (session: SessionListRecord): SessionItem => ({
  id: session.id,
  clientType: session.clientType === ClientType.MOBILE ? 'MOBILE' : 'WEB',
  ip: session.ip,
  userAgent: session.userAgent,
  createdAt: session.createdAt.toISOString(),
  lastSeenAt: session.lastSeenAt.toISOString(),
});

export const toSessionsResponse = (sessions: {
  current: SessionListRecord | null;
  others: { content: SessionListRecord[]; totalElements: number };
}): SessionsResponse => ({
  current: sessions.current ? toSession(sessions.current) : null,
  others: {
    content: sessions.others.content.map(toSession),
    totalElements: sessions.others.totalElements,
  },
});
