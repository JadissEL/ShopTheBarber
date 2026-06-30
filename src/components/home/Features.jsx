import { Clock, DollarSign, Home, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { DISCOVERY_ROUTES } from '@/lib/discoveryRoutes';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

const FEATURES = [
  {
    title: 'Book in seconds',
    description: 'Real-time availability, instant confirmation, and reminders so you never miss your slot.',
    icon: Clock,
    link: 'Explore',
  },
  {
    title: 'Price before you pay',
    description: 'See service costs upfront. No awkward surprises at the chair.',
    icon: DollarSign,
    link: 'Explore',
  },
  {
    title: 'Shop or mobile',
    description: 'Visit a studio or book a certified barber to your home, office, or hotel.',
    icon: Home,
    link: DISCOVERY_ROUTES.mobile,
  },
  {
    title: 'Verified & reviewed',
    description: 'Every pro is vetted. Ratings come from real completed bookings.',
    icon: ShieldCheck,
    link: 'Explore',
  },
];

export default function Features() {
  return (
    <section className="py-20 md:py-28 bg-background relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-6xl relative">
        <div className="max-w-2xl mb-12 md:mb-16">
          <p className={stb.label}>Why ShopTheBarber</p>
          <h2 className={cn(stb.heading, 'mb-4')}>
            Grooming that fits{' '}
            <span className="text-primary">your rhythm.</span>
          </h2>
          <p className={cn(stb.body, 'text-lg text-muted-foreground')}>
            Fresha-level speed, Square-level clarity, and a premium feel built for men who show up sharp.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map(({ title, description, icon: Icon, link }) => (
            <Link
              key={title}
              to={createPageUrl(link)}
              className={cn(stb.surfaceHover, 'group block p-6 no-underline')}
            >
              <div className={cn(stb.iconBox, 'mb-5')}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className={cn(stb.title, 'text-lg mb-2 group-hover:text-primary transition-colors')}>
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
