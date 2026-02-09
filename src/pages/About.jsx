import { MetaTags } from '@/components/seo/MetaTags';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MetaTags
        title="About Us"
        description="ShopTheBarber connects world-class grooming professionals with clients who value quality, convenience, and style. Learn about our mission and how we're redefining barbershop booking."
      />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link to={createPageUrl('Home')} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">About ShopTheBarber</h1>
          <p className="text-xl text-slate-600 font-medium">
            Connecting world-class grooming professionals with clients who value quality, convenience, and style.
          </p>
        </div>

        <section className="space-y-8 mb-12">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Our Mission</h2>
            <p className="text-slate-600 leading-relaxed">
              ShopTheBarber makes it easy to discover and book the best barbers and grooming professionals in your area. We believe every client deserves a premium experience—real-time availability, instant confirmation, verified reviews, and secure payments—so you can focus on looking your best.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Seamless Booking</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Book elite appointments in seconds with real-time availability and instant confirmation.</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Vetted Talent</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Access a curated network of master barbers and stylists who are top of their game.</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Guaranteed Quality</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Secure payments, verified reviews, and a commitment to satisfaction on every cut.</p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-3">For Professionals</h2>
            <p className="text-slate-600 leading-relaxed">
              Barbers and shop owners use ShopTheBarber to manage bookings, grow their client base, and get paid on time. We handle scheduling, payments, and promotions so you can focus on your craft.
            </p>
          </div>
        </section>

        <div className="border-t border-slate-200 pt-8 flex flex-wrap gap-4">
          <Link to={createPageUrl('Explore')} className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-6 py-3 font-semibold hover:opacity-95 transition-colors">
            Find a Barber
          </Link>
          <Link to={createPageUrl('TermsOfService')} className="inline-flex items-center text-muted-foreground hover:text-foreground font-medium">
            Terms of Service
          </Link>
          <Link to={createPageUrl('Privacy')} className="inline-flex items-center text-muted-foreground hover:text-foreground font-medium">
            Privacy Policy
          </Link>
        </div>

        <p className="text-slate-400 text-sm mt-12">© {new Date().getFullYear()} ShopTheBarber. Handcrafted for the Modern Gentleman.</p>
      </div>
    </div>
  );
}
