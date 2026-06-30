import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Gift, Award, Ticket, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

const REWARDS = [
  {
    icon: Award,
    title: 'Loyalty points',
    description: 'Earn credit on every booking and redeem for discounts.',
    href: 'Loyalty',
  },
  {
    icon: Gift,
    title: 'Refer & earn',
    description: 'Invite friends, you both get rewarded when they book.',
    href: 'Referral',
  },
  {
    icon: Ticket,
    title: 'Gift cards & Tombola',
    description: 'Send grooming gifts or enter our free weekly prize draw.',
    href: 'GiftCards',
  },
];

export default function HomeRewardsStrip() {
  return (
    <section className="py-16 bg-background border-y border-foreground/10">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="text-center mb-10">
          <p className={stb.label}>Perks</p>
          <h2 className={cn(stb.heading, 'text-2xl md:text-3xl mb-2')}>Rewards & gifts</h2>
          <p className="text-muted-foreground">Save more every time you book, or share the love.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {REWARDS.map((item) => (
            <Link
              key={item.href}
              to={createPageUrl(item.href)}
              className={cn(stb.surfaceHover, 'flex items-start gap-4 p-6 no-underline text-inherit group h-full')}
            >
              <div className={cn(stb.iconBox, 'w-12 h-12 shrink-0')}>
                <item.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={cn(stb.uiHeading, 'mb-1 group-hover:text-primary transition-colors')}>
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary mt-3">
                  Explore <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </Link>
          ))}
        </div>
        <p className="text-center mt-8 text-sm text-muted-foreground">
          Weekly Tombola draws follow EU prize-promotion rules —{' '}
          <Link to={createPageUrl('TombolaLive')} className="text-primary font-medium hover:underline">
            see live draw
          </Link>
        </p>
      </div>
    </section>
  );
}
