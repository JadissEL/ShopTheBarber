import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Gift, Share2, Copy, Check, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { MetaTags } from '@/components/seo/MetaTags';
import { toast } from 'sonner';
import { buildInviteUrl } from '@/components/referral/ReferralShareCard';
import { signInUrlWithReturn } from '@/utils';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

const REF_STORAGE_KEY = 'stb_referral_code';

function buildShareUrl(code) {
    return buildInviteUrl(code);
}

export default function Referral() {
    const { user, isAuthenticated } = useAuth();
    const queryClient = useQueryClient();
    const [copied, setCopied] = useState(false);
    const [claimInput, setClaimInput] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref');
        if (ref) localStorage.setItem(REF_STORAGE_KEY, ref.trim().toUpperCase());
    }, []);

    const { data: dashboard, isLoading } = useQuery({
        queryKey: ['referral-me', user?.id],
        queryFn: () => sovereign.referral.getMe(),
        enabled: isAuthenticated && !!user?.id,
    });

    const claimMutation = useMutation({
        mutationFn: (code) => sovereign.referral.claim(code),
        onSuccess: (data) => {
            localStorage.removeItem(REF_STORAGE_KEY);
            queryClient.invalidateQueries({ queryKey: ['referral-me'] });
            toast.success(data.message || 'Referral code applied!');
            setClaimInput('');
        },
        onError: (err) => toast.error(err.message || 'Could not apply code'),
    });

    const referralCode = dashboard?.referral_code ?? '';
    const stats = dashboard?.stats ?? { total_referrals: 0, pending: 0, rewarded: 0, total_earned_estimate: 0 };
    const programs = dashboard?.programs ?? [];
    const isPro = ['barber', 'shop_owner', 'provider'].includes(dashboard?.role ?? user?.role ?? 'client');
    const shareUrl = useMemo(() => (referralCode ? buildShareUrl(referralCode) : ''), [referralCode]);

    const handleCopy = async () => {
        if (!referralCode) return;
        await navigator.clipboard.writeText(referralCode);
        setCopied(true);
        toast.success('Code copied');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCopyLink = async () => {
        if (!shareUrl) return;
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Invite link copied');
    };

    const handleNativeShare = async () => {
        if (!shareUrl || !referralCode) return;
        const text = `Join me on ShopTheBarber, book great barbers and get welcome rewards: ${shareUrl}`;
        if (navigator.share) {
            try {
                await navigator.share({ title: 'ShopTheBarber invite', text, url: shareUrl });
                return;
            } catch {
                // cancelled
            }
        }
        await handleCopyLink();
    };

    if (!isAuthenticated) {
        return (
            <div className="stb-page flex items-center justify-center py-12 px-4">
                <MetaTags title="Referral Program" description="Invite friends and earn rewards" />
                <div className={cn(stb.panel, 'max-w-md w-full p-8 text-center space-y-4')}>
                    <Users className="w-12 h-12 text-primary mx-auto" />
                    <h1 className={cn(stb.uiHeading, 'text-2xl')}>Referral Program</h1>
                    <p className={cn(stb.body, 'text-muted-foreground')}>Sign in to get your personal invite code and track rewards.</p>
                    <Button asChild>
                        <a href={signInUrlWithReturn('/Referral')}>Sign in</a>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="stb-page lg:pb-8 font-sans">
            <MetaTags title="Referral Program" description="Share ShopTheBarber and earn rewards" />
            <PageHeader
                label="Rewards"
                title={isPro ? 'Grow your chair & network' : 'Referral program'}
                subtitle={isPro
                    ? 'Invite clients or fellow pros — rewards pay after they complete their first visit.'
                    : 'Share with friends — you both win when they book their first appointment.'}
                compact
                variant="light"
                tier="app"
            />

            <PageContent narrow>
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className={cn(stb.panel, 'bg-primary text-primary-foreground p-8 text-center')}>
                                <h2 className={cn(stb.uiSubheading, 'text-2xl mb-4')}>Your invite code</h2>
                                <div className="bg-background/20 backdrop-blur-sm rounded-lg p-6 mb-6">
                                    <p className={cn(stb.metricValue, 'text-4xl tracking-wider')}>{referralCode || '-'}</p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <Button onClick={handleCopy} className="bg-card text-primary hover:bg-white/90 font-bold rounded-lg h-12 px-8">
                                        {copied ? <><Check className="w-5 h-5 mr-2" />Copied</> : <><Copy className="w-5 h-5 mr-2" />Copy code</>}
                                    </Button>
                                    <Button onClick={handleCopyLink} variant="outline" className="border-white text-white hover:bg-white/10 rounded-lg h-12">
                                        <Share2 className="w-5 h-5 mr-2" />
                                        Copy invite link
                                    </Button>
                                    <Button onClick={handleNativeShare} variant="outline" className="border-white/60 text-white hover:bg-white/10 rounded-lg h-12">
                                        Share
                                    </Button>
                                </div>
                        </div>

                        {!dashboard?.my_referral && (
                            <div className={cn(stb.panel, 'p-6')}>
                                    <h3 className="text-lg font-bold mb-2">Have a friend&apos;s code?</h3>
                                    <p className="text-sm text-muted-foreground mb-4">Apply it once, welcome bonus unlocks at checkout.</p>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="STB-XXXXXX"
                                            value={claimInput}
                                            onChange={(e) => setClaimInput(e.target.value.toUpperCase())}
                                            className=""
                                        />
                                        <Button
                                            onClick={() => claimMutation.mutate(claimInput.trim())}
                                            disabled={!claimInput.trim() || claimMutation.isPending}
                                            className=" shrink-0"
                                        >
                                            Apply
                                        </Button>
                                    </div>
                            </div>
                        )}

                        {dashboard?.my_referral && (
                            <div className={cn(stb.panel, 'p-6 flex flex-wrap items-center gap-3 border-primary/30 bg-primary/5')}>
                                    <Gift className="w-8 h-8 text-primary" />
                                    <div className="flex-1">
                                        <p className="font-semibold">Your welcome referral</p>
                                        {dashboard.my_referral.referee_promo_code ? (
                                            <p className="text-sm text-muted-foreground">
                                                Use <span className="font-mono font-bold">{dashboard.my_referral.referee_promo_code}</span> on your first booking
                                            </p>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">Complete your qualifying action to unlock rewards</p>
                                        )}
                                    </div>
                                    <Badge variant={dashboard.my_referral.status === 'rewarded' ? 'default' : 'secondary'}>
                                        {dashboard.my_referral.status}
                                    </Badge>
                            </div>
                        )}

                        <div className="grid md:grid-cols-3 gap-6">
                            <div className={cn(stb.panel, 'p-6')}>
                                    <p className={cn(stb.metricValue, 'text-3xl')}>{stats.total_referrals}</p>
                                    <p className={cn(stb.caption, 'text-muted-foreground')}>Total invites</p>
                            </div>
                            <div className={cn(stb.panel, 'p-6')}>
                                    <p className={cn(stb.metricValue, 'text-3xl text-primary')}>{stats.pending}</p>
                                    <p className={cn(stb.caption, 'text-muted-foreground')}>Pending</p>
                            </div>
                            <div className={cn(stb.panel, 'p-6')}>
                                    <p className={cn(stb.metricValue, 'text-3xl text-primary')}>${stats.total_earned_estimate?.toFixed(0) ?? 0}</p>
                                    <p className={cn(stb.caption, 'text-muted-foreground')}>Est. earned</p>
                            </div>
                        </div>

                        <div className={cn(stb.panel, 'p-6')}>
                                <h3 className={cn(stb.uiSubheading, 'text-2xl mb-6')}>How it works</h3>
                                <div className="grid md:grid-cols-2 gap-6">
                                    {programs.map((program, idx) => (
                                        <div key={program.type} className="p-4 rounded-lg bg-muted/50">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                                    {idx + 1}
                                                </span>
                                                <h4 className="font-bold">{program.label}</h4>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-1"><strong>You:</strong> {program.referrer_benefit}</p>
                                            <p className="text-sm text-muted-foreground"><strong>They:</strong> {program.referee_benefit}</p>
                                        </div>
                                    ))}
                                </div>
                        </div>

                        {dashboard?.referrals?.length > 0 && (
                            <div className={cn(stb.panel, 'p-6')}>
                                    <h3 className={cn(stb.uiSubheading, 'text-xl mb-4')}>Recent referrals</h3>
                                    <div className="space-y-2">
                                        {dashboard.referrals.map((r) => (
                                            <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                                                <span className="text-sm capitalize">{r.program_type?.replace(/_/g, ' ')}</span>
                                                <Badge variant={r.status === 'rewarded' ? 'default' : 'outline'}>{r.status}</Badge>
                                            </div>
                                        ))}
                                    </div>
                            </div>
                        )}
                    </div>
                )}
            </PageContent>
        </div>
    );
}
