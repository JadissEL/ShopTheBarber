import { Switch } from '@/components/ui/switch';

import { Home, Store } from 'lucide-react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { sovereign } from '@/api/apiClient';

import { toast } from 'sonner';

import { MOBILE_SERVICE_LABEL, SHOP_SERVICE_LABEL } from '@/lib/serviceLocation';



function ServiceLocationToggles({ offersShop, offersMobile, onUpdate, isPending, title, description }) {

    const tryUpdate = (next) => {

        const shop = next.offers_shop_service ?? offersShop;

        const mobile = next.offers_mobile_service ?? offersMobile;

        if (!shop && !mobile) {

            toast.error('Enable at least one: in-shop or at-home visits');

            return;

        }

        onUpdate(next);

    };



    return (

        <div className="space-y-4">

            {title && (

                <div>

                    <h4 className="font-bold text-foreground">{title}</h4>

                    {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}

                </div>

            )}

            <div className="flex items-start justify-between gap-4 rounded-2xl border border-border p-4 bg-muted/20">

                <div className="space-y-1 flex-1">

                    <div className="flex items-center gap-2 font-bold text-foreground">

                        <Store className="w-5 h-5 text-primary" />

                        {SHOP_SERVICE_LABEL}

                    </div>

                    <p className="text-sm text-muted-foreground">

                        Clients visit your chair, booth, or shop location.

                    </p>

                </div>

                <Switch

                    checked={offersShop}

                    disabled={isPending}

                    onCheckedChange={(v) => tryUpdate({ offers_shop_service: v })}

                    aria-label="Offer in-shop visits"

                />

            </div>

            <div className="flex items-start justify-between gap-4 rounded-2xl border border-border p-4 bg-muted/20">

                <div className="space-y-1 flex-1">

                    <div className="flex items-center gap-2 font-bold text-foreground">

                        <Home className="w-5 h-5 text-violet-600" />

                        {MOBILE_SERVICE_LABEL}

                    </div>

                    <p className="text-sm text-muted-foreground">

                        You travel to the client&apos;s home, office, or hotel.

                    </p>

                </div>

                <Switch

                    checked={offersMobile}

                    disabled={isPending}

                    onCheckedChange={(v) => tryUpdate({ offers_mobile_service: v })}

                    aria-label="Offer at-home visits"

                />

            </div>

            {offersShop && offersMobile && (

                <p className="text-xs text-muted-foreground rounded-lg border border-border bg-muted/30 p-3">

                    Both enabled, clients can choose in-shop or at-home when booking.

                </p>

            )}

            {offersShop && !offersMobile && (

                <p className="text-xs text-muted-foreground rounded-lg border border-border bg-muted/30 p-3">

                    In-shop only, at-home options are hidden for this profile.

                </p>

            )}

            {!offersShop && offersMobile && (

                <p className="text-xs text-violet-800 rounded-lg border border-violet-200 bg-violet-50/80 p-3">

                    At-home only, clients must enter their address; in-shop options are hidden.

                </p>

            )}

        </div>

    );

}



export function ProviderServiceLocationPanel() {

    const queryClient = useQueryClient();



    const { data: settings, isLoading } = useQuery({

        queryKey: ['provider-service-locations'],

        queryFn: () => sovereign.serviceLocation.getMySettings(),

    });



    const barberMutation = useMutation({

        mutationFn: (payload) => sovereign.serviceLocation.updateBarber(payload),

        onSuccess: () => {

            queryClient.invalidateQueries({ queryKey: ['provider-service-locations'] });

            queryClient.invalidateQueries({ queryKey: ['provider-mobile-service'] });

            queryClient.invalidateQueries({ queryKey: ['my-barber-profile'] });

            queryClient.invalidateQueries({ queryKey: ['explore-barbers'] });

            queryClient.invalidateQueries({ queryKey: ['homepage'] });

            toast.success('Your service location settings updated');

        },

        onError: (e) => toast.error(e.message),

    });



    const shopMutation = useMutation({

        mutationFn: ({ shopId, payload }) => sovereign.serviceLocation.updateShop(shopId, payload),

        onSuccess: () => {

            queryClient.invalidateQueries({ queryKey: ['provider-service-locations'] });

            queryClient.invalidateQueries({ queryKey: ['my-shop'] });

            queryClient.invalidateQueries({ queryKey: ['explore-shops'] });

            toast.success('Shop service location settings updated');

        },

        onError: (e) => toast.error(e.message),

    });



    if (isLoading) {

        return <p className="text-sm text-muted-foreground">Loading service location settings…</p>;

    }



    const barber = settings?.barber ?? settings;

    const shop = settings?.shop ?? null;

    const barberShop = barber?.offers_shop_service ?? true;

    const barberMobile = barber?.offers_mobile_service ?? false;

    const shopOffersShop = shop?.offers_shop_service ?? true;

    const shopOffersMobile = shop?.offers_mobile_service ?? false;



    return (

        <div className="space-y-8">

            <div>

                <h3 className="text-lg font-bold text-foreground">Where you serve clients</h3>

                <p className="text-sm text-muted-foreground mt-1">

                    Barbers and shop owners choose in-shop only, at-home only, or both. Clients only see options that

                    match your setup. Most shop owners keep in-shop only, that is the default.

                </p>

            </div>



            {shop?.id && (

                <ServiceLocationToggles

                    title={shop.name ? `${shop.name}, shop bookings` : 'Your shop'}

                    description="Applies when clients book through your shop profile or select your shop as the location. Shop-only owners typically leave at-home disabled."

                    offersShop={shopOffersShop}

                    offersMobile={shopOffersMobile}

                    isPending={shopMutation.isPending}

                    onUpdate={(payload) => shopMutation.mutate({ shopId: shop.id, payload })}

                />

            )}



            <ServiceLocationToggles

                title={shop?.id ? 'Your personal barber profile' : 'Your barber profile'}

                description={

                    shop?.id

                        ? 'Applies to independent bookings outside the shop, or when a client books you directly.'

                        : 'Choose in-shop only, at-home only, or both for your profile.'

                }

                offersShop={barberShop}

                offersMobile={barberMobile}

                isPending={barberMutation.isPending}

                onUpdate={(payload) => barberMutation.mutate(payload)}

            />

        </div>

    );

}


