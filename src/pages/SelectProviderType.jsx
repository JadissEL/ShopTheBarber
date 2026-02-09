import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Store, Scissors } from 'lucide-react';
import { MetaTags } from '@/components/seo/MetaTags';

export default function SelectProviderType() {
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
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                        Join the premium network of grooming professionals. Choose how you want to partner with ShopTheBarber.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mt-12">
                    {/* Barber Option */}
                    <Link to={createPageUrl('SignIn') + '?type=barber'} className="group relative bg-card p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all border border-border hover:border-primary">
                        <div className="absolute top-0 left-0 w-full h-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl" />
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                            <Scissors className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-2">Independent Barber</h3>
                        <p className="text-slate-500 mb-6">
                            For solo barbers who want to manage their own schedule, clients, and payouts directly.
                        </p>
                        <button className="w-full py-2.5 px-4 rounded-lg bg-primary text-primary-foreground hover:opacity-95 font-medium transition-opacity shadow-md">
                            Join as Barber
                        </button>
                    </Link>

                    {/* Shop Option */}
                    <Link to={createPageUrl('SignIn') + '?type=shop'} className="group relative bg-card p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all border border-border hover:border-primary">
                        <div className="absolute top-0 left-0 w-full h-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl" />
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                            <Store className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-2">Barbershop Owner</h3>
                        <p className="text-slate-500 mb-6">
                            For shop owners managing multiple barbers, chairs, and consolidated location analytics.
                        </p>
                        <button className="w-full py-2.5 px-4 rounded-lg bg-primary text-primary-foreground hover:opacity-95 font-medium transition-opacity shadow-md">
                            Register Shop
                        </button>
                    </Link>
                </div>

                <div className="mt-12 text-slate-500 text-sm">
                    Already have an account? <Link to={createPageUrl('SignIn')} className="text-primary font-semibold hover:underline">Log in here</Link>
                </div>
            </div>
        </div>
    );
}
