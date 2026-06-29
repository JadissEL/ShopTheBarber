import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { BadgeCheck, ShieldCheck } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { toast } from 'sonner';
import {
    ATTESTATION_INSURED_LABEL,
    ATTESTATION_LICENSED_LABEL,
} from '@/lib/providerAttestation';

function AttestationToggle({ title, description, icon: Icon, checked, onSave, isSaving, idSuffix }) {
    return (
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-border p-4 bg-muted/20">
            <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 font-bold text-foreground">
                    <Icon className="w-5 h-5 text-primary" />
                    {title}
                </div>
                <p className="text-sm text-muted-foreground">{description}</p>
                {checked && (
                    <p className="text-xs font-medium text-sky-800">{title}, visible to clients</p>
                )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <Label htmlFor={`attestation-${idSuffix}`} className="text-sm text-muted-foreground sr-only">
                    {title}
                </Label>
                <Switch
                    id={`attestation-${idSuffix}`}
                    checked={checked}
                    disabled={isSaving}
                    onCheckedChange={onSave}
                />
            </div>
        </div>
    );
}

export function ProviderAttestationPanel({
    barberLicensed = false,
    barberInsured = false,
    shopLicensed = false,
    shopInsured = false,
    shopId,
    shopName,
}) {
    const queryClient = useQueryClient();

    const barberMutation = useMutation({
        mutationFn: (flags) => sovereign.providerAttestation.updateBarber(flags),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['provider-attestation'] });
            queryClient.invalidateQueries({ queryKey: ['my-barber-profile'] });
            queryClient.invalidateQueries({ queryKey: ['explore-barbers'] });
            toast.success('Your trust badges updated');
        },
        onError: (e) => toast.error(e.message),
    });

    const shopMutation = useMutation({
        mutationFn: (flags) => sovereign.providerAttestation.updateShop(shopId, flags),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['provider-attestation'] });
            queryClient.invalidateQueries({ queryKey: ['my-shop'] });
            queryClient.invalidateQueries({ queryKey: ['explore-shops'] });
            toast.success('Shop trust badges updated');
        },
        onError: (e) => toast.error(e.message),
    });

    const saveBarber = (patch) =>
        barberMutation.mutate({
            licensed: patch.licensed ?? barberLicensed,
            insured: patch.insured ?? barberInsured,
        });

    const saveShop = (patch) =>
        shopMutation.mutate({
            licensed: patch.licensed ?? shopLicensed,
            insured: patch.insured ?? shopInsured,
        });

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-bold text-foreground">Trust & attestation</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Show clients that you are {ATTESTATION_LICENSED_LABEL.toLowerCase()} and/or {ATTESTATION_INSURED_LABEL.toLowerCase()}.
                    These reflect your self-declaration and appear on your public profile.
                </p>
            </div>

            <AttestationToggle
                idSuffix="barber-licensed"
                title={`I am ${ATTESTATION_LICENSED_LABEL.toLowerCase()}`}
                description="Display a Licensed badge on your barber profile when you hold a valid professional license."
                icon={BadgeCheck}
                checked={barberLicensed}
                isSaving={barberMutation.isPending}
                onSave={(v) => saveBarber({ licensed: v })}
            />
            <AttestationToggle
                idSuffix="barber-insured"
                title={`I am ${ATTESTATION_INSURED_LABEL.toLowerCase()}`}
                description="Display an Insured badge when you carry liability insurance for your services."
                icon={ShieldCheck}
                checked={barberInsured}
                isSaving={barberMutation.isPending}
                onSave={(v) => saveBarber({ insured: v })}
            />

            {shopId && (
                <>
                    <AttestationToggle
                        idSuffix="shop-licensed"
                        title={shopName ? `${shopName}, ${ATTESTATION_LICENSED_LABEL.toLowerCase()}` : `Shop is ${ATTESTATION_LICENSED_LABEL.toLowerCase()}`}
                        description="Mark your shop as licensed. Applies to your shop profile and team discovery."
                        icon={BadgeCheck}
                        checked={shopLicensed}
                        isSaving={shopMutation.isPending}
                        onSave={(v) => saveShop({ licensed: v })}
                    />
                    <AttestationToggle
                        idSuffix="shop-insured"
                        title={shopName ? `${shopName}, ${ATTESTATION_INSURED_LABEL.toLowerCase()}` : `Shop is ${ATTESTATION_INSURED_LABEL.toLowerCase()}`}
                        description="Mark your shop as insured for client peace of mind."
                        icon={ShieldCheck}
                        checked={shopInsured}
                        isSaving={shopMutation.isPending}
                        onSave={(v) => saveShop({ insured: v })}
                    />
                </>
            )}
        </div>
    );
}

export default ProviderAttestationPanel;
