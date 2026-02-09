import { MetaTags } from '@/components/seo/MetaTags';
import { SchemaMarkup } from '@/components/seo/SchemaMarkup';
import Hero from '../components/home/Hero';
import Features from '../components/home/Features';
import FeaturedBarbers from '../components/home/FeaturedBarbers';
import Services from '../components/home/Services';
import Testimonials from '../components/home/Testimonials';
import CTA from '../components/home/CTA';

export default function Home() {
  return (
    <div className="flex flex-col">
      <MetaTags
        title="Home"
        description="Discover and book the best barbers in your area. Professional grooming services, reviews, and easy scheduling."
      />
      <SchemaMarkup
        type="WebSite"
        data={{
          name: "ShopTheBarber",
          url: window.location.origin,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${window.location.origin}/Explore?q={search_term_string}`,
            'query-input': 'required name=search_term_string'
          }
        }}
      />
      <Hero />
      <Features />
      <FeaturedBarbers />
      <Services />
      <Testimonials />
      <CTA />

      {/* About & Contact Section */}
      <section className="bg-card py-20 border-t border-border">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">About ShopTheBarber</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Connecting world-class grooming professionals with clients who value quality, convenience, and style.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-10 mb-16">
            <div className="text-center">
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Seamless Booking</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Book appointments with real-time availability and instant confirmation.</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Vetted Talent</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">A curated network of master barbers and stylists.</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Guaranteed Quality</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Secure payments, verified reviews, and satisfaction commitment.</p>
            </div>
          </div>

          <div className="text-center text-muted-foreground text-sm border-t border-border pt-8">
            <p>© {new Date().getFullYear()} ShopTheBarber.</p>
          </div>
        </div>
      </section>
    </div>
  );
}