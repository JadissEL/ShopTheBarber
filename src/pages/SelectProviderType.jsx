import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Store, Scissors } from 'lucide-react';
import { MetaTags } from '@/components/seo/MetaTags';
import { setProviderIntent } from '@/lib/bootstrapProvider';

export default function SelectProviderType() {
    const barberSignUp = `${createPageUrl('SignUp')}?type=barber`;
    const shopSignUp = `${createPageUrl('SignUp')}?type=shop`;

    return (
        <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-4 py-16 bg-background">
            <MetaTags
                title="Join as a Professional"
                description="Sign up as a barber or register your barbershop on ShopTheBarber."
                canonicalUrl="/selectprovidertype"
            />

            <div className="max-w-4xl w-full text-center space-y-8">
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">
                        Grow your business with us
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Flat monthly pricing, 0% commission on your direct bookings.{' '}
                        <Link to="/pricing" className="text-primary font-medium hover:underline">
                            See pricing
                        </Link>
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mt-12">
                    <Link
                        to={barberSignUp}
                        onClick={() => setProviderIntent('barber')}
                        className="group relative bg-card p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all border border-border hover:border-primary"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl" />
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                            <Scissors className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-2">Independent Barber</h3>
                        <p className="text-muted-foreground mb-4">
                            For solo barbers who want to manage their own schedule, clients, and payouts directly.
                        </p>
                        <Link to="/for-barbers" className="text-xs text-primary hover:underline block mb-4">
                            Learn more
                        </Link>
                        <span className="inline-flex w-full py-2.5 px-4 rounded-lg bg-primary text-primary-foreground hover:opacity-95 font-medium transition-opacity shadow-md justify-center">
                            Join as Barber
                        </span>
                    </Link>

                    <Link
                        to={shopSignUp}
                        onClick={() => setProviderIntent('shop')}
                        className="group relative bg-card p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all border border-border hover:border-primary"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl" />
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                            <Store className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-2">Barbershop Owner</h3>
                        <p className="text-muted-foreground mb-4">
                            For shop owners managing multiple barbers, chairs, and consolidated location analytics.
                        </p>
                        <Link to="/for-shops" className="text-xs text-primary hover:underline block mb-4">
                            Learn more
                        </Link>
                        <span className="inline-flex w-full py-2.5 px-4 rounded-lg bg-primary text-primary-foreground hover:opacity-95 font-medium transition-opacity shadow-md justify-center">
                            Register Shop
                        </span>
                    </Link>
                </div>

                <div className="mt-12 text-muted-foreground text-sm">
                    Already have an account?{' '}
                    <Link to={createPageUrl('SignIn')} className="text-primary font-semibold hover:underline">
                        Log in here
                    </Link>
                </div>
            </div>
        </div>
    );
}
