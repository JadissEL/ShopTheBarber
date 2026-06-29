import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Search, CalendarCheck, Scissors, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <section id="how-it-works" className="py-24 bg-card border-y border-border">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary border border-primary/20 px-4 py-1.5 text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            Simple, secure booking
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight mb-4">
            How ShopTheBarber works
          </h2>
          <p className="text-lg text-muted-foreground">
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
              className="relative rounded-3xl border border-border bg-card p-8 hover:border-primary/30 hover:shadow-lg transition-all"
            >
              <div className="text-5xl font-black text-primary/15 absolute top-6 right-6">{item.step}</div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">{item.description}</p>
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
            <Button size="lg" className="rounded-xl px-10 h-12 font-semibold">
              Find a barber near you
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
