import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { sovereign } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Copy, Share2, Check, Gift } from 'lucide-react';
import { toast } from 'sonner';

export function buildInviteUrl(code) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/invite/${encodeURIComponent(code)}`;
}

export default function ReferralShareCard({ title, subtitle, className = '' }) {
    const { isAuthenticated } = useAuth();
    const [copied, setCopied] = useState(false);

    const { data: dashboard } = useQuery({
        queryKey: ['referral-me-share'],
        queryFn: () => sovereign.referral.getMe(),
        enabled: isAuthenticated,
    });

    const code = dashboard?.referral_code ?? '';
    const inviteUrl = useMemo(() => (code ? buildInviteUrl(code) : ''), [code]);

    if (!isAuthenticated || !code) {
        return (
            <Card className={`border-primary/20 bg-primary/5 ${className}`}>
                <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <Gift className="w-8 h-8 text-primary shrink-0" />
                        <div>
                            <p className="font-bold">{title || 'Invite friends, earn rewards'}</p>
                            <p className="text-sm text-muted-foreground">{subtitle || 'Sign in to get your personal invite link.'}</p>
                        </div>
                    </div>
                    <Button asChild className=" shrink-0">
                        <Link to="/login">Sign in to share</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const shareText = `Book your next cut on ShopTheBarber, use my invite link for welcome rewards: ${inviteUrl}`;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        toast.success('Invite link copied');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        if (navigator.share && inviteUrl) {
            try {
                await navigator.share({ title: 'ShopTheBarber invite', text: shareText, url: inviteUrl });
                return;
            } catch {
                // user cancelled or unsupported
            }
        }
        if (!inviteUrl) return;
        await navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        toast.success('Invite link copied');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card className={`border-primary/20 bg-primary/5 ${className}`}>
            <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4">
                    <Gift className="w-8 h-8 text-primary shrink-0" />
                    <div>
                        <p className="font-bold">{title || 'Share & earn'}</p>
                        <p className="text-sm text-muted-foreground">
                            {subtitle || 'Friends get a welcome bonus, you earn when they complete their first booking.'}
                        </p>
                    </div>
                </div>
                <p className="font-mono text-sm bg-muted rounded-lg px-3 py-2 mb-4 truncate">{inviteUrl}</p>
                <div className="flex flex-wrap gap-2">
                    <Button onClick={handleShare} className="">
                        <Share2 className="w-4 h-4 mr-2" /> Share invite
                    </Button>
                    <Button onClick={handleCopy} variant="outline" className="">
                        {copied ? <><Check className="w-4 h-4 mr-2" />Copied</> : <><Copy className="w-4 h-4 mr-2" />Copy link</>}
                    </Button>
                    <Button asChild variant="ghost" className="">
                        <Link to="/Referral">Referral dashboard</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
