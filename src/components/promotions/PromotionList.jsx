import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

export default function PromotionList({ barberId }) {
  const { data: promotions = [], isLoading } = useQuery({
    queryKey: ['promotions', barberId],
    queryFn: async () => {
      if (!barberId) return [];
      let list;
      try {
        list = await sovereign.public.getActivePromotions(barberId);
      } catch {
        return [];
      }
      const filtered = Array.isArray(list)
        ? list.map((p) => ({
          ...p,
          data: p,
        }))
        : [];
      
      return filtered;
    },
    staleTime: 1000 * 60 * 5
  });

  if (isLoading || promotions.length === 0) return null;

  const getTypeLabel = (type) => {
    switch(type) {
      case 'barber': return 'Barber Special';
      case 'platform_targeted': return 'Exclusive Deal';
      case 'general': return 'Platform Offer';
      default: return 'Special Offer';
    }
  };

  const getCardStyles = (type) => {
    switch(type) {
      case 'barber': 
        return {
          container: 'bg-vip/90 border-vip',
          text: 'text-vip-foreground',
          subtext: 'text-vip-foreground/80',
          badge: 'bg-white/10 text-white border-white/20',
          code: 'bg-white/10 text-white border-white/20',
          label: 'bg-vip text-vip-foreground border-vip',
          discountBox: 'bg-primary text-primary-foreground'
        };
      case 'platform_targeted': 
        return {
          container: 'bg-black border-white/15', // Dark black
          text: 'text-white',
          subtext: 'text-white/70',
          badge: 'bg-white/10 text-white border-white/20',
          code: 'bg-white/10 text-white border-white/20',
          label: 'bg-[hsl(var(--navy))] text-white border-foreground/25',
          discountBox: 'bg-[hsl(var(--navy))] text-white' // Dark grey for black card
        };
      case 'general': 
        return {
          container: 'bg-muted border-border',
          text: 'text-foreground',
          subtext: 'text-muted-foreground',
          badge: 'bg-primary/10 text-primary border-primary/20',
          code: 'bg-card text-foreground border-foreground/20',
          label: 'bg-secondary text-secondary-foreground border-foreground/20',
          discountBox: 'bg-[hsl(var(--navy))] text-white'
        };
      default: 
        return {
          container: 'bg-card border-border',
          text: 'text-foreground',
          subtext: 'text-muted-foreground',
          badge: 'bg-primary/10 text-primary border-primary/20',
          code: 'bg-muted text-foreground border-foreground/20',
          label: 'bg-muted text-foreground border-border',
          discountBox: 'bg-primary text-white'
        };
    }
  };

  return (
    <div className="mb-8 space-y-4">
      <h3 className={cn(stb.title, "text-lg flex items-center gap-2")}>
        <Sparkles className="w-5 h-5 text-primary" />
        Available Promotions
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {promotions.map((promo, i) => {
          const promoData = promo.data || promo;
          const styles = getCardStyles(promoData.type);
          
          return (
            <div 
              key={promo.id || i} 
              className={cn(
                "relative flex overflow-hidden group transition-all border",
                stb.cardInteractive,
                styles.container
              )}
            >
              {/* Type Label */}
              <div className={cn(
                "absolute top-0 right-0 p-1 px-3 rounded-bl-xl text-[10px] uppercase tracking-wider font-bold border-l border-b",
                styles.label
              )}>
                {getTypeLabel(promoData.type)}
              </div>

              {/* Enhanced Discount Number Box */}
              <div className={cn(
                "w-1/3 flex-shrink-0 relative flex items-center justify-center text-center p-4",
                styles.discountBox
              )}>
                 <div>
                   <span className={cn(stb.metricValue, 'block text-3xl leading-none')}>
                     {(promoData.discount_text || 'Sale').replace(/[^0-9%]/g, '') || "Sale"}
                   </span>
                   {(promoData.discount_text || '').toUpperCase().includes('OFF') && (
                     <span className="block text-[10px] font-bold opacity-80 mt-1">OFF</span>
                   )}
                 </div>
              </div>
              
              <div className="flex-1 p-4 flex flex-col justify-center">
                <h4 className={cn("font-bold text-lg leading-tight mb-1", styles.text)}>{promoData.title || 'Special Offer'}</h4>
                <p className={cn("text-xs mb-3 line-clamp-2", styles.subtext)}>{promoData.description || "Limited time offer"}</p>
                
                <div className="flex items-center gap-2 flex-wrap">
                  {promoData.code && (
                    <div className={cn("text-xs font-mono px-2 py-1 rounded border border-dashed", styles.code)}>
                      {promoData.code}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
