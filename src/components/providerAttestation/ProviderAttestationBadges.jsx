import { BadgeCheck, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    ATTESTATION_INSURED_LABEL,
    ATTESTATION_LICENSED_LABEL,
} from '@/lib/providerAttestation';

const badgeStyles = {
    licensed: 'bg-primary/10 text-sky-900 border-sky-200',
    insured: 'bg-indigo-100 text-indigo-900 border-indigo-200',
};

function AttestationBadge({ type, className, size = 'sm' }) {
    const sizeClass = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';
    const iconClass = size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3';
    const isLicensed = type === 'licensed';

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full border font-medium',
                badgeStyles[type],
                sizeClass,
                className
            )}
        >
            {isLicensed ? (
                <BadgeCheck className={iconClass} />
            ) : (
                <ShieldCheck className={iconClass} />
            )}
            {isLicensed ? ATTESTATION_LICENSED_LABEL : ATTESTATION_INSURED_LABEL}
        </span>
    );
}

export function LicensedBadge(props) {
    return <AttestationBadge type="licensed" {...props} />;
}

export function InsuredBadge(props) {
    return <AttestationBadge type="insured" {...props} />;
}

export function ProviderAttestationBadges({ licensed, insured, className, size = 'sm', layout = 'row' }) {
    if (!licensed && !insured) return null;

    return (
        <div
            className={cn(
                layout === 'row' ? 'flex flex-wrap items-center gap-2' : 'flex flex-col items-start gap-1',
                className
            )}
        >
            {licensed && <LicensedBadge size={size} />}
            {insured && <InsuredBadge size={size} />}
        </div>
    );
}

export default ProviderAttestationBadges;
