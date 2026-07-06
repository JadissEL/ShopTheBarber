import { SignUp as ClerkSignUp, ClerkLoaded, ClerkLoading } from '@clerk/react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MetaTags } from '@/components/seo/MetaTags';
import { PageLoading } from '@/components/ui/page-loading';
import AuthSplitLayout from '@/components/auth/AuthSplitLayout';
import { createPageUrl } from '@/utils';
import { isAccountType, accountTypeFromLegacySignupType } from '@/lib/accountType';
import { getPendingAccountType, setPendingAccountType } from '@/lib/signupIntent';
import { SignupWorkspaceBanner } from '@/components/auth/SignupWorkspaceBanner';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';
import {
  clerkAuthAppearance,
  clerkSignUpLocalization,
} from '@/lib/clerkAppearance';
import { resolvePostAuthDestination } from '@/lib/authReturn';

const REF_STORAGE_KEY = 'stb_referral_code';

function getPostAuthUrl() {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect') || params.get('return');
    return resolvePostAuthDestination(redirect, '/SetupGuide');
}

export default function SignUp() {
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref');
        if (ref) localStorage.setItem(REF_STORAGE_KEY, ref.trim().toUpperCase());

        const fromUrl = params.get('accountType');
        if (isAccountType(fromUrl)) {
            setPendingAccountType(fromUrl);
        }

        const legacyType = accountTypeFromLegacySignupType(params.get('type'));
        if (legacyType && !getPendingAccountType()) {
            const search = new URLSearchParams(window.location.search);
            search.delete('type');
            search.set('accountType', legacyType);
            navigate(`${createPageUrl('ChooseAccountType')}?${search.toString()}`, { replace: true });
            return;
        }

        const pending = getPendingAccountType();
        if (!pending) {
            const search = window.location.search || '';
            navigate(`${createPageUrl('ChooseAccountType')}${search}`, { replace: true });
        }
    }, [navigate]);

    const afterSignUp = getPostAuthUrl();
    const pendingType = getPendingAccountType();

    if (!pendingType) {
        return <PageLoading message="Redirecting…" />;
    }

    return (
        <>
            <MetaTags
                title="Create your account"
                description="Create your ShopTheBarber account after choosing your workspace type."
            />
            <AuthSplitLayout eyebrow="Step 2 of 2">
                <div className="space-y-6 mb-6">
                    <SignupWorkspaceBanner accountType={pendingType} />
                </div>
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

                <p className={cn(stb.caption, 'text-center mt-10 max-w-xs mx-auto uppercase tracking-widest')}>
                    Encrypted for your protection. 256-bit SSL secure.
                </p>
            </AuthSplitLayout>
        </>
    );
}
