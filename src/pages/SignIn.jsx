import { SignIn as ClerkSignIn, ClerkLoaded, ClerkLoading } from '@clerk/react';
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
  clerkSignInLocalization,
} from '@/lib/clerkAppearance';
import { resolvePostAuthDestination } from '@/lib/authReturn';

const REF_STORAGE_KEY = 'stb_referral_code';

function useAuthIntentFromUrl() {
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref');
        if (ref) localStorage.setItem(REF_STORAGE_KEY, ref.trim().toUpperCase());
        const type = params.get('type');
        if (type === 'barber' || type === 'shop') setProviderIntent(type);
    }, []);
}

function getPostSignInUrl() {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect') || params.get('return');
    return resolvePostAuthDestination(redirect);
}

export default function SignIn() {
    useAuthIntentFromUrl();
    const afterSignIn = getPostSignInUrl();

    return (
        <>
            <MetaTags
                title="Sign In"
                description="Access your account to book appointments and manage your style."
            />
            <AuthSplitLayout eyebrow="Premium grooming">
                <ClerkLoading>
                    <PageLoading message="Loading sign in…" />
                </ClerkLoading>
                <ClerkLoaded>
                    <ClerkSignIn
                        routing="path"
                        path="/login"
                        signUpUrl={createPageUrl('ChooseAccountType')}
                        fallbackRedirectUrl={afterSignIn}
                        signUpFallbackRedirectUrl="/SetupGuide"
                        appearance={clerkAuthAppearance}
                        localization={clerkSignInLocalization}
                    />
                </ClerkLoaded>

                <p className={cn(stb.caption, 'text-center mt-10 max-w-xs mx-auto uppercase tracking-widest')}>
                    Encrypted for your protection. 256-bit SSL secure.
                </p>
            </AuthSplitLayout>
        </>
    );
}
