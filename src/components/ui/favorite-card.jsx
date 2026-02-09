import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';

export default function FavoriteCard({ fav, onRemove }) {
  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden flex flex-col md:flex-row min-h-[240px] group relative shadow-sm hover:shadow-md transition-all">
      <button 
        onClick={() => onRemove(fav.id)}
        className="absolute top-4 right-4 z-10 p-2 bg-white/80 backdrop-blur-md rounded-full text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors md:left-4 md:right-auto shadow-sm"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div className="p-8 flex-1 flex flex-col justify-center order-2 md:order-1">
        <div>
          <h2 className="text-xl font-bold text-foreground mb-2">{fav.barber_name}</h2>
          <div className="flex items-center gap-2 mb-8 text-muted-foreground text-sm">
             <span className="text-primary font-semibold">{fav.rating || 'New'}</span>
             <span>•</span>
             <span>{fav.review_count || 0} reviews</span>
          </div>
          <Link to={createPageUrl(`BarberProfile?id=${fav.barber_id}`)}>
              <Button className="bg-primary text-white hover:bg-primary/90 border-none rounded-lg px-6 font-bold shadow-sm">
                Book Again
              </Button>
          </Link>
        </div>
      </div>
      <div className="md:w-[400px] bg-gray-100 relative order-1 md:order-2">
        <OptimizedImage
          src={fav.barber_image || "https://images.unsplash.com/photo-1503951914290-93d32b06769c?w=800&auto=format&fit=crop"} 
          alt={fav.barber_name} 
          className="w-full h-full object-cover"
          fill
        />
      </div>
    </div>
  );
}