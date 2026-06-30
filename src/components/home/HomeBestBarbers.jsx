import { useHomepage } from '@/hooks/useHomepage';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BarberCard from '@/components/ui/barber-card';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

export default function HomeBestBarbers() {
  const { data, isLoading, isError, refetch } = useHomepage();
  const barbers = data?.top_barbers ?? [];

  if (isLoading) {
    return (
      <div className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6 animate-pulse">
          <div className="h-8 bg-muted rounded-lg w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-[3/4] bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <p className="text-muted-foreground mb-4">Could not load top barbers.</p>
          <Button variant="outline" onClick={() => refetch()}>Try again</Button>
        </div>
      </div>
    );
  }

  if (barbers.length === 0) return null;

  return (
    <section className="py-20 md:py-24 bg-background relative">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div>
            <p className={cn(stb.label, 'flex items-center gap-1 mb-2')}>
              <Sparkles className="w-3.5 h-3.5" /> Top rated
            </p>
            <h2 className={cn(stb.heading, 'text-3xl md:text-4xl mb-2')}>Barbers clients love</h2>
            <p className={cn(stb.body, 'text-lg max-w-xl')}>
              Hand-picked from real ratings and reviews, book with confidence.
            </p>
          </div>
          <Link to={createPageUrl('Explore')}>
            <Button variant="outline" className="gap-2 group">
              Explore all barbers <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {barbers.slice(0, 6).map((barber) => (
            <BarberCard key={barber.id} barber={barber} />
          ))}
        </div>
      </div>
    </section>
  );
}
