import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Search, CalendarCheck, Scissors, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

const STEPS = [
  {
    step: '01',
    icon: Search,
    title: 'Discover & compare',
    description: 'Search by city, service, or mobile barbers. See upfront pricing, ratings, and live offers before you book.',
    link: 'Explore',
  },
  {
    step: '02',
    icon: CalendarCheck,
    title: 'Book with confidence',
    description: 'Pick a time that works. Card on file and payment protection help reduce no-shows, for you and your barber.',
    link: 'BookingFlow',
  },
  {
    step: '03',
    icon: Scissors,
    title: 'Show up & enjoy',
    description: 'In the chair or at your door. Leave a verified review and earn loyalty rewards on every visit.',
    link: 'Loyalty',
  },
];

export default function HomeHowItWorks() {
  return (
    <section id="how-it-works" className={cn(stb.sectionDark, 'border-y border-white/10 stb-marketing-prose')}>
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground border border-white/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-6">
            <Shield className="w-4 h-4" />
            Simple, secure booking
          </div>
          <h2 className={cn(stb.heading, 'text-white mb-4')}>
            How ShopTheBarber works
          </h2>
          <p className="text-lg text-white/70 font-sans normal-case">
            From search to fresh cut in three steps, with transparent pricing and EU-compliant promotions built in.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {STEPS.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative rounded-lg border border-white/15 bg-white/5 p-8 hover:border-primary/40 transition-all stb-surface-hover"
            >
              <div className={cn(stb.display, 'text-5xl text-primary/30 absolute top-6 right-6')}>{item.step}</div>
              <div className="w-12 h-12 rounded-lg bg-primary text-primary-foreground border border-white/20 flex items-center justify-center mb-6">
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className={cn(stb.title, 'text-xl text-white mb-3')}>{item.title}</h3>
              <p className="text-white/65 text-sm leading-relaxed mb-6 font-sans normal-case">{item.description}</p>
              <Link
                to={createPageUrl(item.link)}
                className="text-sm font-semibold text-primary hover:underline no-underline"
              >
                Learn more
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <Link to={createPageUrl('Explore')}>
            <Button size="lg" className={cn(stb.btn, 'px-10 h-12')}>
              Find a barber near you
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
