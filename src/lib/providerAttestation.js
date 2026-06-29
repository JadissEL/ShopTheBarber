export const ATTESTATION_LICENSED_LABEL = 'Licensed';

export const ATTESTATION_INSURED_LABEL = 'Insured';

export function parseAttestationFlag(value) {
    return value === true;
}

export function effectiveAttestation(barberFlag, shopFlag) {
    return parseAttestationFlag(barberFlag) || parseAttestationFlag(shopFlag);
}

export function effectiveLicensed(barberLicensed, shopLicensed) {
    return effectiveAttestation(barberLicensed, shopLicensed);
}

export function effectiveInsured(barberInsured, shopInsured) {
    return effectiveAttestation(barberInsured, shopInsured);
}

export function hasAnyAttestation(licensed, insured) {
    return licensed === true || insured === true;
}
