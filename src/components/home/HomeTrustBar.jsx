import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { sovereign } from '@/api/apiClient';
import { ShieldCheck, CreditCard, Gift, Activity } from 'lucide-react';

const TRUST_ITEMS = [
  {
    icon: CreditCard,
    label: 'Secure payments',
    detail: 'Deposits & protection',
    accent: 'from-chart-2/15 to-primary/10',
  },
  {
    icon: ShieldCheck,
    label: 'Verified pros',
    detail: 'Real booking rankings',
    href: 'ChampionshipLeaderboard',
    accent: 'from-primary/15 to-chart-3/10',
  },
  {
    icon: Gift,
    label: 'Gift cards',
    detail: 'Instant grooming gifts',
    href: 'GiftCards',
    accent: 'from-energy/15 to-chart-4/10',
  },
];

export default function HomeTrustBar() {
  const { data: status } = useQuery({
    queryKey: ['status-public'],
    queryFn: () => sovereign.status.getPublic(),
    staleTime: 1000 * 60 * 2,
    retry: false,
  });

  const overall = status?.overall_status ?? 'operational';
  const statusLabel =
    overall === 'operational'
      ? 'All systems operational'
      : overall === 'degraded'
        ? 'Partial degradation'
        : 'Service disruption';

  return (
    <section className="border-b border-border/60 bg-muted/30">
      <div className="container mx-auto px-4 md:px-6 py-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {TRUST_ITEMS.map(({ icon: Icon, label, detail, href, accent }) => {
            const inner = (
              <div className={`flex items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3.5 shadow-sm hover:shadow-md hover:border-primary/25 transition-all bg-gradient-to-br ${accent}`}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground text-sm leading-tight">{label}</p>
                  <p className="text-xs text-muted-foreground truncate">{detail}</p>
                </div>
              </div>
            );
            return href ? (
              <Link key={label} to={createPageUrl(href)} className="no-underline block">
                {inner}
              </Link>
            ) : (
              <div key={label}>{inner}</div>
            );
          })}
          <Link to={createPageUrl('StatusPage')} className="no-underline block">
            <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3.5 shadow-sm hover:shadow-md hover:border-primary/25 transition-all bg-gradient-to-br from-emerald-500/10 to-primary/5 h-full">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                <Activity
                  className={`w-4 h-4 ${overall === 'operational' ? 'text-emerald-600' : overall === 'degraded' ? 'text-amber-500' : 'text-red-500'}`}
                />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-sm leading-tight">System status</p>
                <p className="text-xs text-muted-foreground truncate">{statusLabel}</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
