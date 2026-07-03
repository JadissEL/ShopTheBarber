import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Scissors, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { stb } from '@/lib/stbUi';
import { cn } from '@/lib/utils';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-auto overflow-hidden border-t border-white/10 bg-[hsl(var(--navy))] text-white font-sans">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <p className="stb-watermark bottom-0 right-4 translate-y-1/4">SHOP THE BARBER</p>
      </div>

      <div className={cn(stb.container, 'relative py-12 md:py-16')}>
        <div className="grid md:grid-cols-[1.2fr_1fr] gap-10 md:gap-16 items-start mb-12">
          <div>
            <Link
              to={createPageUrl('Home')}
              className="inline-flex items-center gap-2.5 font-display uppercase text-xl tracking-wider text-white hover:opacity-90 w-fit mb-4 no-underline"
              aria-label="ShopTheBarber home"
            >
              <div className="w-10 h-10 bg-primary text-primary-foreground rounded-lg border border-white/20 flex items-center justify-center">
                <Scissors className="w-5 h-5 transform -rotate-45" aria-hidden />
              </div>
              <span>ShopTheBarber</span>
            </Link>
            <p className="text-white/65 text-sm leading-relaxed max-w-sm mb-6 font-sans normal-case">
              Book elite barbers in minutes. Verified pros, upfront pricing, shop or mobile — one sharp platform.
            </p>
            <Button asChild className={cn(stb.btn, 'h-11 px-6')}>
              <Link to={createPageUrl('Explore')}>
                Book a barber
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>

          <nav className="grid grid-cols-2 gap-8 text-sm font-sans" aria-label="Footer">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3 text-white/70 font-sans">Discover</p>
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
              <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3 text-white/70 font-sans">Company</p>
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

        <p className="pt-8 border-t border-white/10 text-xs text-white/45 font-sans">
          &copy; {currentYear} ShopTheBarber. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
