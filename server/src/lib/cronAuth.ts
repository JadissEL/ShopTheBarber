const AUTO_CONFIRM_HOURS = 2;

export function verifyCronSecret(request: {
    headers: Record<string, string | string[] | undefined>;
}): boolean {
    const expected = process.env.CRON_SECRET?.trim();
    if (!expected) return process.env.NODE_ENV !== 'production';
    const header = request.headers['x-cron-secret'] || request.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
        return header.slice(7) === expected;
    }
    return header === expected;
}

export { AUTO_CONFIRM_HOURS };
