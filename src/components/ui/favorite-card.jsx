import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import RebookButton from '@/components/booking/RebookButton';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

export default function FavoriteCard({ fav, onRemove }) {
  const rebookBooking = {
    barber_id: fav.barber_id,
    barber_name: fav.barber_name,
  };

  return (
    <div className={cn(stb.surfaceHover, 'overflow-hidden flex flex-col md:flex-row min-h-[240px] group relative transition-all duration-normal ease-out')}>
      <button 
        onClick={() => onRemove(fav.id)}
        className={cn(
          'absolute top-4 right-4 z-10 p-2 bg-card/80 backdrop-blur-md rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors duration-normal ease-out md:left-4 md:right-auto shadow-sm',
          stb.focusRing
        )}
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div className="p-8 flex-1 flex flex-col justify-center order-2 md:order-1">
        <div>
          <h2 className={cn(stb.uiHeading, 'text-xl mb-2')}>{fav.barber_name}</h2>
          <div className={cn(stb.body, 'flex items-center gap-2 mb-8')}>
             <span className="text-primary font-semibold">{fav.rating || 'New'}</span>
             <span>•</span>
             <span>{fav.review_count || 0} reviews</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <RebookButton booking={rebookBooking} label="Book again" className="rounded-lg px-6" />
            <Link to={createPageUrl(`BarberProfile?id=${fav.barber_id}`)}>
              <Button variant="outline" className="rounded-lg px-6 font-bold">
                View profile
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <div className={cn(stb.catalogMedia, 'md:w-[400px] order-1 md:order-2 aspect-auto min-h-[200px]')}>
        <OptimizedImage
          src={fav.barber_image || "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&auto=format&fit=crop"} 
          alt={fav.barber_name} 
          className="w-full h-full object-cover"
          fill
        />
      </div>
    </div>
  );
}
