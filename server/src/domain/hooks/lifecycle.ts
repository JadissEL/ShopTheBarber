/** Hook reputation + fraud rules into booking lifecycle events */
import { applyReputationEvent } from '../reputation/applyEvent';
import { syncBarberTrustScore } from '../reputation/barberTrust';
import { syncAvailabilityScore } from '../reputation/availabilityScore';
import { runFraudRulesForUser } from '../../fraud/rules';

export async function onBookingCompleted(clientId: string | null, barberId: string | null) {
    if (clientId) {
        await applyReputationEvent({ userId: clientId, eventType: 'booking_completed' });
        await runFraudRulesForUser(clientId).catch(() => {});
    }
    if (barberId) {
        await syncBarberTrustScore(barberId);
        await syncAvailabilityScore(barberId);
    }
}

export async function onBookingCancelled(clientId: string | null, barberId: string | null, late = false) {
    if (clientId && late) {
        await applyReputationEvent({ userId: clientId, eventType: 'late_cancellation' });
        await runFraudRulesForUser(clientId).catch(() => {});
    }
    if (barberId) {
        await syncBarberTrustScore(barberId);
    }
}

export async function onBookingNoShow(clientId: string | null, barberId: string | null) {
    if (clientId) {
        await applyReputationEvent({ userId: clientId, eventType: 'no_show' });
        await runFraudRulesForUser(clientId).catch(() => {});
    }
    if (barberId) {
        await syncBarberTrustScore(barberId);
    }
}

export async function onReferralRewarded(referrerId: string, programType: string) {
    const eventType = programType.includes('barber') ? 'referral_barber_success' : 'referral_client_success';
    await applyReputationEvent({ userId: referrerId, eventType });
}

export async function onDisputeLost(clientId: string | null) {
    if (clientId) {
        await applyReputationEvent({ userId: clientId, eventType: 'dispute_lost' });
        await runFraudRulesForUser(clientId).catch(() => {});
    }
}
