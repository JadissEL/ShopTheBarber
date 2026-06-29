import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Scissors, Store, Network, ArrowRight, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DIRECT_BOOKING_COMMISSION,
  fetchPublicPricingConfig,
  formatMoney,
  mergePricingConfig,
} from '@/lib/gtmPricing';

const PROVIDER_CARDS = [
  {
    icon: Scissors,
    title: 'Solo barbers',
    description: 'Calendar, payouts, client CRM, and marketing tools built for independent pros.',
    href: '/for-barbers',
    cta: 'For barbers',
  },
  {
    icon: Store,
    title: 'Shop owners',
    description: 'Multi-chair scheduling, staff management, inventory, and shop-wide analytics.',
    href: '/for-shops',
    cta: 'For shops',
    highlighted: true,
  },
  {
    icon: Network,
    title: 'Multi-location networks',
    description: 'Centralized reporting and brand standards across every location in your group.',
    href: '/for-networks',
    cta: 'For networks',
  },
];

export default function HomeProviderStrip() {
  const { data: pricingConfig } = useQuery({
    queryKey: ['gtm-pricing-config'],
    queryFn: fetchPublicPricingConfig,
    staleTime: 1000 * 60 * 10,
    retry: false,
  });

  const pricing = mergePricingConfig(pricingConfig);
  const barberFee = formatMoney(pricing.monthly_fee_barber, pricing.currency);

  return (
    <section className="py-24 bg-slate-950 text-white">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-4 py-1.5 text-sm font-medium mb-6">
              <Percent className="w-4 h-4" />
              {DIRECT_BOOKING_COMMISSION}% commission on direct bookings
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Grow your chair or your shop
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Flat monthly plans from {barberFee}/mo, keep more of what you earn. No surprise fees on clients you
              already know.
            </p>
          </div>
          <Link to="/pricing">
            <Button
              variant="outline"
              className="border-white/20 bg-white/5 text-white hover:bg-white/10 rounded-xl h-12 px-6 gap-2"
            >
              View pricing & ROI <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {PROVIDER_CARDS.map((card, i) => (
            <motion.div
              key={card.href}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Card
                className={`h-full border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors ${card.highlighted ? 'ring-1 ring-primary/50' : ''}`}
              >
                <CardContent className="p-8 flex flex-col h-full">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center mb-6">
                    <card.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{card.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed flex-1 mb-6">{card.description}</p>
                  <Link to={card.href}>
                    <Button
                      variant={card.highlighted ? 'default' : 'outline'}
                      className={`w-full rounded-xl ${card.highlighted ? '' : 'border-white/20 bg-transparent text-white hover:bg-white/10'}`}
                    >
                      {card.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-4 justify-center text-sm text-slate-400">
          <Link to="/pilot" className="hover:text-white transition-colors">
            Join a city pilot
          </Link>
          <span className="text-white/20">|</span>
          <Link to="/partners" className="hover:text-white transition-colors">
            Brand & supplier partners
          </Link>
          <span className="text-white/20">|</span>
          <Link to={createPageUrl('SelectProviderType')} className="hover:text-white transition-colors">
            Start onboarding
          </Link>
        </div>
      </div>
    </section>
  );
}
