/** @deprecated Use ProviderServiceLocationPanel, kept for backwards compatibility. */
import { Switch } from '@/components/ui/switch';
import { Home } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { toast } from 'sonner';
import { MOBILE_SERVICE_LABEL } from '@/lib/mobileService';

export function ProviderMobileServicePanel({ offersMobile = false }) {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (offers_mobile_service) => sovereign.mobileService.updateBarber(offers_mobile_service),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['provider-mobile-service'] });
            queryClient.invalidateQueries({ queryKey: ['my-barber-profile'] });
            queryClient.invalidateQueries({ queryKey: ['explore-barbers'] });
            queryClient.invalidateQueries({ queryKey: ['homepage'] });
            toast.success('Mobile service setting updated');
        },
        onError: (e) => toast.error(e.message),
    });

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-bold text-foreground">{MOBILE_SERVICE_LABEL}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Clients can book you at their home, office, or hotel. You&apos;ll appear on the homepage and in
                    &ldquo;At home&rdquo; booking filters. Optional add-on to in-shop group booking, enable both for weddings and parties at the client&apos;s address.
                </p>
            </div>
            <div className="flex items-start justify-between gap-4 stb-panel p-4 bg-muted/20">
                <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 font-bold text-foreground">
                        <Home className="w-5 h-5 text-primary" />
                        I offer at-home / mobile visits
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Bring your tools and deliver the same quality cut wherever the client is.
                    </p>
                    {offersMobile && (
                        <p className="text-xs font-medium text-primary">
                            {MOBILE_SERVICE_LABEL}, visible on homepage &amp; Explore
                        </p>
                    )}
                </div>
                <Switch
                    checked={offersMobile}
                    disabled={mutation.isPending}
                    onCheckedChange={(v) => mutation.mutate(v)}
                    aria-label="Offer mobile barber visits"
                />
            </div>
        </div>
    );
}
