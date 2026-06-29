import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Scissors, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-auto overflow-hidden border-t border-white/10 bg-[hsl(var(--navy))] text-white">
      <div className="absolute inset-0 stb-mesh-bg opacity-40 pointer-events-none" aria-hidden />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_100%_100%,hsl(var(--primary)/0.15),transparent_50%)] pointer-events-none" aria-hidden />

      <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="grid md:grid-cols-[1.2fr_1fr] gap-10 md:gap-16 items-start mb-12">
          <div>
            <Link
              to={createPageUrl('Home')}
              className="inline-flex items-center gap-2.5 font-bold text-lg tracking-tight text-white hover:opacity-90 w-fit mb-4 no-underline"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-chart-2 text-primary-foreground rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
                <Scissors className="w-5 h-5 transform -rotate-45" aria-hidden />
              </div>
              <span>ShopTheBarber</span>
            </Link>
            <p className="text-white/65 text-sm leading-relaxed max-w-sm mb-6">
              Book elite barbers in minutes. Verified pros, upfront pricing, shop or mobile — one sharp platform.
            </p>
            <Button asChild className="stb-btn-glow h-11 px-6 rounded-xl font-bold">
              <Link to={createPageUrl('Explore')}>
                Book a barber
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>

          <nav className="grid grid-cols-2 gap-8 text-sm" aria-label="Footer">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/45 mb-3">Discover</p>
              <div className="flex flex-col gap-2.5">
                <Link to={createPageUrl('Explore')} className="text-white/75 hover:text-primary transition-colors no-underline">
                  Find barbers
                </Link>
                <Link to={createPageUrl('Marketplace')} className="text-white/75 hover:text-primary transition-colors no-underline">
                  Marketplace
                </Link>
                <Link to={createPageUrl('GiftCards')} className="text-white/75 hover:text-primary transition-colors no-underline">
                  Gift cards
                </Link>
                <Link to={createPageUrl('ChampionshipLeaderboard')} className="text-white/75 hover:text-primary transition-colors no-underline">
                  Rankings
                </Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/45 mb-3">Company</p>
              <div className="flex flex-col gap-2.5">
                <Link to={createPageUrl('About')} className="text-white/75 hover:text-primary transition-colors no-underline">
                  About
                </Link>
                <Link to={createPageUrl('HelpCenter')} className="text-white/75 hover:text-primary transition-colors no-underline">
                  Help Center
                </Link>
                <Link to={createPageUrl('TermsOfService')} className="text-white/75 hover:text-primary transition-colors no-underline">
                  Terms
                </Link>
                <Link to={createPageUrl('Privacy')} className="text-white/75 hover:text-primary transition-colors no-underline">
                  Privacy
                </Link>
              </div>
            </div>
          </nav>
        </div>

        <p className="pt-8 border-t border-white/10 text-xs text-white/45">
          &copy; {currentYear} ShopTheBarber. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
