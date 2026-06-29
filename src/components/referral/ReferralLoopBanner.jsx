import { Link } from 'react-router-dom';
import { Gift, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ReferralLoopBanner({ compact = false, className = '' }) {
    if (compact) {
        return (
            <div className={`rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${className}`}>
                <div className="flex items-center gap-3">
                    <Gift className="w-6 h-6 text-primary shrink-0" />
                    <p className="text-sm font-medium">Invite a friend, you both earn when they book their first cut.</p>
                </div>
                <Button asChild size="sm" variant="secondary" className="rounded-xl shrink-0">
                    <Link to="/Referral">Get your link <ArrowRight className="w-4 h-4 ml-1" /></Link>
                </Button>
            </div>
        );
    }

    return (
        <section className={`relative overflow-hidden rounded-3xl bg-charcoal text-white ${className}`}>
            <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-transparent" />
            <div className="relative px-6 sm:px-10 py-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="max-w-xl">
                    <p className="text-primary-foreground/80 text-sm font-semibold tracking-wide uppercase mb-2">Referral rewards</p>
                    <h2 className="text-2xl sm:text-3xl font-display font-bold mb-2">Give a cut, get rewarded</h2>
                    <p className="text-white/80">
                        Share ShopTheBarber with friends. They unlock a welcome offer, you earn credit after their first completed booking.
                    </p>
                </div>
                <Button asChild size="lg" className="rounded-xl bg-card text-charcoal hover:bg-white/90 shrink-0">
                    <Link to="/Referral"><Gift className="w-5 h-5 mr-2" /> Start inviting</Link>
                </Button>
            </div>
        </section>
    );
}
