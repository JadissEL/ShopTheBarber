import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { sovereign } from '@/api/apiClient';
import { useHomepage } from '@/hooks/useHomepage';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import {
  ArrowRight,
  Gift,
  ShieldCheck,
  Trophy,
  Medal,
  Sparkles,
  Lock,
  Star,
} from 'lucide-react';

const PODIUM_ORDER = [2, 1, 3];
const PODIUM_HEIGHT = { 1: 'h-28 md:h-32', 2: 'h-20 md:h-24', 3: 'h-16 md:h-20' };
const PODIUM_RING = {
  1: 'ring-amber-400/60 shadow-amber-500/25',
  2: 'ring-slate-300/50 shadow-slate-400/20',
  3: 'ring-amber-700/40 shadow-amber-800/15',
};

function RankIcon({ rank }) {
  if (rank === 1) return <Trophy className="w-5 h-5 text-amber-400" />;
  if (rank === 2) return <Medal className="w-4 h-4 text-slate-300" />;
  if (rank === 3) return <Medal className="w-4 h-4 text-amber-700" />;
  return null;
}

/** Map homepage top barbers into podium shape when championship data is empty. */
function fallbackPodiumFromHomepage(topBarbers) {
  return (topBarbers ?? []).slice(0, 3).map((b, i) => ({
    id: b.id,
    rank: i + 1,
    barber_id: b.id,
    composite_score: b.rating != null ? Number(b.rating) * 20 : null,
    barber: {
      id: b.id,
      name: b.name,
      image_url: b.image_url,
      city: b.city,
    },
  }));
}

function PodiumSkeleton() {
  return (
    <div className="p-8 md:p-10 min-h-[420px] flex flex-col animate-pulse">
      <div className="h-6 w-32 bg-zinc-800 rounded-full mb-4" />
      <div className="h-10 w-72 max-w-full bg-zinc-800 rounded-lg mb-3" />
      <div className="h-4 w-56 bg-zinc-800/80 rounded mb-auto" />
      <div className="flex items-end justify-center gap-5 mt-8">
        {[20, 32, 16].map((h, i) => (
          <div key={i} className="flex flex-col items-center gap-2 flex-1 max-w-[100px]">
            <div className="w-14 h-14 rounded-full bg-zinc-800" />
            <div className="h-3 w-16 bg-zinc-800 rounded" />
            <div className={`w-full rounded-t-xl bg-zinc-800/60 h-${h}`} style={{ height: `${h * 4}px` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ChampionshipPodium({ topThree, seasonName, isFallback }) {
  const byRank = Object.fromEntries(topThree.map((e) => [e.rank, e]));
  const hasData = topThree.length > 0;

  return (
    <div className="relative flex flex-col h-full min-h-[420px] md:min-h-[480px]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_0%,rgba(251,191,36,0.18),transparent_55%)] pointer-events-none" />
      <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 p-8 md:p-10 flex flex-col h-full">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-200 text-[11px] font-bold uppercase tracking-widest border border-amber-400/20 mb-4">
              <Trophy className="w-3.5 h-3.5" />
              {isFallback ? 'Top rated near you' : 'Live rankings'}
            </span>
            <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight max-w-md">
              Book the season&apos;s champion barbers
            </h3>
            <p className="text-amber-100/70 text-sm md:text-base mt-3 max-w-sm leading-relaxed">
              {isFallback
                ? 'Hand-picked from verified reviews and completed bookings on the platform.'
                : seasonName
                  ? `${seasonName} — scored on reviews, reliability, and real bookings.`
                  : 'Ranked by reviews, reliability, and real completed bookings.'}
            </p>
          </div>
        </div>

        {hasData ? (
          <div className="mt-auto">
            <div className="flex items-end justify-center gap-3 md:gap-5 px-2 mb-6">
              {PODIUM_ORDER.map((rank) => {
                const entry = byRank[rank];
                if (!entry) {
                  return <div key={rank} className={`flex-1 max-w-[100px] ${PODIUM_HEIGHT[rank]}`} aria-hidden />;
                }
                const barber = entry.barber;
                const sizeClass = rank === 1 ? 'w-[72px] h-[72px]' : 'w-14 h-14';
                return (
                  <Link
                    key={entry.id ?? rank}
                    to={createPageUrl(`BarberProfile?id=${barber?.id ?? entry.barber_id}`)}
                    className="flex flex-col items-center flex-1 max-w-[110px] group no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-xl"
                  >
                    <div
                      className={`relative mb-3 rounded-full ring-2 shadow-lg transition-transform group-hover:scale-105 ${PODIUM_RING[rank]} ${sizeClass}`}
                    >
                      {barber?.image_url ? (
                        <OptimizedImage
                          src={barber.image_url}
                          alt={barber.name ?? 'Barber'}
                          width={rank === 1 ? 72 : 56}
                          height={rank === 1 ? 72 : 56}
                          className={`rounded-full overflow-hidden ${sizeClass}`}
                          imgClassName="object-cover w-full h-full"
                        />
                      ) : (
                        <div className={`rounded-full bg-zinc-800 flex items-center justify-center ${sizeClass}`}>
                          <Star className="w-5 h-5 text-zinc-500" />
                        </div>
                      )}
                      <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-zinc-950 border border-amber-500/40 flex items-center justify-center">
                        <RankIcon rank={rank} />
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white text-center truncate w-full group-hover:text-amber-200 transition-colors">
                      {barber?.name ?? 'Barber'}
                    </p>
                    <p className="text-[10px] text-amber-200/60 tabular-nums mt-0.5">
                      {entry.composite_score != null
                        ? isFallback
                          ? `${Number(entry.composite_score / 20).toFixed(1)}★`
                          : `${Number(entry.composite_score).toFixed(0)} pts`
                        : `#${rank}`}
                    </p>
                    <div
                      className={`w-full mt-3 rounded-t-xl bg-gradient-to-t from-amber-500/30 to-amber-400/10 border border-amber-400/20 ${PODIUM_HEIGHT[rank]}`}
                      aria-hidden
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-auto rounded-2xl border border-amber-400/15 bg-white/5 backdrop-blur-sm p-8 text-center">
            <Trophy className="w-10 h-10 text-amber-400/80 mx-auto mb-3" />
            <p className="text-sm text-amber-100/80">Season rankings refresh weekly — explore barbers and claim the podium.</p>
            <Button asChild variant="secondary" className="mt-4 rounded-xl">
              <Link to={createPageUrl('Explore')}>Find barbers</Link>
            </Button>
          </div>
        )}

        <Button
          asChild
          size="lg"
          className="mt-6 w-fit rounded-xl bg-amber-400 text-amber-950 hover:bg-amber-300 font-bold shadow-lg shadow-amber-900/30 gap-2 h-11"
        >
          <Link to={createPageUrl(isFallback ? 'Explore' : 'ChampionshipLeaderboard')}>
            {isFallback ? 'Explore all barbers' : 'View full leaderboard'}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function GiftCardFeature() {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.08 }}
    >
      <Link
        to={createPageUrl('GiftCards')}
        className="relative overflow-hidden rounded-[1.75rem] min-h-[240px] h-full group block no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-rose-600 via-fuchsia-700 to-violet-900" />
        <div className="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        <div className="relative z-10 p-7 md:p-8 flex flex-col justify-between h-full min-h-[240px] transition-transform group-hover:scale-[1.01] group-active:scale-[0.99]">
          <div className="flex justify-between items-start gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm border border-white/20">
              <Gift className="w-3 h-3" />
              Gift cards
            </span>
            <div className="w-14 h-9 rounded-lg bg-gradient-to-br from-white/90 to-white/60 shadow-lg rotate-6 group-hover:rotate-3 transition-transform flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-fuchsia-600" />
            </div>
          </div>

          <div>
            <h3 className="text-xl md:text-2xl font-bold text-white leading-tight mb-2">
              Give the gift of a fresh cut
            </h3>
            <p className="text-sm text-white/80 leading-relaxed mb-5 max-w-xs">
              Digital gift cards they can redeem with any barber on the platform — perfect for birthdays and thank-yous.
            </p>
            <span className="inline-flex items-center gap-2 text-sm font-bold text-white group-hover:text-rose-100 transition-colors">
              Send a gift card
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

function ProtectedBookingFeature() {
  const bullets = [
    { icon: Lock, text: 'Secure deposits & card on file' },
    { icon: ShieldCheck, text: 'Transparent cancellation rules' },
    { icon: Sparkles, text: 'Dispute support when things go wrong' },
  ];

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.12 }}
    >
      <Link
        to={createPageUrl('Explore')}
        className="relative overflow-hidden rounded-[1.75rem] min-h-[240px] h-full border border-emerald-500/20 bg-gradient-to-br from-emerald-950 via-teal-950 to-zinc-950 group block no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgba(16,185,129,0.15),transparent_50%)] pointer-events-none" />
        <div className="absolute -left-10 bottom-0 w-40 h-40 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 p-7 md:p-8 flex flex-col justify-between h-full min-h-[240px] transition-transform group-hover:scale-[1.01] group-active:scale-[0.99]">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-bold uppercase tracking-wider border border-emerald-400/25 w-fit">
            <ShieldCheck className="w-3 h-3" />
            Protected booking
          </span>

          <div>
            <h3 className="text-xl md:text-2xl font-bold text-white leading-tight mb-2 mt-4">
              Book with total confidence
            </h3>
            <p className="text-sm text-emerald-100/70 leading-relaxed mb-4">
              Upfront pricing, protected payments, and fair policies — so you always know where you stand.
            </p>
            <ul className="space-y-2 mb-5">
              {bullets.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-2 text-xs text-emerald-100/90">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-emerald-400" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
            <span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-300 group-hover:text-emerald-200 transition-colors">
              Book a protected slot
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

export default function HomeTrustSpotlight() {
  const { data: board, isLoading: boardLoading } = useQuery({
    queryKey: ['home-championship-preview'],
    queryFn: () => sovereign.trust.getChampionshipLeaderboard({ limit: 3 }),
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });

  const { data: homepage, isLoading: homeLoading } = useHomepage();

  const championshipTop = (board?.leaderboard ?? []).filter((e) => e.rank <= 3).slice(0, 3);
  const isFallback = championshipTop.length === 0;
  const topThree = isFallback ? fallbackPodiumFromHomepage(homepage?.top_barbers) : championshipTop;
  const seasonName = board?.season?.name;
  const isLoading = boardLoading || (isFallback && homeLoading);

  return (
    <section
      id="trust-ecosystem"
      className="py-24 md:py-32 bg-zinc-950 relative overflow-hidden scroll-mt-20"
      aria-labelledby="trust-ecosystem-heading"
    >
      <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 max-w-6xl relative z-10">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-14 md:mb-16"
        >
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-4">Trust ecosystem</p>
          <h2
            id="trust-ecosystem-heading"
            className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-[1.1] mb-4"
          >
            Rankings, gifts &amp; protection — built in
          </h2>
          <p className="text-lg text-zinc-400 leading-relaxed">
            Not just another booking app. Discover top-ranked pros, surprise someone with a gift card, and book knowing your payment is protected.
          </p>
        </motion.header>

        <div className="grid lg:grid-cols-5 gap-5 md:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-3 relative overflow-hidden rounded-[2rem] border border-amber-500/20 bg-gradient-to-br from-zinc-900 via-amber-950/40 to-zinc-950 shadow-2xl shadow-black/40"
          >
            {isLoading ? (
              <PodiumSkeleton />
            ) : (
              <ChampionshipPodium topThree={topThree} seasonName={seasonName} isFallback={isFallback} />
            )}
          </motion.div>

          <div className="lg:col-span-2 flex flex-col gap-5 md:gap-6">
            <GiftCardFeature />
            <ProtectedBookingFeature />
          </div>
        </div>

        <motion.footer
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 md:mt-16 pt-8 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-zinc-500"
        >
          <Link to={createPageUrl('ChampionshipLeaderboard')} className="hover:text-amber-400 transition-colors no-underline inline-flex items-center gap-2">
            <Trophy className="w-4 h-4" /> Full season leaderboard
          </Link>
          <Link to={createPageUrl('GiftCards')} className="hover:text-fuchsia-400 transition-colors no-underline inline-flex items-center gap-2">
            <Gift className="w-4 h-4" /> Buy a gift card
          </Link>
          <Link to={createPageUrl('HelpCenter')} className="hover:text-emerald-400 transition-colors no-underline inline-flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> How protection works
          </Link>
        </motion.footer>
      </div>
    </section>
  );
}
