import { SignUp as ClerkSignUp, ClerkLoaded, ClerkLoading } from '@clerk/react';
import { useEffect } from 'react';
import { MetaTags } from '@/components/seo/MetaTags';
import { PageLoading } from '@/components/ui/page-loading';
import AuthSplitLayout from '@/components/auth/AuthSplitLayout';
import { createPageUrl } from '@/utils';
import { setProviderIntent } from '@/lib/bootstrapProvider';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';
import {
  clerkAuthAppearance,
  clerkSignUpLocalization,
} from '@/lib/clerkAppearance';

const REF_STORAGE_KEY = 'stb_referral_code';

function getPostAuthUrl() {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect') || params.get('return');
    if (redirect && redirect.startsWith('/')) return redirect;
    return '/SetupGuide';
}

export default function SignUp() {
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref');
        if (ref) localStorage.setItem(REF_STORAGE_KEY, ref.trim().toUpperCase());
        const type = params.get('type');
        if (type === 'barber' || type === 'shop') setProviderIntent(type);
    }, []);

    const afterSignUp = getPostAuthUrl();

    return (
        <>
            <MetaTags
                title="Join the Platform"
                description="Create an account to book appointments and manage your style."
            />
            <AuthSplitLayout eyebrow="Join the platform">
                <ClerkLoading>
                    <PageLoading message="Loading sign up…" />
                </ClerkLoading>
                <ClerkLoaded>
                    <ClerkSignUp
                        routing="path"
                        path="/register"
                        signInUrl={createPageUrl('SignIn')}
                        fallbackRedirectUrl={afterSignUp}
                        signInFallbackRedirectUrl="/login"
                        appearance={clerkAuthAppearance}
                        localization={clerkSignUpLocalization}
                    />
                </ClerkLoaded>

                <p className={cn(stb.caption, 'text-center mt-10 max-w-xs mx-auto uppercase tracking-widest opacity-70')}>
                    Encrypted for your protection. 256-bit SSL secure.
                </p>
            </AuthSplitLayout>
        </>
    );
}
