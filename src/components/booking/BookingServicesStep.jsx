import { Button } from '@/components/ui/button';
import { Scissors, Clock, Check, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';
import BookingOffersPanel from '@/components/booking/BookingOffersPanel';

const categoryImages = {
  'Hair': 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&fit=crop',
  'Beard': 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&fit=crop',
  'Shave': 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&fit=crop',
  'Color': 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&fit=crop',
  'Facial': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&fit=crop',
  'Other': 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&fit=crop'
};

export default function BookingServicesStep({
  selectedBarber,
  servicesLoading,
  services,
  availableServices,
  selectedCategory,
  onSelectCategory,
  selectedServices,
  onServiceToggle,
  getServiceDetails,
  activeBarberId,
  allBarbers,
  totalDuration,
  totalPrice,
  comboSavings = 0,
  bundleMatch = null,
  bookingOffers = null,
  offersLoading = false,
  onAddServices,
  onAddBundle,
  onApplyPromoFromOffer,
  onNext,
  canProceed,
}) {
  const groupedServices = availableServices.reduce((acc, service) => {
    const serviceData = service.data || service;
    const category = serviceData.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {});

  const categories = Object.keys(groupedServices);
  const categoryServices = groupedServices[selectedCategory] || [];

  const avgPrice = categoryServices.length > 0
    ? categoryServices.reduce((sum, s) => {
      const sData = s.data || s;
      const price = sData.price || parseFloat((sData.price_text || '0').replace(/[^0-9.]/g, '')) || 0;
      return sum + price;
    }, 0) / categoryServices.length
    : 0;

  return (
    <motion.div
      key="services"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="text-center mb-6">
        <h2 className={cn(stb.uiHeading, 'text-2xl md:text-3xl mb-2')}>
          {selectedBarber ? `Booking with ${selectedBarber.name}` : 'Choose Your Services'}
        </h2>
        <p className="text-muted-foreground text-sm">Select a category and pick your services</p>
      </div>

      <BookingOffersPanel
        offers={bookingOffers}
        isLoading={offersLoading}
        selectedServices={selectedServices}
        onAddServices={onAddServices}
        onAddBundle={onAddBundle}
        onApplyPromoCode={onApplyPromoFromOffer}
      />

      {servicesLoading ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading services...</p>
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">No services available</p>
        </div>
      ) : (
        <>
          {/* Category Selection */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {categories.map(category => {
              const count = groupedServices[category].length;
              return (
                <button
                  key={category}
                  onClick={() => onSelectCategory(category)}
                  className={cn(
                    "relative h-32 rounded-lg overflow-hidden border-2 transition-all group",
                    selectedCategory === category
                      ? "border-primary ring-2 ring-primary/25"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  <OptimizedImage
                    src={categoryImages[category] || categoryImages['Other']}
                    alt={category}
                    fill
                    width={400}
                    imgClassName="object-cover"
                  />
                  <div className="absolute inset-0 bg-foreground/50 flex flex-col justify-end p-4">
                    <h3 className="text-lg font-bold text-white mb-1">{category}</h3>
                    <p className="text-white/80 text-xs">{count} {count === 1 ? 'service' : 'services'}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Services Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">{selectedCategory} Services</h3>
              <p className="text-sm text-muted-foreground">Average: <strong className="text-primary">${avgPrice.toFixed(0)}</strong></p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {categoryServices.map(service => {
                const serviceData = service.data || service;
                const isSelected = selectedServices.includes(service.id);
                const details = getServiceDetails(service.id);

                const baseDuration = serviceData.duration_minutes || serviceData.duration_min || parseInt((serviceData.duration_text || '0').match(/\d+/)?.[0] || 0);
                const baseServicePrice = serviceData.price || parseFloat((serviceData.price_text || '0').replace(/[^0-9.]/g, '') || 0);

                return (
                  <div
                    key={service.id}
                    onClick={() => onServiceToggle(service.id)}
                    className={cn(
                      "group relative bg-card border-2 rounded-lg overflow-hidden cursor-pointer transition-all duration-200",
                      isSelected
                        ? "border-primary shadow-md shadow-primary/15 ring-1 ring-primary/20"
                        : "border-border hover:border-primary/30 hover:shadow-sm"
                    )}
                  >
                    <div className={cn(
                      "absolute top-2 right-2 z-20 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                      isSelected
                        ? "bg-primary border-primary"
                        : "bg-card border-border group-hover:border-primary/50"
                    )}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>

                    <div className="relative h-32 w-full overflow-hidden bg-muted">
                      {serviceData.image_url ? (
                        <OptimizedImage
                          src={serviceData.image_url}
                          alt={serviceData.name}
                          fill
                          width={300}
                          imgClassName="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/80">
                          <Scissors className="w-12 h-12" />
                        </div>
                      )}
                    </div>

                    <div className="p-3">
                      <h3 className="font-bold text-sm mb-1 text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {serviceData.name}
                      </h3>

                      {!activeBarberId && serviceData.owner_id && (
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                          by {allBarbers.find(b => b.id === serviceData.owner_id)?.name || allBarbers.find(b => b.id === serviceData.owner_id)?.data?.name || 'Provider'}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span className={cn("text-xs", details.duration !== baseDuration && "text-primary font-bold")}>
                            {details.duration}m
                          </span>
                        </div>
                        <div className={cn("text-base font-bold text-primary", details.price !== baseServicePrice && "text-primary")}>
                          ${details.price.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-border shadow-[0_-8px_30px_rgba(0,0,0,0.08)] safe-area-pb">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs sm:text-sm text-muted-foreground min-w-0">
              {selectedServices.length === 0 ? (
                <span>Select at least one service to continue</span>
              ) : (
                <span className="line-clamp-2 sm:line-clamp-none">
                  <strong className="text-foreground">{selectedServices.length}</strong> service{selectedServices.length > 1 ? 's' : ''} •
                  <strong className="text-foreground ml-1">{totalDuration} min</strong> •
                  <strong className="text-primary ml-1">${totalPrice.toFixed(2)}</strong>
                  {comboSavings > 0 && bundleMatch && (
                    <span className="text-primary ml-1 sm:ml-2">({bundleMatch.bundle_name}: -${comboSavings.toFixed(2)})</span>
                  )}
                </span>
              )}
            </div>
            <Button
              size="lg"
              onClick={onNext}
              disabled={!canProceed}
              className="w-full sm:w-auto min-h-[44px] px-8 shadow-lg shrink-0"
            >
              Continue <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      <div className="h-28 sm:h-24" />
    </motion.div>
  );
}
