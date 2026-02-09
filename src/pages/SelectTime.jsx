import { useSearchParams, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MetaTags } from '@/components/seo/MetaTags';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SelectTime() {
  const [searchParams] = useSearchParams();
  const barberId = searchParams.get('barberId');
  const time = searchParams.get('time');

  return (
    <div className="min-h-screen bg-background">
      <MetaTags title="Select Time" description="Choose your appointment time" />
      <div className="max-w-xl mx-auto px-4 py-12">
        <Link to={barberId ? createPageUrl(`BarberProfile?id=${barberId}`) : createPageUrl('Explore')} className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-8">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="text-2xl font-bold mb-2">Select appointment time</h1>
        <p className="text-muted-foreground mb-6">
          {time ? `Quick book at ${time}` : 'Choose a barber and time.'}
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Use the booking flow to pick your date and time with your chosen barber.
        </p>
        <Link to={createPageUrl(barberId ? `BookingFlow?barberId=${barberId}` : 'Explore')}>
          <Button className="w-full">{barberId ? 'Continue to booking' : 'Find a barber'}</Button>
        </Link>
      </div>
    </div>
  );
}
