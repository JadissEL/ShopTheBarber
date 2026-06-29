/** Normalize dispute status from DB (open) or legacy UI (Open / In Review). */
export function normalizeDisputeStatus(status) {
    const s = String(status ?? 'open')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_');
    if (s === 'in_review') return 'in_review';
    if (s === 'resolved') return 'resolved';
    return 'open';
}

export function disputeStatusLabel(status) {
    const s = normalizeDisputeStatus(status);
    if (s === 'in_review') return 'In Review';
    if (s === 'resolved') return 'Resolved';
    return 'Open';
}

export function isDisputeResolvable(status) {
    const s = normalizeDisputeStatus(status);
    return s === 'open' || s === 'in_review';
}
