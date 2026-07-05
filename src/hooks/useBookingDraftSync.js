import { useCallback, useEffect, useRef } from 'react';
import {
  saveBookingDraft,
  loadBookingDraft,
  clearBookingDraft,
  buildBookingReturnPath,
  buildBookingSearchParams,
  draftMatchesContext,
  resolveStepFromSearch,
  parseDateTimeFromSearch,
} from '@/lib/bookingDraft';
import { signInUrlWithReturn, createPageUrl } from '@/utils';

/**
 * Persists booking wizard state across auth redirects and browser refresh.
 * @param {object} options
 */
export function useBookingDraftSync({
  enabled = true,
  location,
  navigate,
  isSpecificBarberBooking,
  isRebookFlow,
  urlBarberId,
  urlShopId,
  bookingShopId,
  currentStep,
  setCurrentStep,
  selectedServices,
  setSelectedServices,
  selectedCategory,
  setSelectedCategory,
  selectedDate,
  setSelectedDate,
  selectedTime,
  setSelectedTime,
  promoCode,
  setPromoCode,
  appliedPromotion,
  setAppliedPromotion,
  customerNotes,
  setCustomerNotes,
  paymentMethod,
  setPaymentMethod,
  guestContact,
  setGuestContact,
  address,
  setAddress,
  addressCoords,
  setAddressCoords,
  minRating,
  setMinRating,
  sortBy,
  setSortBy,
  acceptanceType,
  setAcceptanceType,
  providerType,
  setProviderType,
  locationType,
  setLocationType,
  preferredLanguage,
  setPreferredLanguage,
  kidsWelcomeOnly,
  setKidsWelcomeOnly,
  groupGuests,
  setGroupGuests,
  groupEventLabel,
  setGroupEventLabel,
  groupMode,
  context,
  bookingContext,
}) {
  const draftHydratedRef = useRef(false);

  const collectSnapshot = useCallback(
    (stepOverride) => ({
      barberId: urlBarberId || undefined,
      shopId: urlShopId || bookingShopId || undefined,
      context: context || bookingContext || undefined,
      groupMode,
      locationType,
      isSpecificBarber: isSpecificBarberBooking,
      currentStep: typeof stepOverride === 'number' ? stepOverride : currentStep,
      selectedServices,
      selectedCategory,
      selectedDate: selectedDate ? selectedDate.toISOString() : null,
      selectedTime,
      promoCode,
      appliedPromotion,
      customerNotes,
      paymentMethod,
      guestContact,
      address,
      addressCoords,
      minRating,
      sortBy,
      acceptanceType,
      providerType,
      preferredLanguage,
      kidsWelcomeOnly,
      groupGuests,
      groupEventLabel,
    }),
    [
      urlBarberId,
      urlShopId,
      bookingShopId,
      context,
      bookingContext,
      groupMode,
      locationType,
      isSpecificBarberBooking,
      currentStep,
      selectedServices,
      selectedCategory,
      selectedDate,
      selectedTime,
      promoCode,
      appliedPromotion,
      customerNotes,
      paymentMethod,
      guestContact,
      address,
      addressCoords,
      minRating,
      sortBy,
      acceptanceType,
      providerType,
      preferredLanguage,
      kidsWelcomeOnly,
      groupGuests,
      groupEventLabel,
    ],
  );

  const syncUrlToStep = useCallback(
    (stepOverride) => {
      if (!enabled || isRebookFlow) return;
      const search = buildBookingSearchParams(collectSnapshot(stepOverride));
      const current = location.search.startsWith('?') ? location.search.slice(1) : location.search;
      if (search === current) return;
      navigate({ pathname: location.pathname, search: search ? `?${search}` : '' }, { replace: true });
    },
    [enabled, isRebookFlow, collectSnapshot, location.pathname, location.search, navigate],
  );

  const redirectToSignIn = useCallback(
    (stepOverride) => {
      const snapshot = collectSnapshot(stepOverride);
      saveBookingDraft(snapshot);
      const returnPath = buildBookingReturnPath(snapshot, createPageUrl);
      navigate(signInUrlWithReturn(returnPath));
    },
    [collectSnapshot, navigate],
  );

  const getSignInHref = useCallback(
    (stepOverride) => {
      const snapshot = collectSnapshot(stepOverride);
      saveBookingDraft(snapshot);
      return signInUrlWithReturn(buildBookingReturnPath(snapshot, createPageUrl));
    },
    [collectSnapshot],
  );

  const clearDraft = useCallback(() => {
    clearBookingDraft();
  }, []);

  // Hydrate wizard from session draft once per mount.
  useEffect(() => {
    if (!enabled || isRebookFlow || draftHydratedRef.current) return;

    const barberId = urlBarberId || undefined;
    const shopId = urlShopId || bookingShopId || undefined;
    const draft = loadBookingDraft();

    if (draft && draftMatchesContext(draft, { barberId, shopId })) {
      if (Array.isArray(draft.selectedServices) && draft.selectedServices.length > 0 && selectedServices.length === 0) {
        setSelectedServices(draft.selectedServices.map(String));
      }
      if (draft.selectedCategory && !selectedCategory) setSelectedCategory(String(draft.selectedCategory));
      if (draft.selectedDate && !selectedDate) {
        const d = new Date(String(draft.selectedDate));
        if (!Number.isNaN(d.getTime())) setSelectedDate(d);
      }
      if (draft.selectedTime && !selectedTime) setSelectedTime(String(draft.selectedTime));
      if (draft.promoCode && !promoCode) setPromoCode(String(draft.promoCode));
      if (draft.appliedPromotion && !appliedPromotion) setAppliedPromotion(draft.appliedPromotion);
      if (draft.customerNotes && !customerNotes) setCustomerNotes(String(draft.customerNotes));
      if (draft.paymentMethod) setPaymentMethod(String(draft.paymentMethod));
      if (draft.address && !address) setAddress(String(draft.address));
      if (draft.addressCoords && !addressCoords) setAddressCoords(draft.addressCoords);
      if (draft.guestContact) {
        setGuestContact((prev) => ({ ...prev, ...draft.guestContact }));
      }
      if (typeof draft.minRating === 'number') setMinRating(draft.minRating);
      if (draft.sortBy) setSortBy(String(draft.sortBy));
      if (draft.acceptanceType) setAcceptanceType(String(draft.acceptanceType));
      if (draft.providerType) setProviderType(String(draft.providerType));
      if (draft.locationType) setLocationType(String(draft.locationType));
      if (draft.preferredLanguage) setPreferredLanguage(String(draft.preferredLanguage));
      if (typeof draft.kidsWelcomeOnly === 'boolean') setKidsWelcomeOnly(draft.kidsWelcomeOnly);
      if (Array.isArray(draft.groupGuests) && draft.groupGuests.length > 0) {
        setGroupGuests(draft.groupGuests);
      }
      if (draft.groupEventLabel) setGroupEventLabel(String(draft.groupEventLabel));

      const params = new URLSearchParams(location.search);
      if (!params.has('step') && typeof draft.currentStep === 'number') {
        setCurrentStep(draft.currentStep);
      }
    }

    draftHydratedRef.current = true;
  }, [
    enabled,
    isRebookFlow,
    urlBarberId,
    urlShopId,
    bookingShopId,
    location.search,
    selectedServices.length,
    selectedCategory,
    selectedDate,
    selectedTime,
    promoCode,
    appliedPromotion,
    customerNotes,
    address,
    addressCoords,
    setSelectedServices,
    setSelectedCategory,
    setSelectedDate,
    setSelectedTime,
    setPromoCode,
    setAppliedPromotion,
    setCustomerNotes,
    setPaymentMethod,
    setGuestContact,
    setAddress,
    setAddressCoords,
    setMinRating,
    setSortBy,
    setAcceptanceType,
    setProviderType,
    setLocationType,
    setPreferredLanguage,
    setKidsWelcomeOnly,
    setGroupGuests,
    setGroupEventLabel,
    setCurrentStep,
  ]);

  // After auth redirect, URL carries step + date/time — re-sync wizard step.
  useEffect(() => {
    if (!enabled || isRebookFlow) return;
    const params = new URLSearchParams(location.search);

    const { date, time } = parseDateTimeFromSearch(params);
    if (date && !selectedDate) setSelectedDate(date);
    if (time && !selectedTime) setSelectedTime(time);

    if (params.has('step')) {
      const step = resolveStepFromSearch(params, isSpecificBarberBooking);
      setCurrentStep((prev) => (prev !== step ? step : prev));
    }
  }, [
    enabled,
    isRebookFlow,
    location.search,
    isSpecificBarberBooking,
    selectedDate,
    selectedTime,
    setSelectedDate,
    setSelectedTime,
    setCurrentStep,
  ]);

  // Debounced persistence while the user fills the wizard.
  useEffect(() => {
    if (!enabled || isRebookFlow) return;
    const timer = setTimeout(() => saveBookingDraft(collectSnapshot()), 350);
    return () => clearTimeout(timer);
  }, [enabled, isRebookFlow, collectSnapshot]);

  return {
    collectSnapshot,
    syncUrlToStep,
    redirectToSignIn,
    getSignInHref,
    clearDraft,
  };
}
