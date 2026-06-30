import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Tag, Gift, Scale, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { stb } from '@/lib/stbUi';
import { cn } from '@/lib/utils';

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

function TrustPanel({ icon: Icon, title, subtitle, description, points, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className={cn(stb.surfaceGlassDark, 'p-8')}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className={cn(stb.iconBox, 'w-12 h-12 border-white/20 bg-primary/15 text-primary')}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h3 className={cn(stb.title, 'text-xl text-white')}>{title}</h3>
          <p className="text-sm text-primary font-medium font-sans normal-case">{subtitle}</p>
        </div>
      </div>
      <p className={cn(stb.textOnDarkMuted, 'text-sm mb-6')}>{description}</p>
      <ul className="space-y-3">
        {points.map((point) => (
          <li key={point} className={cn('flex gap-3 text-sm font-sans normal-case', stb.textOnDarkMuted)}>
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export default function HomeComplianceTrust() {
  return (
    <section className={cn(stb.sectionDark, 'border-t border-white/10')}>
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <div className="stb-chip border-primary/30 bg-primary/10 text-primary mb-6 mx-auto w-fit">
            <ShieldCheck className="w-4 h-4" />
            EU consumer & prize-promotion standards
          </div>
          <h2 className={cn(stb.heading, 'text-white text-3xl md:text-4xl mb-4')}>
            Promotions and prize draws you can trust
          </h2>
          <p className={cn(stb.textOnDarkMuted, 'text-lg max-w-2xl mx-auto')}>
            We built ShopTheBarber so savings and rewards follow transparent rules, aligned with EU consumer
            protection for discounts and with prize-promotion principles that keep our weekly draw outside gambling
            regulation.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <TrustPanel
            icon={Tag}
            title="Platform promotions"
            subtitle="Compliant with EU consumer law"
            description="Promo codes are commercial discounts on grooming services, not lotteries. Every code is checked on our servers before checkout so clients see the real price, expiry, and eligibility upfront."
            points={PROMO_POINTS}
          />
          <TrustPanel
            icon={Gift}
            title="Weekly prize draw"
            subtitle="Prize promotion, not gambling"
            description="Our tombola is a free-entry prize promotion with skill-testing questions — structured to stay outside gambling regulation while rewarding loyal clients."
            points={TOMBOLA_POINTS}
            delay={0.08}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={cn(stb.surfaceGlassDark, 'p-8 flex flex-col md:flex-row md:items-center justify-between gap-6')}
        >
          <div className="flex items-start gap-4">
            <div className={cn(stb.iconBox, 'w-12 h-12 shrink-0 border-white/20 bg-primary/15 text-primary')}>
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h3 className={cn(stb.title, 'text-lg text-white mb-1')}>Read the full rules</h3>
              <p className={stb.textOnDarkMuted}>
                Promotion terms, tombola rules, and consumer rights are documented in our legal centre.
              </p>
            </div>
          </div>
          <Button asChild variant="outline" className="border-white/30 text-white hover:bg-white/10 shrink-0">
            <Link to={createPageUrl('LegalDocuments')}>Legal documents</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
