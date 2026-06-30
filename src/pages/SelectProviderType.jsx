import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Store, Scissors } from 'lucide-react';
import { MetaTags } from '@/components/seo/MetaTags';
import AuthSplitLayout from '@/components/auth/AuthSplitLayout';
import { setProviderIntent } from '@/lib/bootstrapProvider';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

export default function SelectProviderType() {
    const barberSignUp = `${createPageUrl('SignUp')}?type=barber`;
    const shopSignUp = `${createPageUrl('SignUp')}?type=shop`;

    return (
        <>
            <MetaTags
                title="Join as a Professional"
                description="Sign up as a barber or register your barbershop on ShopTheBarber."
                canonicalUrl="/selectprovidertype"
            />
            <AuthSplitLayout
                eyebrow="For professionals"
                heroTitle={
                    <>
                        Grow your
                        <br />
                        business.
                    </>
                }
                heroDescription="Flat monthly pricing, 0% commission on your direct bookings."
            >
                <div className="space-y-8">
                    <div className="space-y-3 text-center lg:text-left">
                        <h1 className={cn(stb.uiHeading, 'text-3xl md:text-4xl')}>
                            Choose your path
                        </h1>
                        <p className={cn(stb.body, 'text-base')}>
                            Flat monthly pricing, 0% commission on your direct bookings.{' '}
                            <Link to="/pricing" className="text-primary font-medium hover:underline">
                                See pricing
                            </Link>
                        </p>
                    </div>

                    <div className="grid gap-4">
                        <Link
                            to={barberSignUp}
                            onClick={() => setProviderIntent('barber')}
                            className={cn(stb.surfaceHover, 'group relative p-6 text-left no-underline text-inherit block')}
                        >
                            <div className="flex items-start gap-4">
                                <div className={cn(stb.iconBox, 'w-12 h-12 shrink-0 group-hover:bg-primary/15 transition-colors')}>
                                    <Scissors className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className={cn(stb.uiHeading, 'text-lg mb-1')}>Independent barber</h3>
                                    <p className={stb.body}>
                                        For solo barbers who want to manage their own schedule, clients, and payouts directly.
                                    </p>
                                    <Link
                                        to="/for-barbers"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-xs text-primary hover:underline inline-block mt-2 relative z-10"
                                    >
                                        Learn more
                                    </Link>
                                </div>
                            </div>
                            <span className="stb-card-cta-bar block rounded-b-lg -mx-6 -mb-6 mt-4">Join as barber</span>
                        </Link>

                        <Link
                            to={shopSignUp}
                            onClick={() => setProviderIntent('shop')}
                            className={cn(stb.surfaceHover, 'group relative p-6 text-left no-underline text-inherit block')}
                        >
                            <div className="flex items-start gap-4">
                                <div className={cn(stb.iconBox, 'w-12 h-12 shrink-0 group-hover:bg-primary/15 transition-colors')}>
                                    <Store className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className={cn(stb.uiHeading, 'text-lg mb-1')}>Barbershop owner</h3>
                                    <p className={stb.body}>
                                        For shop owners managing multiple barbers, chairs, and consolidated location analytics.
                                    </p>
                                    <Link
                                        to="/for-shops"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-xs text-primary hover:underline inline-block mt-2 relative z-10"
                                    >
                                        Learn more
                                    </Link>
                                </div>
                            </div>
                            <span className="stb-card-cta-bar block rounded-b-lg -mx-6 -mb-6 mt-4">Register shop</span>
                        </Link>
                    </div>

                    <p className={cn(stb.body, 'text-center lg:text-left')}>
                        Already have an account?{' '}
                        <Link to={createPageUrl('SignIn')} className="text-primary font-semibold hover:underline">
                            Log in here
                        </Link>
                    </p>
                </div>
            </AuthSplitLayout>
        </>
    );
}
