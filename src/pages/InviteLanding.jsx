import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { sovereign } from '@/api/apiClient';
import { MetaTags } from '@/components/seo/MetaTags';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Loader2, Users } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { buildChooseAccountTypeUrl } from '@/lib/accountType';
import { stb } from '@/lib/stbUi';

const REF_STORAGE_KEY = 'stb_referral_code';

export default function InviteLanding() {
    const { code } = useParams();
    const [state, setState] = useState({ loading: true, valid: false, referrerName: '', error: '' });

    useEffect(() => {
        const normalized = (code || '').trim().toUpperCase();
        if (!normalized) {
            setState({ loading: false, valid: false, referrerName: '', error: 'Missing invite code' });
            return;
        }
        localStorage.setItem(REF_STORAGE_KEY, normalized);
        sovereign.referral.validateCode(normalized)
            .then((data) => {
                setState({
                    loading: false,
                    valid: true,
                    referrerName: data.referrer_name || 'A friend',
                    error: '',
                });
            })
            .catch((err) => {
                setState({
                    loading: false,
                    valid: false,
                    referrerName: '',
                    error: err.message || 'Invalid invite code',
                });
            });
    }, [code]);

    const signupUrl = buildChooseAccountTypeUrl('client', {
        ref: (code || '').trim().toUpperCase(),
    });

    return (
        <div className={stb.page}>
            <MetaTags
                title="You're invited"
                description="Join ShopTheBarber with a friend referral and unlock welcome rewards on your first booking."
                noindex
            />
            <PageHeader
                label="Referral"
                title={state.valid ? `${state.referrerName} invited you` : 'Invite link'}
                subtitle="Create your free account to book barbers and unlock referral rewards"
                compact
                tier="display"
                variant="dark"
            />
            <PageContent narrow className="flex justify-center">
            <Card className="max-w-md w-full border-none shadow-sm">
                <CardContent className="p-8 text-center space-y-6">
                    {state.loading ? (
                        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                    ) : state.valid ? (
                        <>
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                                <Gift className="w-8 h-8 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold mb-2">{state.referrerName} invited you</h1>
                                <p className="text-muted-foreground">
                                    Create your free account to book barbers and unlock referral rewards on your first visit.
                                </p>
                            </div>
                            <Button asChild size="lg" className="w-full rounded-lg h-12">
                                <Link to={signupUrl}>Accept invite & sign up</Link>
                            </Button>
                            <Button asChild variant="ghost" className="w-full">
                                <Link to="/Explore">Browse barbers first</Link>
                            </Button>
                        </>
                    ) : (
                        <>
                            <Users className="w-12 h-12 text-muted-foreground mx-auto" />
                            <h1 className="text-xl font-bold">Invite link expired</h1>
                            <p className="text-muted-foreground text-sm">{state.error}</p>
                            <Button asChild className="w-full rounded-lg">
                                <Link to={buildChooseAccountTypeUrl('client')}>Sign up without a code</Link>
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
            </PageContent>
        </div>
    );
}
