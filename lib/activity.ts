import { db } from "@/lib/db"
import { activityLogs } from "@/lib/db/schema"

type ActivityInput = {
  entity: string
  entityId?: string | null
  action: string
  summary: string
  metadata?: Record<string, unknown>
  actorId?: string | null
  actorName?: string | null
}

export async function logActivity(input: ActivityInput) {
  const now = Date.now()
  const record = {
    id: `act_${crypto.randomUUID()}`,
    entity: input.entity,
    entityId: input.entityId ?? null,
    action: input.action,
    summary: input.summary,
    metadata: input.metadata ?? {},
    actorId: input.actorId ?? null,
    actorName: input.actorName ?? null,
    createdAt: now,
  }

  try {
    await db.insert(activityLogs).values(record)
  } catch (error) {
    console.error("[activity] Failed to log activity", error)
  }
}
