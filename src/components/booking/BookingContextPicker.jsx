import { Button } from '@/components/ui/button';
import { MapPin, Scissors } from 'lucide-react';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

/**
 * In-flow location picker when a barber has multiple booking contexts (shop vs independent).
 */
export default function BookingContextPicker({ barber, memberships = [], onSelect }) {
  const barberName = barber?.name || 'This professional';

  return (
    <div className="max-w-lg mx-auto py-8 md:py-12">
      <div className="text-center mb-8 space-y-2">
        <p className={cn(stb.caption, 'uppercase tracking-widest text-primary')}>Step 1</p>
        <h2 className={cn(stb.uiHeading, 'text-2xl md:text-3xl')}>Where would you like to meet?</h2>
        <p className="text-muted-foreground text-sm md:text-base">
          {barberName} works in more than one setting. Choose where you want this appointment.
        </p>
      </div>

      <div className="grid gap-3">
        {memberships.map((m) => (
          <Button
            key={m.id || m.shop_id}
            type="button"
            variant="outline"
            className="h-auto py-4 justify-start text-left flex gap-3 hover:border-primary hover:bg-primary/5"
            onClick={() => onSelect(m.shop_id || m.shop?.id, 'shop')}
          >
            <div className="bg-muted p-2 rounded-full shrink-0">
              <MapPin className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-foreground">{m.shop?.name || 'Shop location'}</div>
              <div className="text-xs text-muted-foreground truncate">
                {m.shop?.location || 'In-shop appointment'}
              </div>
            </div>
          </Button>
        ))}

        {barber?.is_independent && (
          <Button
            type="button"
            variant="outline"
            className="h-auto py-4 justify-start text-left flex gap-3 hover:border-primary hover:bg-primary/5"
            onClick={() => onSelect(null, 'independent')}
          >
            <div className="bg-primary/10 p-2 rounded-full shrink-0">
              <Scissors className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-foreground">Independent / mobile</div>
              <div className="text-xs text-muted-foreground truncate">
                {barber.independent_location || barber.location || 'Direct booking with the barber'}
              </div>
            </div>
          </Button>
        )}
      </div>
    </div>
  );
}
