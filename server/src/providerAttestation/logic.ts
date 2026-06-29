import {
    ATTESTATION_DESCRIPTION,
    ATTESTATION_INSURED_DESCRIPTION,
    ATTESTATION_INSURED_LABEL,
    ATTESTATION_LICENSED_DESCRIPTION,
    ATTESTATION_LICENSED_LABEL,
} from './config';

export function parseAttestationFlag(value: boolean | null | undefined): boolean {
    return value === true;
}

export function effectiveAttestation(
    barberFlag: boolean | null | undefined,
    shopFlag: boolean | null | undefined
): boolean {
    return parseAttestationFlag(barberFlag) || parseAttestationFlag(shopFlag);
}

export function getProviderAttestationConfig() {
    return {
        licensed: {
            label: ATTESTATION_LICENSED_LABEL,
            description: ATTESTATION_LICENSED_DESCRIPTION,
        },
        insured: {
            label: ATTESTATION_INSURED_LABEL,
            description: ATTESTATION_INSURED_DESCRIPTION,
        },
        description: ATTESTATION_DESCRIPTION,
    };
}

export type AttestationFlags = {
    licensed: boolean;
    insured: boolean;
};

export function parseAttestationBody(body: {
    licensed?: unknown;
    insured?: unknown;
}): AttestationFlags {
    return {
        licensed: body.licensed === true,
        insured: body.insured === true,
    };
}

export function serializeAttestationSettings(row: {
    id: string;
    name?: string;
    attestation_licensed?: boolean | null;
    attestation_insured?: boolean | null;
}) {
    return {
        id: row.id,
        name: row.name,
        licensed: parseAttestationFlag(row.attestation_licensed),
        insured: parseAttestationFlag(row.attestation_insured),
    };
}

export function serializeEffectiveAttestation(
    barber: { attestation_licensed?: boolean | null; attestation_insured?: boolean | null } | null,
    shop: {
        attestation_licensed?: boolean | null;
        attestation_insured?: boolean | null;
        name?: string | null;
    } | null
) {
    const barber_licensed = parseAttestationFlag(barber?.attestation_licensed);
    const shop_licensed = parseAttestationFlag(shop?.attestation_licensed);
    const barber_insured = parseAttestationFlag(barber?.attestation_insured);
    const shop_insured = parseAttestationFlag(shop?.attestation_insured);

    return {
        barber_licensed,
        shop_licensed,
        barber_insured,
        shop_insured,
        licensed: effectiveAttestation(barber?.attestation_licensed, shop?.attestation_licensed),
        insured: effectiveAttestation(barber?.attestation_insured, shop?.attestation_insured),
        shop_name: shop?.name ?? null,
    };
}
