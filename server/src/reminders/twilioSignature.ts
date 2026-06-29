import twilio from 'twilio';

/** Validate Twilio webhook signature (required in production). */
export function validateTwilioWebhookSignature(params: {
    authToken: string | undefined;
    signature: string | undefined;
    url: string;
    body: Record<string, string | undefined>;
}): boolean {
    const { authToken, signature, url, body } = params;
    if (!authToken?.trim()) {
        return process.env.NODE_ENV !== 'production';
    }
    if (!signature) {
        return process.env.NODE_ENV !== 'production';
    }
    const formParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(body)) {
        if (value !== undefined) formParams[key] = value;
    }
    return twilio.validateRequest(authToken, signature, url, formParams);
}

export function buildTwilioWebhookUrl(request: {
    headers: Record<string, string | string[] | undefined>;
    url: string;
}): string {
    const protoHeader = request.headers['x-forwarded-proto'];
    const hostHeader = request.headers['x-forwarded-host'] || request.headers.host;
    const proto = (Array.isArray(protoHeader) ? protoHeader[0] : protoHeader) || 'https';
    const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;
    if (!host) return request.url;
    return `${proto}://${host}${request.url}`;
}
