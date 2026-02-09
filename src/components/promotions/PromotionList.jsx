import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Sparkles } from 'lucide-react';
import { cn } from '@/components/utils';

export default function PromotionList({ barberId }) {
  const { data: promotions = [], isLoading } = useQuery({
    queryKey: ['promotions', barberId],
    queryFn: async () => {
      const allPromotions = await sovereign.entities.Promotion.list();
      
      const filtered = allPromotions.filter(p => {
          const promoData = p.data || p;
          
          // General promotions always show
          if (promoData.type === 'general') return true;
          
          // Barber-specific only if it matches
          if (promoData.type === 'barber' && barberId && promoData.barber_id === barberId) return true;
          
          // Platform targeted only if it matches
          if (promoData.type === 'platform_targeted' && barberId && promoData.barber_id === barberId) return true;
          
          return false;
      });
      
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
          container: 'bg-[#2E1065] border-[#4C1D95]', // Dark purple (indigo-950/purple-900 mix)
          text: 'text-white',
          subtext: 'text-purple-200',
          badge: 'bg-white/10 text-white border-white/20',
          code: 'bg-white/10 text-white border-white/20',
          label: 'bg-[#4C1D95] text-white border-[#5B21B6]',
          discountBox: 'bg-[#7C3AED] text-white' // Vivid purple for contrast
        };
      case 'platform_targeted': 
        return {
          container: 'bg-black border-zinc-800', // Dark black
          text: 'text-white',
          subtext: 'text-zinc-400',
          badge: 'bg-white/10 text-white border-white/20',
          code: 'bg-white/10 text-white border-white/20',
          label: 'bg-zinc-800 text-white border-zinc-700',
          discountBox: 'bg-zinc-800 text-white' // Dark grey for black card
        };
      case 'general': 
        return {
          container: 'bg-[#E6D2B5] border-[#D4BFA3]', // Strong creamy beige
          text: 'text-[#4A3B2A]', // Dark brown text for contrast
          subtext: 'text-[#6B5D4D]',
          badge: 'bg-[#4A3B2A]/10 text-[#4A3B2A] border-[#4A3B2A]/20',
          code: 'bg-white/40 text-[#4A3B2A] border-[#4A3B2A]/20',
          label: 'bg-[#D4BFA3] text-[#4A3B2A] border-[#C2AD91]',
          discountBox: 'bg-[#5D4037] text-white' // Dark brown for contrast on beige
        };
      default: 
        return {
          container: 'bg-white border-border',
          text: 'text-foreground',
          subtext: 'text-muted-foreground',
          badge: 'bg-primary/10 text-primary border-primary/20',
          code: 'bg-gray-100 text-foreground border-gray-300',
          label: 'bg-gray-100 text-gray-800 border-gray-200',
          discountBox: 'bg-primary text-white'
        };
    }
  };

  return (
    <div className="mb-8 space-y-4">
      <h3 className="font-bold text-lg flex items-center gap-2">
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
                "relative rounded-2xl flex overflow-hidden group hover:shadow-lg transition-all border",
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
                   <span className="block text-3xl font-black leading-none">
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
