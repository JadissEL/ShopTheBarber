import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Scissors, MapPin, Star, ArrowLeft,
  Calendar as CalendarIcon, Check, Banknote, CreditCard, Shield, AlertTriangle, Car, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { format } from 'date-fns';
import GroupBookingPartyPanel from '@/components/groupBooking/GroupBookingPartyPanel';
import AddressAutocomplete from '@/components/maps/AddressAutocomplete';
import GuestContactForm from '@/components/booking/GuestContactForm';
import { formatDistanceKm } from '@/lib/geo';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

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
  availablePromotions = [],
  loyaltyRewardCodes = [],
  onApplyPromoFromOffer,
  basePrice,
  subtotalAfterCombo,
  comboSavings,
  bundleMatch,
  discountAmount,
  totalPrice,
  grandTotal,
  travelFee = 0,
  travelDistanceKm,
  travelZoneLabel,
  travelQuoteLoading = false,
  travelOutOfArea = false,
  atHomeVisit = false,
  pointsEarnedPreview,
  address,
  onConfirmBooking,
  isConfirming,
  confirmDisabled = false,
  cashAvailability,
  paymentProtectionPreview,
  paymentMethod = 'online',
  onPaymentMethodChange,
  // Results view props
  filteredBarbers,
  isLoadingBarbers,
  onBarberSelect,
  sortBy,
  onGoToPreferences,
  groupMode = false,
  groupSearchMode = false,
  groupBookingCaps,
  groupGuests = [],
  onGroupGuestsChange,
  groupEventLabel = '',
  onGroupEventLabelChange,
  groupQuote,
  groupDiscountAmount = 0,
  locationType = 'any',
  onAddressChange,
  onAddressSelect,
  isGuestCheckout = false,
  guestContact,
  onGuestContactChange,
  guestContactError,
  guestBookingBlocked = false,
  guestBlockReason,
  signInReturnPath,
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

              <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm mb-6">
                <div className="p-6 border-b border-border bg-muted/50/50">
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
                    <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center text-violet-700 flex-shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold mb-1">
                        {atHomeVisit ? 'At-home visit' : groupMode ? 'In-shop group visit' : 'Location'}
                      </div>
                      {atHomeVisit ? (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Your barber comes to you. Enter the full address where the service will take place.
                          </p>
                          <AddressAutocomplete
                            value={address}
                            onChange={onAddressChange}
                            onSelect={onAddressSelect}
                            placeholder="Street, city, apartment / hotel room…"
                          />
                          {address.trim().length >= 8 && travelQuoteLoading && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Calculating travel fee…
                            </p>
                          )}
                          {travelOutOfArea && (
                            <p className="text-xs text-red-600 font-medium flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              This address is outside the provider&apos;s service area.
                            </p>
                          )}
                          {!travelOutOfArea && travelFee > 0 && travelZoneLabel && (
                            <p className="text-xs text-violet-700 font-medium">
                              Travel zone: {travelZoneLabel}
                              {travelDistanceKm != null && `, ${travelDistanceKm.toFixed(1)} km`}
                            </p>
                          )}
                          {groupMode && (
                            <p className="text-xs text-violet-700 font-medium">
                              Group at-home, ensure space for {groupGuests.length} guests.
                              {selectedBarber?.is_vip && (
                                <> VIP specialist, full studio-quality setup at your location.</>
                              )}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">
                            {address || selectedBarber?.location || 'At the barber shop'}
                          </div>
                          {groupMode && (
                            <p className="text-xs text-amber-800 font-medium">
                              Your whole party visits together. No accounts needed for guests, names only.
                            </p>
                          )}
                        </div>
                      )}
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

                      {groupMode && groupBookingCaps && onGroupGuestsChange && (
                        <div className="mt-4">
                          <GroupBookingPartyPanel
                            capabilities={groupBookingCaps}
                            guests={groupGuests}
                            onGuestsChange={onGroupGuestsChange}
                            groupEventLabel={groupEventLabel}
                            onGroupEventLabelChange={onGroupEventLabelChange}
                            groupQuote={groupQuote}
                          />
                        </div>
                      )}

                      {/* Customer Notes Input */}
                      <div className="mt-4 pt-4 border-t border-border">
                        <label className="text-sm font-semibold mb-2 block">Special Requests / Notes</label>
                        <textarea
                          className="w-full min-h-[80px] p-3 rounded-lg border border-border text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                          placeholder="Any allergies, style preferences, or access needs?"
                          value={customerNotes}
                          onChange={(e) => onCustomerNotesChange(e.target.value)}
                        />
                      </div>

                      <div className="mt-4 pt-4 border-t border-border">
                        {!appliedPromotion ? (
                          <>
                            {loyaltyRewardCodes.length > 0 && !appliedPromotion && (
                              <div className="mb-3">
                                <p className="text-xs font-semibold text-amber-700 mb-2">Your reward codes</p>
                                <div className="flex flex-wrap gap-2">
                                  {loyaltyRewardCodes.map((p) => (
                                    <button
                                      key={p.code}
                                      type="button"
                                      onClick={() => {
                                        onPromoCodeChange(p.code);
                                        onApplyPromoFromOffer?.(p.code);
                                      }}
                                      className="px-2.5 py-1 rounded-lg border border-amber-400/50 bg-amber-50 text-xs font-mono font-bold hover:bg-amber-100 text-amber-900"
                                    >
                                      {p.code}, {p.discount_text}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                            {availablePromotions.length > 0 && (
                              <div className="mb-3">
                                <p className="text-xs font-semibold text-muted-foreground mb-2">Available promos</p>
                                <div className="flex flex-wrap gap-2">
                                  {availablePromotions.map((p) => (
                                    <button
                                      key={p.id}
                                      type="button"
                                      onClick={() => {
                                        onPromoCodeChange(p.code);
                                        onApplyPromoFromOffer?.(p.code);
                                      }}
                                      className="px-2.5 py-1 rounded-lg border border-primary/30 bg-primary/5 text-xs font-mono font-bold hover:bg-primary/10"
                                    >
                                      {p.code}, {p.discount_text}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
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
                          </>
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
                          <span>{groupMode ? 'Group subtotal' : 'Services subtotal'}</span>
                          <span>${basePrice.toFixed(2)}</span>
                        </div>
                        {groupMode && groupDiscountAmount > 0 && (
                          <div className="flex justify-between text-violet-600 mb-1">
                            <span>Group discount</span>
                            <span>-${groupDiscountAmount.toFixed(2)}</span>
                          </div>
                        )}
                        {comboSavings > 0 && bundleMatch && (
                          <div className="flex justify-between text-emerald-600 mb-1">
                            <span>Combo ({bundleMatch.bundle_name})</span>
                            <span>-${comboSavings.toFixed(2)}</span>
                          </div>
                        )}
                        {appliedPromotion && discountAmount > 0 && (
                          <div className="flex justify-between text-green-600 mb-2">
                            <span>Promo ({appliedPromotion.discount_text || appliedPromotion.code})</span>
                            <span>-${discountAmount.toFixed(2)}</span>
                          </div>
                        )}
                        {atHomeVisit && travelFee > 0 && (
                          <div className="flex justify-between text-violet-700 mb-1">
                            <span className="flex items-center gap-1">
                              <Car className="w-3.5 h-3.5" />
                              Travel fee{travelZoneLabel ? ` (${travelZoneLabel})` : ''}
                            </span>
                            <span>+${travelFee.toFixed(2)}</span>
                          </div>
                        )}
                        {atHomeVisit && travelFee === 0 && !travelQuoteLoading && address.trim().length >= 8 && !travelOutOfArea && (
                          <div className="flex justify-between text-muted-foreground text-sm mb-1">
                            <span className="flex items-center gap-1">
                              <Car className="w-3.5 h-3.5" />
                              Travel fee
                            </span>
                            <span>Included</span>
                          </div>
                        )}
                        {comboSavings > 0 && (
                          <div className="flex justify-between text-muted-foreground text-sm mb-1">
                            <span>After combo</span>
                            <span>${(subtotalAfterCombo ?? basePrice - comboSavings).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-lg text-foreground">
                          <span>Total</span>
                          <span>${(grandTotal ?? totalPrice).toFixed(2)}</span>
                        </div>
                        {pointsEarnedPreview > 0 && (
                          <p className="text-sm text-green-700 mt-2">
                            Earn ~{pointsEarnedPreview} loyalty points when this visit is completed
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {(address || selectedBarber?.location) && atHomeVisit && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold mb-1">Service address</div>
                        <div>{address || selectedBarber.location}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {paymentProtectionPreview?.next_step &&
                paymentProtectionPreview.next_step !== 'none' &&
                paymentProtectionPreview.next_step !== 'full_payment' && (
                <div className="bg-violet-50 rounded-2xl border border-violet-200 p-6 mb-6 space-y-2">
                  <p className="font-semibold flex items-center gap-2 text-violet-900">
                    <Shield className="w-5 h-5" />
                    Payment protection
                  </p>
                  {paymentProtectionPreview.next_step === 'deposit' && paymentMethod !== 'cash_at_store' && (
                    <p className="text-sm text-violet-800">
                      Deposit of <strong>€{(paymentProtectionPreview.deposit_amount ?? 0).toFixed(2)}</strong> due now.
                      Balance of €{(paymentProtectionPreview.balance_due ?? 0).toFixed(2)} at your visit.
                    </p>
                  )}
                  {paymentProtectionPreview.next_step === 'auth_hold' && (
                    <p className="text-sm text-violet-800">
                      Your card will be <strong>authorized</strong> for €{(grandTotal ?? totalPrice).toFixed(2)}, charged after your visit.
                    </p>
                  )}
                  {paymentProtectionPreview.next_step === 'save_card' && (
                    <p className="text-sm text-violet-800">
                      {paymentMethod === 'cash_at_store'
                        ? 'Pay at the shop (cash or POS), but a card on file may be required to secure this appointment.'
                        : 'This barber requires a card on file to secure your appointment.'}
                    </p>
                  )}
                  {paymentProtectionPreview.policy?.no_show_protection_enabled && (
                    <p className="text-xs text-violet-700 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      No-show fees may apply per barber policy.
                    </p>
                  )}
                  {paymentProtectionPreview.policy?.late_cancel_protection_enabled && (
                    <p className="text-xs text-violet-700">
                      Late cancellations: full refund {paymentProtectionPreview.policy.late_cancel_full_refund_hours}h+ before;
                      {' '}{paymentProtectionPreview.policy.late_cancel_fee_percent}% fee between{' '}
                      {paymentProtectionPreview.policy.late_cancel_no_refund_hours}-{paymentProtectionPreview.policy.late_cancel_full_refund_hours}h;
                      non-refundable within {paymentProtectionPreview.policy.late_cancel_no_refund_hours}h.
                    </p>
                  )}
                </div>
              )}

              {isGuestCheckout && guestContact && onGuestContactChange ? (
                <GuestContactForm
                  contact={guestContact}
                  onChange={onGuestContactChange}
                  signInReturnPath={signInReturnPath}
                  error={guestContactError}
                />
              ) : null}

              {isGuestCheckout && guestBookingBlocked && guestBlockReason ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-sm text-amber-900">
                  {guestBlockReason}{' '}
                  <Link
                    to={`${createPageUrl('SignIn')}?return=${encodeURIComponent(signInReturnPath || '/BookingFlow')}`}
                    className="font-semibold underline underline-offset-2"
                  >
                    Sign in
                  </Link>
                </div>
              ) : null}

              {cashAvailability?.accepts_cash && (
                <div className="bg-card rounded-2xl border border-border p-6 mb-6 space-y-3">
                  <p className="font-semibold">How would you like to pay?</p>
                  <p className="text-xs text-muted-foreground">
                    Pay at shop means you settle with the barber in person, cash or card on their shop POS.
                    ShopTheBarber&apos;s commission is handled separately from your payment.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {!isGuestCheckout ? (
                      <button
                        type="button"
                        onClick={() => onPaymentMethodChange?.('online')}
                        className={`p-4 rounded-xl border text-left transition-colors ${
                          paymentMethod === 'online' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                        }`}
                      >
                        <CreditCard className="w-5 h-5 mb-2 text-primary" />
                        <p className="font-medium text-sm">Pay online</p>
                        <p className="text-xs text-muted-foreground">Card through ShopTheBarber when you book</p>
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onPaymentMethodChange?.('cash_at_store')}
                      className={`p-4 rounded-xl border text-left transition-colors ${
                        paymentMethod === 'cash_at_store' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <Banknote className="w-5 h-5 mb-2 text-emerald-600" />
                      <p className="font-medium text-sm">Pay at shop</p>
                      <p className="text-xs text-muted-foreground">Cash or card on the shop POS, pay your barber at the visit</p>
                    </button>
                  </div>
                </div>
              )}

              <Button
                size="lg"
                className="w-full text-lg h-14"
                onClick={onConfirmBooking}
                disabled={isConfirming || confirmDisabled}
              >
                {isConfirming
                  ? 'Confirming...'
                  : travelOutOfArea
                    ? 'Address outside service area'
                    : guestBookingBlocked && isGuestCheckout
                      ? 'Sign in to book'
                    : confirmDisabled
                      ? atHomeVisit && travelQuoteLoading
                        ? 'Calculating travel fee…'
                        : 'Calculating group total…'
                      : isGuestCheckout
                        ? 'Book without account'
                      : 'Confirm Booking'}
                {!isConfirming && !confirmDisabled && !travelOutOfArea && <Check className="w-5 h-5 ml-2" />}
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
          {groupSearchMode && (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-2 max-w-xl">
              Group booking, pick a barber who accepts parties. You&apos;ll add friend &amp; family names at checkout (no guest accounts).
            </p>
          )}
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
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
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
              className="bg-card rounded-2xl border border-border p-5 cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all group"
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
                  {barber.distance_km != null && (
                    <span className="flex items-center gap-1 mb-1">
                      <MapPin className="w-3 h-3" /> {formatDistanceKm(barber.distance_km)}
                    </span>
                  )}
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
