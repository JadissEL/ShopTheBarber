import { Clock, DollarSign, Home, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { DISCOVERY_ROUTES } from '@/lib/discoveryRoutes';

const FEATURES = [
  {
    title: 'Book in seconds',
    description: 'Real-time availability, instant confirmation, and reminders so you never miss your slot.',
    icon: Clock,
    link: 'Explore',
    iconBg: 'bg-primary/12 text-primary',
  },
  {
    title: 'Price before you pay',
    description: 'See service costs upfront. No awkward surprises at the chair.',
    icon: DollarSign,
    link: 'Explore',
    iconBg: 'bg-chart-2/12 text-chart-2',
  },
  {
    title: 'Shop or mobile',
    description: 'Visit a studio or book a certified barber to your home, office, or hotel.',
    icon: Home,
    link: DISCOVERY_ROUTES.mobile,
    iconBg: 'bg-chart-4/15 text-chart-4',
  },
  {
    title: 'Verified & reviewed',
    description: 'Every pro is vetted. Ratings come from real completed bookings.',
    icon: ShieldCheck,
    link: 'Explore',
    iconBg: 'bg-energy/12 text-energy',
  },
];

export default function Features() {
  return (
    <section className="py-20 md:py-28 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_100%_50%,hsl(var(--chart-2)/0.06),transparent)] pointer-events-none" aria-hidden />
      <div className="container mx-auto px-6 max-w-6xl relative">
        <div className="max-w-2xl mb-12 md:mb-16">
          <p className="stb-section-label">Why ShopTheBarber</p>
          <h2 className="stb-heading-display mb-4">
            Grooming that fits{' '}
            <span className="stb-text-gradient">your rhythm.</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Fresha-level speed, Square-level clarity, and a premium feel built for men who show up sharp.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map(({ title, description, icon: Icon, link, iconBg }) => (
            <Link
              key={title}
              to={createPageUrl(link)}
              className="group block p-6 rounded-2xl bg-card border border-border/80 stb-card-lift no-underline"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
