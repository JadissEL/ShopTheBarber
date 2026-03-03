import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Scissors, MapPin, Star, ArrowLeft,
  Calendar as CalendarIcon, Check
} from 'lucide-react';
import { motion } from 'framer-motion';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { format } from 'date-fns';

export default function BookingConfirmationStep({
  hasBarberId,
  selectedBarber,
  selectedDate,
  selectedTime,
  selectedServices,
  services,
  customerNotes,
  onCustomerNotesChange,
  promoCode,
  onPromoCodeChange,
  appliedPromotion,
  onApplyPromo,
  onRemovePromo,
  promoError,
  basePrice,
  discountAmount,
  totalPrice,
  address,
  onConfirmBooking,
  isConfirming,
  // Results view props
  filteredBarbers,
  isLoadingBarbers,
  onBarberSelect,
  sortBy,
  onGoToPreferences,
}) {
  if (hasBarberId) {
    return (
      <motion.div
        key="results"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
      >
        <div className="max-w-3xl mx-auto">
          {!selectedBarber ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-muted-foreground">Preparing your booking...</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">Review & Confirm</h2>
                <p className="text-muted-foreground">Double check your booking details</p>
              </div>

              <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm mb-6">
                <div className="p-6 border-b border-border bg-gray-50/50">
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md">
                      <OptimizedImage
                        src={selectedBarber.image_url || "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=200&fit=crop"}
                        alt={selectedBarber.name}
                        fill
                        width={100}
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{selectedBarber.name}</h3>
                      <p className="text-muted-foreground text-sm">{selectedBarber.title}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <CalendarIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Date & Time</div>
                      <div className="text-lg">
                        {selectedDate ? format(selectedDate, 'PPP') : 'Date not selected'} at {selectedTime || 'Time not selected'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <Scissors className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold mb-2">Services</div>
                      <div className="space-y-2">
                        {selectedServices.map(id => {
                          const s = services.find(srv => srv.id === id);
                          if (!s) return null;
                          return (
                            <div key={id} className="flex justify-between text-sm">
                              <span>{s.data?.name || s.name}</span>
                              <span className="font-medium">{s.data?.price_text || s.price_text}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Customer Notes Input */}
                      <div className="mt-4 pt-4 border-t border-border">
                        <label className="text-sm font-semibold mb-2 block">Special Requests / Notes</label>
                        <textarea
                          className="w-full min-h-[80px] p-3 rounded-lg border border-gray-200 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                          placeholder="Any allergies, style preferences, or access needs?"
                          value={customerNotes}
                          onChange={(e) => onCustomerNotesChange(e.target.value)}
                        />
                      </div>

                      <div className="mt-4 pt-4 border-t border-border">
                        {!appliedPromotion ? (
                          <div className="flex gap-2">
                            <Input
                              placeholder="Promo Code"
                              value={promoCode}
                              onChange={(e) => onPromoCodeChange(e.target.value.toUpperCase())}
                              className="h-10 uppercase"
                            />
                            <Button onClick={onApplyPromo} variant="outline" size="sm" className="h-10">
                              Apply
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center bg-green-50 p-2 rounded text-sm text-green-700 border border-green-200">
                            <span className="font-medium flex items-center gap-1">
                              <Check className="w-4 h-4" /> {appliedPromotion.code} applied
                            </span>
                            <button onClick={onRemovePromo} className="text-xs hover:underline">
                              Remove
                            </button>
                          </div>
                        )}
                        {promoError && <p className="text-red-500 text-xs mt-1">{promoError}</p>}
                      </div>

                      <div className="border-t border-border mt-3 pt-3">
                        <div className="flex justify-between text-muted-foreground mb-1">
                          <span>Subtotal</span>
                          <span>${basePrice.toFixed(2)}</span>
                        </div>
                        {appliedPromotion && (
                          <div className="flex justify-between text-green-600 mb-2">
                            <span>Discount ({appliedPromotion.discount_text})</span>
                            <span>-${discountAmount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-lg text-foreground">
                          <span>Total</span>
                          <span>${totalPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {(address || selectedBarber?.location) && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold mb-1">Location</div>
                        <div>{address || selectedBarber.location}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Button
                size="lg"
                className="w-full text-lg h-14"
                onClick={onConfirmBooking}
                disabled={isConfirming}
              >
                {isConfirming ? 'Confirming...' : 'Confirm Booking'}
                {!isConfirming && <Check className="w-5 h-5 ml-2" />}
              </Button>
            </>
          )}
        </div>
      </motion.div>
    );
  }

  // RESULTS VIEW (Search Mode)
  return (
    <motion.div
      key="results"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">Available Barbers</h2>
          <p className="text-muted-foreground">
            {filteredBarbers.length} professionals found • Sorted by{' '}
            <strong>
              {sortBy === 'global_score' ? 'Best Match' :
                sortBy === 'price' ? 'Price' :
                  sortBy === 'distance' ? 'Distance' : 'Rating'}
            </strong>
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <Badge variant="outline" className="py-2 px-3">
            {selectedServices.length} {selectedServices.length === 1 ? 'service' : 'services'}
          </Badge>
          <Badge variant="outline" className="py-2 px-3">
            {format(selectedDate, 'MMM d')} at {selectedTime}
          </Badge>
        </div>
      </div>

      {isLoadingBarbers ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Finding the best barbers for you...</p>
        </div>
      ) : filteredBarbers.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Scissors className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-bold mb-3">No barbers found</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Try adjusting your preferences to see more results
          </p>
          <Button variant="outline" onClick={onGoToPreferences}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Adjust Preferences
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBarbers.map((barber, index) => (
            <motion.div
              key={barber.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onBarberSelect(barber)}
              className="bg-white rounded-2xl border border-border p-5 cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all group"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                  <OptimizedImage
                    src={(barber.data || barber).image_url || "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=200&fit=crop"}
                    alt={(barber.data || barber).name}
                    fill
                    width={100}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                      {(barber.data || barber).name}
                    </h3>
                    {(barber.data || barber).auto_accept && (
                      <Badge variant="outline" className="text-[10px] py-0.5 px-1.5 bg-green-50 text-green-700 border-green-200">
                        Instant
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{(barber.data || barber).title || 'Professional Barber'}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-semibold">{(barber.data || barber).rating || 5.0}</span>
                    </div>
                    <span className="text-muted-foreground">({(barber.data || barber).review_count || 0})</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  {address && <span className="flex items-center gap-1 mb-1">
                    <MapPin className="w-3 h-3" /> {barber.distance.toFixed(1)} mi
                  </span>}
                  <span className="font-semibold text-foreground text-lg">
                    ${barber.estimatedPrice.toFixed(2)}
                  </span>
                </div>
                {sortBy === 'global_score' && (
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    {barber.globalScore.toFixed(0)}% Match
                  </Badge>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
