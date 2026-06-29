import crypto from 'crypto';
import { prisma } from '../../db/prisma';
import { assertValidLedgerEventType, type LedgerEventType } from './types';

export async function appendLedgerEntry(params: {
    entityType: string;
    entityId: string;
    eventType: LedgerEventType | string;
    payload?: Record<string, unknown> | null;
    actorId?: string | null;
}) {
    assertValidLedgerEventType(params.eventType);
    return prisma.ledger_entries.create({
        data: {
            id: crypto.randomUUID(),
            entity_type: params.entityType,
            entity_id: params.entityId,
            event_type: params.eventType,
            payload_json: params.payload ? JSON.stringify(params.payload) : null,
            actor_id: params.actorId ?? null,
        },
    });
}
