import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { sovereign } from '@/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Loader2, Percent, ShieldCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO, isValid } from 'date-fns';

function fmtDate(iso) {
    if (!iso) return '-';
    const d = parseISO(iso);
    return isValid(d) ? format(d, 'PP') : iso;
}

function statusBadge(status, paymentStatus) {
    if (status === 'active' && paymentStatus === 'paid') {
        return <Badge className="bg-emerald-100 text-emerald-800">Active</Badge>;
    }
    if (status === 'pending_payment') {
        return <Badge className="bg-amber-100 text-amber-800">Awaiting payment</Badge>;
    }
    if (status === 'expired') return <Badge variant="secondary">Expired</Badge>;
    if (status === 'cancelled') return <Badge variant="outline">Cancelled</Badge>;
    return <Badge variant="outline">{status}</Badge>;
}

function PlanBlock({ title, active, pendingPlan, quoteMonthly, quoteAnnual, enrollmentOpen, coverageYear, onSubscribe, onRenew, busy, scope }) {
    const symbol = '€';

    if (active?.commission_waived) {
        return (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <ShieldCheck className="w-5 h-5 text-emerald-700" />
                    <p className="font-semibold text-emerald-900">{title}, active</p>
                    <Badge className="bg-emerald-100 text-emerald-800">0% commission</Badge>
                </div>
                <p className="text-sm text-emerald-800">
                    {active.billing_cycle === 'annual' ? 'Annual' : 'Monthly'} plan for {active.coverage_year}
                    {', '}valid until {fmtDate(active.period_end)}
                </p>
                {active.billing_cycle === 'monthly' && (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => onRenew(scope)}>
                        Renew next month ({symbol}{quoteMonthly?.checkout_amount})
                    </Button>
                )}
            </div>
        );
    }

    if (pendingPlan && pendingPlan.status === 'pending_payment') {
        return (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-2">
                <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-700" />
                    <p className="font-semibold text-amber-900">{title}, checkout pending</p>
                </div>
                <p className="text-sm text-amber-800">
                    Complete payment to activate your {pendingPlan.billing_cycle} plan for {pendingPlan.coverage_year}.
                </p>
                <Button
                    size="sm"
                    disabled={!enrollmentOpen || busy}
                    onClick={() => onSubscribe(scope, pendingPlan.billing_cycle)}
                >
                    Resume checkout
                </Button>
            </div>
        );
    }

    const annualSavings = quoteAnnual?.annual_savings ?? 0;

    return (
        <div className="rounded-2xl border border-border p-4 space-y-3">
            <p className="font-semibold">{title}</p>
            <p className="text-sm text-muted-foreground">
                {symbol}{quoteMonthly?.monthly_fee_amount}/month instead of per-booking commission
            </p>
            {annualSavings > 0 && (
                <p className="text-xs text-violet-700">
                    Save {symbol}{annualSavings.toFixed(2)} with annual prepay (30% off)
                </p>
            )}
            <div className="grid sm:grid-cols-2 gap-2">
                <Button
                    variant="outline"
                    disabled={!enrollmentOpen || busy}
                    onClick={() => onSubscribe(scope, 'monthly')}
                >
                    Monthly, {symbol}{quoteMonthly?.checkout_amount}
                </Button>
                <Button
                    disabled={!enrollmentOpen || busy}
                    onClick={() => onSubscribe(scope, 'annual')}
                >
                    <Sparkles className="w-4 h-4 mr-1" />
                    Year prepay, {symbol}{quoteAnnual?.checkout_amount}
                    <span className="ml-1 text-xs opacity-90">(30% off)</span>
                </Button>
            </div>
            {!enrollmentOpen && (
                <p className="text-xs text-amber-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Enrollment for {coverageYear} opens January-March only.
                </p>
            )}
        </div>
    );
}

function PlanHistory({ plans }) {
    if (!plans?.length) return null;

    return (
        <div className="rounded-2xl border border-border/60 p-4 space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">Plan history</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
                {plans.map((p) => (
                    <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 text-sm border-b border-border/40 pb-2 last:border-0">
                        <span className="capitalize">{p.scope}, {p.billing_cycle}, {p.coverage_year}</span>
                        <div className="flex items-center gap-2">
                            {statusBadge(p.status, p.payment_status)}
                            <span className="text-xs text-muted-foreground">{fmtDate(p.period_end)}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function ProviderFixedFeePanel({ shopId, isShopOwner }) {
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();

    const { data, isLoading } = useQuery({
        queryKey: ['fixed-fee-status', shopId],
        queryFn: () => sovereign.fixedFee.getMe(shopId),
    });

    useEffect(() => {
        if (searchParams.get('fixedfee') === 'success') {
            queryClient.invalidateQueries({ queryKey: ['fixed-fee-status'] });
            queryClient.invalidateQueries({ queryKey: ['provider-wallet'] });
            const next = new URLSearchParams(searchParams);
            next.delete('fixedfee');
            setSearchParams(next, { replace: true });
        }
    }, [searchParams, queryClient, setSearchParams]);

    const subscribeMutation = useMutation({
        mutationFn: ({ scope, billing_cycle }) =>
            sovereign.fixedFee.subscribe({
                scope,
                billing_cycle,
                shop_id: scope === 'shop' ? shopId : undefined,
            }),
        onSuccess: (res) => {
            if (res.checkout_url) window.location.href = res.checkout_url;
        },
        onError: (e) => toast.error(e.message),
    });

    const renewMutation = useMutation({
        mutationFn: (scope) => sovereign.fixedFee.renewMonthly(scope),
        onSuccess: (res) => {
            if (res.checkout_url) window.location.href = res.checkout_url;
        },
        onError: (e) => toast.error(e.message),
    });

    if (isLoading) {
        return (
            <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
        );
    }

    const enrollmentOpen = data?.enrollment_window_open;
    const coverageYear = data?.coverage_year;
    const busy = subscribeMutation.isPending || renewMutation.isPending;

    const pendingBarber = data?.plans?.find((p) => p.scope === 'barber' && p.status === 'pending_payment');
    const pendingShop = data?.plans?.find((p) => p.scope === 'shop' && p.status === 'pending_payment');

    return (
        <Card className="border-violet-200 bg-gradient-to-br from-violet-50/80 to-transparent rounded-3xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg flex-wrap">
                    <Percent className="w-5 h-5 text-violet-700" />
                    Fixed platform fee
                    {data?.commission_waived && (
                        <Badge className="bg-emerald-100 text-emerald-800 ml-2">Commission waived</Badge>
                    )}
                    {enrollmentOpen && !data?.commission_waived && (
                        <Badge className="bg-violet-100 text-violet-800">Enrollment open</Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{data?.config?.description}</p>

                <PlanBlock
                    title="Barber (freelancer)"
                    active={data?.active?.barber}
                    pendingPlan={pendingBarber}
                    quoteMonthly={data?.quotes?.barber?.monthly}
                    quoteAnnual={data?.quotes?.barber?.annual}
                    enrollmentOpen={enrollmentOpen}
                    coverageYear={coverageYear}
                    scope="barber"
                    busy={busy}
                    onSubscribe={(scope, cycle) => subscribeMutation.mutate({ scope, billing_cycle: cycle })}
                    onRenew={(scope) => renewMutation.mutate(scope)}
                />

                {isShopOwner && data?.quotes?.shop && (
                    <PlanBlock
                        title="Shop"
                        active={data?.active?.shop}
                        pendingPlan={pendingShop}
                        quoteMonthly={data?.quotes?.shop?.monthly}
                        quoteAnnual={data?.quotes?.shop?.annual}
                        enrollmentOpen={enrollmentOpen}
                        coverageYear={coverageYear}
                        scope="shop"
                        busy={busy}
                        onSubscribe={(scope, cycle) => subscribeMutation.mutate({ scope, billing_cycle: cycle })}
                        onRenew={(scope) => renewMutation.mutate(scope)}
                    />
                )}

                <PlanHistory plans={data?.plans} />
            </CardContent>
        </Card>
    );
}
