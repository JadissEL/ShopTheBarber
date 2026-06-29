import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Tag, Gift, Scale, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PROMO_POINTS = [
  'Discount codes only, not games of chance or betting',
  'Server-validated at checkout with clear expiry and usage limits',
  'Platform caps (typically 30% or €75) protect against misleading deep discounts',
  'Per-user redemption limits and audience targeting enforced in code',
];

const TOMBOLA_POINTS = [
  'Free prize promotion, ShopTheBarber is not a gambling operator',
  'No purchase necessary: free alternate entry always available',
  'Winners must answer a skill-testing question before claiming a prize',
  '18+ only; cryptographically auditable weekly draw (seed + hash on record)',
];

export default function HomeComplianceTrust() {
  return (
    <section className="py-24 bg-slate-950 text-white border-t border-white/10">
      <div className="container mx-auto px-6 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-4 py-1.5 text-sm font-medium mb-6">
            <ShieldCheck className="w-4 h-4" />
            EU consumer & prize-promotion standards
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Promotions and prize draws you can trust
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            We built ShopTheBarber so savings and rewards follow transparent rules, aligned with EU consumer
            protection for discounts and with prize-promotion principles that keep our weekly draw outside gambling
            regulation.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-white/10 bg-white/5 p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-300 flex items-center justify-center">
                <Tag className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Platform promotions</h3>
                <p className="text-sm text-emerald-300 font-medium">Compliant with EU consumer law</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Promo codes are commercial discounts on grooming services, not lotteries. Every code is checked on our
              servers before checkout so clients see the real price, expiry, and eligibility upfront.
            </p>
            <ul className="space-y-3">
              {PROMO_POINTS.map((point) => (
                <li key={point} className="flex gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="rounded-3xl border border-white/10 bg-white/5 p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/15 text-violet-300 flex items-center justify-center">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Weekly Trip Tombola</h3>
                <p className="text-sm text-emerald-300 font-medium">Prize promotion, not gambling</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Under EU law, gambling licences apply to games of chance for money. Our tombola is a free prize draw with
              a no-purchase entry route and a skill test for winners, so it is structured as a marketing prize
              promotion, not a casino or lottery product.
            </p>
            <ul className="space-y-3">
              {TOMBOLA_POINTS.map((point) => (
                <li key={point} className="flex gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <Scale className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-400 leading-relaxed">
              Personal data for bookings, promos, and prize draws is handled under our{' '}
              <Link to={createPageUrl('Privacy')} className="text-white underline underline-offset-2 hover:text-emerald-300">
                Privacy Policy
              </Link>{' '}
              (GDPR). Full terms for clients and providers are in our{' '}
              <Link to={createPageUrl('TermsOfService')} className="text-white underline underline-offset-2 hover:text-emerald-300">
                Terms of Service
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button asChild variant="outline" size="sm" className="rounded-full border-white/20 bg-transparent text-white hover:bg-white/10">
              <Link to={createPageUrl('TombolaLive')}>Tombola rules & live draw</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-full border-white/20 bg-transparent text-white hover:bg-white/10">
              <Link to={createPageUrl('HelpCenter')}>Help Center</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
