import { useQuery } from '@tanstack/react-query';

import { sovereign } from '@/api/apiClient';

import { Scissors, ShieldCheck, Star } from 'lucide-react';



export default function ProviderPublicStats({ barberId, shopId, variant = 'profile', className = '' }) {

    const { data: stats, isLoading } = useQuery({

        queryKey: ['provider-public-stats', barberId, shopId],

        queryFn: () =>

            barberId

                ? sovereign.providerStats.getBarberPublic(barberId)

                : sovereign.providerStats.getShopPublic(shopId),

        enabled: !!(barberId || shopId),

        staleTime: 60_000,

    });

    const { data: trust } = useQuery({

        queryKey: ['barber-trust-public', barberId],

        queryFn: () => sovereign.trust.getBarberTrust(barberId),

        enabled: !!barberId,

        staleTime: 120_000,

    });



    if (isLoading || !stats) return null;



    const count = stats.completed_services ?? 0;

    const completion =

        stats.completion_rate_percent != null && stats.completion_rate_percent > 0

            ? `${stats.completion_rate_percent}%`

            : null;

    const repeat =

        stats.repeat_customer_rate_percent != null && stats.repeat_customer_rate_percent > 0

            ? `${stats.repeat_customer_rate_percent}% repeat`

            : null;

    const tenure =

        stats.years_on_platform != null && stats.years_on_platform > 0

            ? `${stats.years_on_platform} yr${stats.years_on_platform === 1 ? '' : 's'}`

            : null;



    if (variant === 'compact' || variant === 'compact-light') {

        const textClass = variant === 'compact-light' ? 'text-white/90' : 'text-muted-foreground';

        const extra = completion ? ` · ${completion} completion` : '';

        return (

            <span className={`inline-flex items-center gap-1 text-xs ${textClass} ${className}`}>

                <Scissors className="w-3 h-3" />

                {count.toLocaleString()} completed{extra}

            </span>

        );

    }



    if (variant === 'profile-row') {

        return (

            <div className={`grid grid-cols-3 gap-2 ${className}`}>

                <div className="bg-muted/50 dark:bg-muted/40 rounded-xl p-3 text-center border border-border">

                    <Scissors className="w-4 h-4 text-primary mx-auto mb-1" />

                    <span className="block font-bold text-foreground text-sm">{count.toLocaleString()}</span>

                    <span className="text-[10px] text-muted-foreground block leading-tight">Completed</span>

                </div>

                <div className="bg-muted/50 dark:bg-muted/40 rounded-xl p-3 text-center border border-border">

                    <Star className="w-4 h-4 text-amber-500 mx-auto mb-1" />

                    <span className="block font-bold text-foreground text-sm">{completion ?? '—'}</span>

                    <span className="text-[10px] text-muted-foreground block leading-tight">Completion</span>

                </div>

                <div className="bg-muted/50 dark:bg-muted/40 rounded-xl p-3 text-center border border-border">

                    <ShieldCheck className="w-4 h-4 text-primary mx-auto mb-1" />

                    <span className="block font-bold text-foreground text-sm truncate px-0.5">

                        {tenure ?? (repeat ? repeat.split(' ')[0] : 'Verified')}

                    </span>

                    <span className="text-[10px] text-muted-foreground block leading-tight">

                        {tenure ? 'On platform' : repeat ? 'Repeat rate' : 'Trust'}

                    </span>

                </div>

            </div>

        );

    }



    return (

        <div className={`grid gap-2 ${className}`}>

            <div className="bg-muted/50 rounded-xl p-3 text-center border border-border">

                <Scissors className="w-5 h-5 text-primary mx-auto mb-1" />

                <span className="block font-bold text-foreground">{count.toLocaleString()}</span>

                <span className="text-xs text-muted-foreground block">services completed</span>

            </div>

            {(completion || repeat || tenure) && (

                <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">

                    {completion ? <span>{completion} completion rate</span> : null}

                    {repeat ? <span>{repeat}</span> : null}

                    {tenure ? <span>{tenure} on platform</span> : null}

                    {trust?.availability_label ? <span>{trust.availability_label}</span> : null}

                </div>

            )}

            {(stats.championship_badges?.length ?? 0) > 0 && (

                <div className="flex flex-wrap gap-1 justify-center">

                    {stats.championship_badges.map((b) => (

                        <span key={b} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">

                            {b.replace(/_/g, ' ')}

                        </span>

                    ))}

                </div>

            )}

        </div>

    );

}


