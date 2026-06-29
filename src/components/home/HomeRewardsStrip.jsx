import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Gift, Award, Ticket, ArrowRight } from 'lucide-react';

const REWARDS = [
  {
    icon: Award,
    title: 'Loyalty points',
    description: 'Earn credit on every booking and redeem for discounts.',
    href: 'Loyalty',
    color: 'text-amber-600 bg-amber-500/10',
  },
  {
    icon: Gift,
    title: 'Refer & earn',
    description: 'Invite friends, you both get rewarded when they book.',
    href: 'Referral',
    color: 'text-primary bg-primary/10',
  },
  {
    icon: Ticket,
    title: 'Gift cards & Tombola',
    description: 'Send grooming gifts or enter our free weekly prize draw.',
    href: 'GiftCards',
    color: 'text-emerald-600 bg-emerald-500/10',
  },
];

export default function HomeRewardsStrip() {
  return (
    <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-y border-border">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-2">
            Rewards & gifts
          </h2>
          <p className="text-muted-foreground">Save more every time you book, or share the love.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {REWARDS.map((item, i) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              <Link
                to={createPageUrl(item.href)}
                className="flex items-start gap-4 p-6 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all no-underline text-inherit group h-full"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary mt-3">
                    Explore <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
        <p className="text-center mt-8 text-sm text-muted-foreground">
          Weekly Tombola draws follow EU prize-promotion rules , {' '}
          <Link to={createPageUrl('TombolaLive')} className="text-primary font-medium hover:underline">
            see live draw
          </Link>
        </p>
      </div>
    </section>
  );
}
