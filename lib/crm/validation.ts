import { z } from "zod";
import {
  CRM_RELATIONSHIP_TYPES,
  CRM_SEGMENTS,
  CRM_TASK_KINDS,
  CRM_TASK_PRIORITIES,
  CRM_TASK_STATUSES,
  CRM_TOUCH_DIRECTIONS,
  CRM_TOUCH_TYPES,
} from "@/lib/crm/workflows";

const optionalUuid = z.string().uuid().optional().nullable().or(z.literal(""));
const optionalShortText = z.string().trim().max(240).optional().nullable().or(z.literal(""));
const optionalLongText = z.string().trim().max(4000).optional().nullable().or(z.literal(""));

export const crmTaskSchema = z.object({
  kind: z.enum(CRM_TASK_KINDS).default("follow_up"),
  title: z.string().trim().min(1).max(240),
  description: optionalLongText,
  dueAt: optionalShortText,
  priority: z.enum(CRM_TASK_PRIORITIES).default("medium"),
  status: z.enum(CRM_TASK_STATUSES).default("open"),
  segment: z.enum(CRM_SEGMENTS).optional().nullable().or(z.literal("")),
  contactId: optionalUuid,
  transactionId: optionalUuid,
});

export const crmTouchpointSchema = z.object({
  contactId: z.string().uuid(),
  transactionId: optionalUuid,
  touchType: z.enum(CRM_TOUCH_TYPES).default("note"),
  direction: z.enum(CRM_TOUCH_DIRECTIONS).default("internal"),
  body: optionalLongText,
  outcome: optionalLongText,
  nextAction: optionalLongText,
  occurredAt: optionalShortText,
});

export const crmRelationshipSchema = z.object({
  primaryContactId: z.string().uuid(),
  relatedContactId: optionalUuid,
  relationshipType: z.enum(CRM_RELATIONSHIP_TYPES).default("other"),
  notes: optionalLongText,
  status: z.enum(["active", "archived"]).default("active"),
});

export type CrmTaskPayload = z.infer<typeof crmTaskSchema>;
export type CrmTouchpointPayload = z.infer<typeof crmTouchpointSchema>;
export type CrmRelationshipPayload = z.infer<typeof crmRelationshipSchema>;

export function nullableText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function nullableUuid(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function nullableDateTime(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}
