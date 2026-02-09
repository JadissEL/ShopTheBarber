import { useState, useMemo } from 'react';
import { Scissors, Plus, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/components/utils';
import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';

export default function ServiceSelection({ 
    services = [], 
    selectedServiceIds = [], 
    onToggleService,
    barberId,
    onBookNow
}) {
    const [activeCategory, setActiveCategory] = useState('All');

    // Fetch Staff Configs for Overrides
    const { data: staffConfig } = useQuery({
        queryKey: ['staffConfig', barberId],
        queryFn: async () => {
            if (!barberId) return null;
            // Context-aware fetch
            const urlParams = new URLSearchParams(window.location.search);
            const shopId = urlParams.get('shopId');
            
            let member = null;
            if (shopId) {
                const members = await sovereign.entities.ShopMember.filter({ barber_id: barberId, shop_id: shopId });
                member = members[0];
            } else {
                // Fallback (legacy/hybrid risk)
                const members = await sovereign.entities.ShopMember.filter({ barber_id: barberId });
                member = members[0];
            }
            
            if (!member) return null;
            const configs = await sovereign.entities.StaffServiceConfig.filter({ shop_member_id: member.id });
            return configs;
        },
        enabled: !!barberId
    });

    const getServiceDetails = (service) => {
        const data = service.data || service;
        const baseMinutes = data.duration_min || parseInt((data.duration_text || '0').match(/\d+/)?.[0] || 0);
        const basePrice = data.price || parseFloat((data.price_text || '0').replace(/[^0-9.]/g, '') || 0);

        if (staffConfig && staffConfig.length > 0) {
            const config = staffConfig.find(c => c.service_id === service.id);
            if (config) {
                return {
                    ...data,
                    duration_text: `${config.custom_duration || baseMinutes}m`,
                    price_text: `$${(config.custom_price || basePrice).toFixed(2)}`,
                    _duration: config.custom_duration || baseMinutes,
                    _price: config.custom_price || basePrice
                };
            }
        }
        return { 
            ...data, 
            duration_text: `${baseMinutes}m`,
            price_text: `$${basePrice.toFixed(2)}`,
            _duration: baseMinutes, 
            _price: basePrice 
        };
    };

    // Extract categories
    const categories = useMemo(() => {
        const cats = new Set(services.map(s => {
            const data = s.data || s;
            return data.category || 'Other';
        }));
        return ['All', ...Array.from(cats)];
    }, [services]);

    // Filter services
    const filteredServices = useMemo(() => {
        if (activeCategory === 'All') return services;
        return services.filter(s => {
            const data = s.data || s;
            return (data.category || 'Other') === activeCategory;
        });
    }, [services, activeCategory]);

    const totalAmount = selectedServiceIds.reduce((acc, id) => {
        const s = services.find(srv => srv.id === id);
        if (!s) return acc;
        return acc + getServiceDetails(s)._price;
    }, 0);

    const totalDuration = selectedServiceIds.reduce((acc, id) => {
         const s = services.find(srv => srv.id === id);
         if (!s) return acc;
         return acc + getServiceDetails(s)._duration;
    }, 0);

    return (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Main Content: Filters + Grid */}
            <div className="flex-1 w-full">
                
                {/* Category Filters */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={cn(
                                "px-5 py-2.5 rounded-full text-sm font-bold transition-all border border-transparent",
                                activeCategory === cat
                                    ? "bg-black text-white shadow-lg"
                                    : "bg-white text-gray-600 hover:bg-gray-100 border-gray-200"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Service Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredServices.map(service => {
                        const serviceData = getServiceDetails(service); // Use overridden details
                        const isSelected = selectedServiceIds.includes(service.id);
                        
                        return (
                            <div 
                                key={service.id}
                                onClick={() => onToggleService(service)}
                                className={cn(
                                    "relative rounded-2xl p-5 border transition-all cursor-pointer h-full flex flex-col justify-between group",
                                    isSelected 
                                        ? "bg-black text-white border-black shadow-xl" 
                                        : "bg-white border-border hover:border-black/30 hover:shadow-md"
                                )}
                            >
                                <div className="mb-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-base leading-tight pr-2">{serviceData.name}</h4>
                                        {isSelected ? (
                                            <div className="bg-white text-black rounded-full p-1 w-6 h-6 flex items-center justify-center shrink-0">
                                                <Check className="w-3.5 h-3.5 stroke-[4]" />
                                            </div>
                                        ) : (
                                            <div className="bg-gray-100 text-gray-400 group-hover:bg-black group-hover:text-white rounded-full p-1 w-6 h-6 flex items-center justify-center shrink-0 transition-colors">
                                                <Plus className="w-3.5 h-3.5" />
                                            </div>
                                        )}
                                    </div>
                                    <p className={cn("text-xs line-clamp-2", isSelected ? "text-white/60" : "text-muted-foreground")}>
                                        {serviceData.description || "Professional grooming service"}
                                    </p>
                                </div>
                                
                                <div className={cn("flex justify-between items-center text-xs font-bold pt-4 border-t", isSelected ? "border-white/20" : "border-gray-100")}>
                                    <span className="flex items-center gap-1 opacity-80">{serviceData.duration_text}</span>
                                    <span className="text-sm">
                                        {serviceData.price_text}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Sidebar Summary */}
            <div className="w-full lg:w-[340px] shrink-0 sticky top-24">
                <div className="bg-[#0A0A0A] text-white rounded-3xl p-6 shadow-2xl border border-white/5 overflow-hidden relative">
                     {/* Decorative Elements */}
                     <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none"></div>

                    <div className="relative z-10">
                        <h3 className="text-lg font-bold mb-6 flex items-center justify-between">
                            <span>Your Selection</span>
                            <span className="bg-white/15 text-xs px-2.5 py-1 rounded-lg font-mono">{selectedServiceIds.length}</span>
                        </h3>

                        {selectedServiceIds.length === 0 ? (
                            <div className="text-center py-10 text-white/30 border-2 border-dashed border-white/10 rounded-2xl bg-white/5">
                                <Scissors className="w-8 h-8 mx-auto mb-3 opacity-50" />
                                <p className="text-sm font-medium">No services selected</p>
                                <p className="text-xs mt-1 opacity-60">Choose from the list</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 -mr-2 mb-6 custom-scrollbar">
                                {selectedServiceIds.map(id => {
                                    const s = services.find(srv => srv.id === id);
                                    if (!s) return null;
                                    const sData = getServiceDetails(s); // Use overridden details
                                    return (
                                        <div key={id} className="group flex justify-between items-center gap-3 bg-white/5 hover:bg-white/10 p-3.5 rounded-2xl transition-colors border border-transparent hover:border-white/10">
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-sm truncate mb-0.5">{sData.name}</div>
                                                <div className="text-xs text-white/50">{sData.duration_text} • {sData.price_text}</div>
                                            </div>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onToggleService(s); }}
                                                className="text-white/30 hover:text-white hover:bg-red-500/20 p-2 rounded-xl transition-all"
                                                title="Remove service"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="pt-6 border-t border-white/10 space-y-5">
                            <div className="flex justify-between items-end">
                                <span className="text-white/60 text-sm font-medium">Estimated Total</span>
                                <div className="text-right">
                                    <span className="block text-3xl font-bold tracking-tight">${totalAmount.toFixed(2)}</span>
                                    <span className="text-xs text-white/40 font-medium">{totalDuration} mins duration</span>
                                </div>
                            </div>

                            <Button 
                                className="w-full bg-white text-black hover:bg-gray-200 font-bold h-14 rounded-xl text-base shadow-lg transition-transform active:scale-[0.98]"
                                disabled={selectedServiceIds.length === 0}
                                onClick={onBookNow}
                            >
                                Continue to Date & Time
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
