import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Baby } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { toast } from 'sonner';
import { CHILDREN_FRIENDLY_LABEL } from '@/lib/childrenFriendly';

function ChildrenFriendlyToggle({ title, description, checked, onSave, isSaving }) {
    return (
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-border p-4 bg-muted/20">
            <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 font-bold text-foreground">
                    <Baby className="w-5 h-5 text-primary" />
                    {title}
                </div>
                <p className="text-sm text-muted-foreground">{description}</p>
                {checked && (
                    <p className="text-xs font-medium text-emerald-700">{CHILDREN_FRIENDLY_LABEL}, visible to clients</p>
                )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <Label htmlFor={`cf-${title}`} className="text-sm text-muted-foreground sr-only">
                    {title}
                </Label>
                <Switch
                    id={`cf-${title}`}
                    checked={checked}
                    disabled={isSaving}
                    onCheckedChange={onSave}
                />
            </div>
        </div>
    );
}

export function ProviderChildrenFriendlyPanel({
    barberFriendly = false,
    shopFriendly = false,
    shopId,
    shopName,
}) {
    const queryClient = useQueryClient();

    const barberMutation = useMutation({
        mutationFn: (children_friendly) => sovereign.childrenFriendly.updateBarber(children_friendly),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['provider-children-friendly'] });
            queryClient.invalidateQueries({ queryKey: ['my-barber-profile'] });
            queryClient.invalidateQueries({ queryKey: ['explore-barbers'] });
            toast.success('Your kids-welcome setting updated');
        },
        onError: (e) => toast.error(e.message),
    });

    const shopMutation = useMutation({
        mutationFn: (children_friendly) => sovereign.childrenFriendly.updateShop(shopId, children_friendly),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['provider-children-friendly'] });
            queryClient.invalidateQueries({ queryKey: ['my-shop'] });
            queryClient.invalidateQueries({ queryKey: ['explore-shops'] });
            toast.success('Shop kids-welcome setting updated');
        },
        onError: (e) => toast.error(e.message),
    });

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-bold text-foreground">Children-friendly</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Help parents find you. Clients can filter for {CHILDREN_FRIENDLY_LABEL.toLowerCase()} shops and barbers.
                </p>
            </div>
            <ChildrenFriendlyToggle
                title="I welcome children"
                description="Show on your barber profile that you are comfortable serving kids (patience, kid cuts, family-friendly service)."
                checked={barberFriendly}
                isSaving={barberMutation.isPending}
                onSave={(v) => barberMutation.mutate(v)}
            />
            {shopId && (
                <ChildrenFriendlyToggle
                    title={shopName ? `${shopName}, kids welcome` : 'Shop welcomes children'}
                    description="Mark your entire shop as children-friendly. Applies to your shop profile and helps families discover your team."
                    checked={shopFriendly}
                    isSaving={shopMutation.isPending}
                    onSave={(v) => shopMutation.mutate(v)}
                />
            )}
        </div>
    );
}

export default ProviderChildrenFriendlyPanel;
