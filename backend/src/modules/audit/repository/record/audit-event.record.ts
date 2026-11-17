import type { Prisma } from '../../../../generated/prisma/client';

export const auditEventSelect = {
    id: true,
    occurredAt: true,
    action: true,
    targetType: true,
    targetId: true,
    targetLabel: true,
    changes: true,
    actor: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
            employee: { select: { position: { select: { title: true } } } },
        },
    },
} satisfies Prisma.AuditEventSelect;
export type AuditEventRecord = Prisma.AuditEventGetPayload<{ select: typeof auditEventSelect }>;

export const securityEventSelect = {
    id: true,
    occurredAt: true,
    action: true,
    ipAddress: true,
    userAgent: true,
} satisfies Prisma.AuditEventSelect;
export type SecurityEventRecord = Prisma.AuditEventGetPayload<{
    select: typeof securityEventSelect;
}>;
