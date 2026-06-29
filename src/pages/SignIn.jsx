import { Link } from 'react-router-dom';
import { SignIn as ClerkSignIn, ClerkLoaded, ClerkLoading } from '@clerk/react';
import { useEffect } from 'react';
import { MetaTags } from '@/components/seo/MetaTags';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { PageLoading } from '@/components/ui/page-loading';
import { createPageUrl } from '@/utils';
import { setProviderIntent } from '@/lib/bootstrapProvider';
import {
  clerkAuthAppearance,
  clerkSignInLocalization,
} from '@/lib/clerkAppearance';

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
    if (redirect && redirect.startsWith('/')) return redirect;
    return '/SetupGuide';
}

export default function SignIn() {
    useAuthIntentFromUrl();
    const afterSignIn = getPostSignInUrl();

    return (
        <div className="stb-page flex">
            <MetaTags
                title="Sign In"
                description="Access your account to book appointments and manage your style."
            />

            <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden">
                <OptimizedImage
                    src="https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=2000&auto=format&fit=crop"
                    alt="Barber Shop Atmosphere"
                    fill
                    className="object-cover scale-105"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-chart-2/80 to-navy/95 mix-blend-multiply" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-transparent to-primary/20" />
            <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 h-full">
                <Link to={createPageUrl('Home')} className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-semibold no-underline">
                    <ArrowLeft className="w-4 h-4" /> Back to home
                </Link>
                <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-4 py-1.5 text-white/90 text-xs font-bold uppercase tracking-widest mb-6 border border-white/20">
                            Premium grooming
                        </div>
                        <h2 className="text-4xl xl:text-5xl font-extrabold text-white mb-5 leading-[1.08] tracking-tight">
                            Elevate your<br />standard.
                        </h2>
                        <p className="text-lg text-white/80 max-w-sm leading-relaxed">
                            Book elite barbers, manage your chair, and earn rewards — all in one sharp platform.
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-8 bg-background relative overflow-y-auto">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,hsl(var(--primary)/0.06),transparent)] pointer-events-none" aria-hidden />

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md py-12"
                >
                    <ClerkLoading>
                        <PageLoading message="Loading sign in…" />
                    </ClerkLoading>
                    <ClerkLoaded>
                        <ClerkSignIn
                            routing="path"
                            path="/login"
                            signUpUrl={createPageUrl('SignUp')}
                            fallbackRedirectUrl={afterSignIn}
                            signUpFallbackRedirectUrl="/SetupGuide"
                            appearance={clerkAuthAppearance}
                            localization={clerkSignInLocalization}
                        />
                    </ClerkLoaded>

                    <p className="text-[10px] text-center text-muted-foreground mt-10 max-w-xs mx-auto leading-relaxed uppercase tracking-widest opacity-70">
                        Encrypted for your protection. 256-bit SSL secure.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
