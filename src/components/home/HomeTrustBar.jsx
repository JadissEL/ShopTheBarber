import { Link } from 'react-router-dom';

import { useQuery } from '@tanstack/react-query';

import { createPageUrl } from '@/utils';

import { sovereign } from '@/api/apiClient';

import { ShieldCheck, CreditCard, Gift, Activity } from 'lucide-react';

import { cn } from '@/lib/utils';

import { stb } from '@/lib/stbUi';



const TRUST_ITEMS = [

  {

    icon: CreditCard,

    label: 'Secure payments',

    detail: 'Deposits & protection',

  },

  {

    icon: ShieldCheck,

    label: 'Verified pros',

    detail: 'Real booking rankings',

    href: 'ChampionshipLeaderboard',

  },

  {

    icon: Gift,

    label: 'Gift cards',

    detail: 'Instant grooming gifts',

    href: 'GiftCards',

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

    <section className="border-b border-foreground/10 bg-background">

      <div className="container mx-auto px-4 md:px-6 py-5">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

          {TRUST_ITEMS.map(({ icon: Icon, label, detail, href }) => {

            const inner = (

              <div className={cn(stb.surfaceHover, 'flex items-center gap-3 px-4 py-3.5')}>

                <div className={cn(stb.iconBox, 'h-10 w-10 shrink-0')}>

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

            <div className={cn(stb.surfaceHover, 'flex items-center gap-3 px-4 py-3.5 h-full')}>

              <div className={cn(stb.iconBox, 'h-10 w-10 shrink-0')}>

                <Activity

                  className={`w-4 h-4 ${overall === 'operational' ? 'text-primary' : overall === 'degraded' ? 'text-primary' : 'text-destructive'}`}

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

