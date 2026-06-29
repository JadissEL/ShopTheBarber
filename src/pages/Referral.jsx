import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Gift, Share2, Copy, Check, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { MetaTags } from '@/components/seo/MetaTags';
import { toast } from 'sonner';
import { buildInviteUrl } from '@/components/referral/ReferralShareCard';
import { signInUrlWithReturn } from '@/utils';

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
            <div className="min-h-screen py-12 bg-background flex items-center justify-center px-4">
                <MetaTags title="Referral Program" description="Invite friends and earn rewards" />
                <Card className="max-w-md w-full">
                    <CardContent className="p-8 text-center space-y-4">
                        <Users className="w-12 h-12 text-primary mx-auto" />
                        <h1 className="text-2xl font-bold">Referral Program</h1>
                        <p className="text-muted-foreground">Sign in to get your personal invite code and track rewards.</p>
                        <Button asChild>
                            <a href={signInUrlWithReturn('/Referral')}>Sign in</a>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12 bg-background-light dark:bg-background-dark font-sans">
            <MetaTags title="Referral Program" description="Share ShopTheBarber and earn rewards" />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                    <Users className="w-16 h-16 text-primary mx-auto mb-4" />
                    <h1 className="text-4xl font-display font-bold text-charcoal dark:text-white mb-4">
                        {isPro ? 'Grow your chair & network' : 'Referral Program'}
                    </h1>
                    <p className="text-xl text-slate dark:text-matte-silver">
                        {isPro
                            ? 'Invite clients or fellow pros, rewards pay after they complete their first visit.'
                            : 'Share with friends, you both win when they book their first appointment.'}
                    </p>
                </motion.div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="space-y-8">
                        <Card className="rounded-2xl border-none shadow-soft bg-gradient-to-br from-primary to-primary/80 text-white">
                            <CardContent className="p-8 text-center">
                                <h2 className="text-2xl font-bold mb-4">Your invite code</h2>
                                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 mb-6">
                                    <p className="text-4xl font-display font-bold tracking-wider">{referralCode || '-'}</p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <Button onClick={handleCopy} className="bg-card text-primary hover:bg-white/90 font-bold rounded-xl h-12 px-8">
                                        {copied ? <><Check className="w-5 h-5 mr-2" />Copied</> : <><Copy className="w-5 h-5 mr-2" />Copy code</>}
                                    </Button>
                                    <Button onClick={handleCopyLink} variant="outline" className="border-white text-white hover:bg-white/10 rounded-xl h-12">
                                        <Share2 className="w-5 h-5 mr-2" />
                                        Copy invite link
                                    </Button>
                                    <Button onClick={handleNativeShare} variant="outline" className="border-white/60 text-white hover:bg-white/10 rounded-xl h-12">
                                        Share
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {!dashboard?.my_referral && (
                            <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                                <CardContent className="p-6">
                                    <h3 className="text-lg font-bold mb-2">Have a friend&apos;s code?</h3>
                                    <p className="text-sm text-muted-foreground mb-4">Apply it once, welcome bonus unlocks at checkout.</p>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="STB-XXXXXX"
                                            value={claimInput}
                                            onChange={(e) => setClaimInput(e.target.value.toUpperCase())}
                                            className="rounded-xl"
                                        />
                                        <Button
                                            onClick={() => claimMutation.mutate(claimInput.trim())}
                                            disabled={!claimInput.trim() || claimMutation.isPending}
                                            className="rounded-xl shrink-0"
                                        >
                                            Apply
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {dashboard?.my_referral && (
                            <Card className="rounded-2xl border-none shadow-soft bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                                <CardContent className="p-6 flex flex-wrap items-center gap-3">
                                    <Gift className="w-8 h-8 text-emerald-600" />
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
                                </CardContent>
                            </Card>
                        )}

                        <div className="grid md:grid-cols-3 gap-6">
                            <Card className="rounded-2xl border-none shadow-soft">
                                <CardContent className="p-6">
                                    <p className="text-3xl font-bold">{stats.total_referrals}</p>
                                    <p className="text-muted-foreground">Total invites</p>
                                </CardContent>
                            </Card>
                            <Card className="rounded-2xl border-none shadow-soft">
                                <CardContent className="p-6">
                                    <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
                                    <p className="text-muted-foreground">Pending</p>
                                </CardContent>
                            </Card>
                            <Card className="rounded-2xl border-none shadow-soft">
                                <CardContent className="p-6">
                                    <p className="text-3xl font-bold text-emerald-600">${stats.total_earned_estimate?.toFixed(0) ?? 0}</p>
                                    <p className="text-muted-foreground">Est. earned</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="rounded-2xl border-none shadow-soft">
                            <CardContent className="p-6">
                                <h3 className="text-2xl font-bold mb-6">How it works</h3>
                                <div className="grid md:grid-cols-2 gap-6">
                                    {programs.map((program, idx) => (
                                        <div key={program.type} className="p-4 rounded-xl bg-muted/50">
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
                            </CardContent>
                        </Card>

                        {dashboard?.referrals?.length > 0 && (
                            <Card className="rounded-2xl border-none shadow-soft">
                                <CardContent className="p-6">
                                    <h3 className="text-xl font-bold mb-4">Recent referrals</h3>
                                    <div className="space-y-2">
                                        {dashboard.referrals.map((r) => (
                                            <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                                                <span className="text-sm capitalize">{r.program_type?.replace(/_/g, ' ')}</span>
                                                <Badge variant={r.status === 'rewarded' ? 'default' : 'outline'}>{r.status}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
