import prisma from "@/lib/prisma";

export interface LogParams {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  entityOwnerId?: string;
  changes?: { field: string; before: unknown; after: unknown }[];
  metadata?: Record<string, unknown>;
}

export async function logActivity(params: LogParams): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        entityOwnerId: params.entityOwnerId ?? null,
        changes: params.changes as any ?? null,
        metadata: params.metadata as any ?? null,
      },
    });
  } catch (err) {
    console.error("[activityLog] Failed to write log entry:", err);
  }
}
