import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useBooking } from '@/components/context/BookingContext';
import { sendNotification } from '@/components/notifications/notificationUtils';
import { MetaTags } from '@/components/seo/MetaTags';
import { toast } from 'sonner';
import {
  Scissors, Clock, MapPin, Star, ArrowRight, ArrowLeft,
  Check, TrendingUp, DollarSign,
  Award, Sparkles, Loader2, CheckCircle2, Home, Globe, Baby
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import BookingServicesStep from '@/components/booking/BookingServicesStep';
import BookingDateTimeStep from '@/components/booking/BookingDateTimeStep';
import BookingConfirmationStep from '@/components/booking/BookingConfirmationStep';
import BookingWaitlistDialog from '@/components/booking/BookingWaitlistDialog';
import ReferralShareCard from '@/components/referral/ReferralShareCard';
import { parseSpokenLanguages, matchesLanguageFilter, FALLBACK_LANGUAGE_OPTIONS } from '@/lib/languages';
import { parseChildrenFriendly, matchesChildrenFriendlyFilter, CHILDREN_FRIENDLY_LABEL } from '@/lib/childrenFriendly';
import {
  getServiceLocationModes,
  getShopBookingLocationModes,
  isShopBookingContext,
  offersMobileService,
  offersShopService,
  resolveClientLocationType,
} from '@/lib/serviceLocation';
import AddressAutocomplete from '@/components/maps/AddressAutocomplete';
import { distanceKm, roundKm } from '@/lib/geo';
import { usePreferredLocation } from '@/hooks/usePreferredLocation';
import { loadPreferredLocation, savePreferredLocation } from '@/lib/userLocation';
import { loadRebookPrefill, clearRebookPrefill } from '@/lib/rebook';
import { resolveBareBookingFlowRedirect } from '@/lib/discoveryRoutes';
import {
  loadGuestContact,
  saveGuestContact,
  validateGuestContact,
  saveGuestBookingToken,
  isGuestBookingBlocked,
} from '@/lib/guestBooking';

export default function BookingFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingState, updateBooking } = useBooking();

  const searchParams = new URLSearchParams(location.search);
  const urlBarberId = searchParams.get('barberId') || searchParams.get('barber');
  const urlShopId = searchParams.get('shopId');
  const urlServiceId = searchParams.get('serviceId');
  const urlServiceIds = searchParams.get('serviceIds');
  const context = searchParams.get('context');
  const groupMode = searchParams.get('group') === '1';
  const isRebookFlow = searchParams.get('rebook') === '1';

  // Discovery nav (Mobile, Group, etc.) must open Explore, not a barber-less booking wizard.
  useEffect(() => {
    const redirect = resolveBareBookingFlowRedirect(searchParams, {
      barberId: urlBarberId,
      shopId: urlShopId,
      serviceId: urlServiceId,
      serviceIds: urlServiceIds,
      isRebook: isRebookFlow,
    });
    if (redirect) {
      navigate(createPageUrl(redirect), { replace: true });
    }
  }, [location.search, urlBarberId, urlShopId, urlServiceId, urlServiceIds, isRebookFlow, navigate]);

  // Sync URL params to booking state if present
  useEffect(() => {
    const updates = {};
    if (urlBarberId && bookingState?.barberId !== urlBarberId) updates.barberId = urlBarberId;
    if (urlShopId && bookingState?.shopId !== urlShopId) updates.shopId = urlShopId;
    if (context === 'independent') updates.context = 'independent';
    else if (urlShopId) updates.context = 'shop';

    if (Object.keys(updates).length > 0) {
      updateBooking({ ...bookingState, ...updates });
    }
  }, [urlBarberId, urlShopId, context, bookingState?.barberId, bookingState?.shopId]);

  // Dynamically determine steps based on whether a barber is pre-selected
  const isSpecificBarberBooking = !!(bookingState?.barberId || urlBarberId);
  const STEPS = isSpecificBarberBooking
    ? ['Services', 'Date & Time', 'Confirmation']
    : ['Services', 'Date & Time', 'Preferences', 'Results'];

  // Initialize step from URL or default to 0
  const getInitialStep = () => {
    const params = new URLSearchParams(location.search);
    const stepParam = params.get('step');
    const hasBarber = params.get('barberId') || params.get('barber');
    if (stepParam === 'datetime' || stepParam === '1') return 1;
    if (stepParam === 'preferences' || stepParam === '2') return hasBarber ? 1 : 2;
    if (stepParam === 'results') return hasBarber ? 2 : 3;
    if (stepParam === 'confirm' || stepParam === 'confirmation') return hasBarber ? 2 : 3;
    if (stepParam === '3') return hasBarber ? 2 : 3;
    return 0;
  };

  // Step tracking
  const [currentStep, setCurrentStep] = useState(getInitialStep);

  // Step 1: Services
  // Initialize services from global state or URL param
  const [selectedServices, setSelectedServices] = useState(() => {
    const fromUrlList = urlServiceIds
      ? urlServiceIds.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    if (fromUrlList.length > 0) return fromUrlList;

    const urlServiceId = searchParams.get('serviceId');
    if (urlServiceId) return [urlServiceId];

    if (bookingState?.selectedServices?.length > 0) {
      return bookingState.selectedServices.map(s => s.id);
    }
    return [];
  });

  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || null);

  // Step 2: Date & Time
  const [selectedDate, setSelectedDate] = useState(bookingState?.selectedDate ? new Date(bookingState.selectedDate) : null);
  const [selectedTime, setSelectedTime] = useState(bookingState?.selectedTime || '');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromotion, setAppliedPromotion] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [customerNotes, setCustomerNotes] = useState(''); // New: Customer Notes
  const [paymentMethod, setPaymentMethod] = useState('online'); // online | cash_at_store
  const [confirmedPaymentMethod, setConfirmedPaymentMethod] = useState('online');
  const [guestContact, setGuestContact] = useState(() => loadGuestContact());
  const [guestContactError, setGuestContactError] = useState('');
  const [confirmedGuestToken, setConfirmedGuestToken] = useState(null);

  // One-click rebook prefill (address, group label, prior payment preference)
  useEffect(() => {
    if (!isRebookFlow) return;
    const prefill = loadRebookPrefill();
    if (!prefill) return;

    if (prefill.address && typeof prefill.address === 'string') {
      setAddress(prefill.address);
      if (prefill.client_latitude != null && prefill.client_longitude != null) {
        setAddressCoords({
          latitude: prefill.client_latitude,
          longitude: prefill.client_longitude,
        });
      }
    }
    if (prefill.group_event_label) {
      setGroupEventLabel(String(prefill.group_event_label));
    }
    if (prefill.is_group && prefill.party_size && prefill.party_size >= 2) {
      const size = Math.min(Number(prefill.party_size), 12);
      setGroupGuests(Array.from({ length: size }, () => ({ guest_name: '' })));
    }
    if (prefill.payment_method === 'cash_at_store' || prefill.payment_method === 'online') {
      setPaymentMethod(prefill.payment_method);
    }

    toast.message('Rebooking', {
      description: prefill.barber_name
        ? `Same services & provider as last time, pick a new date with ${prefill.barber_name}.`
        : 'Same provider as last time, pick a new date.',
    });
    clearRebookPrefill();
  }, [isRebookFlow]);

  const { setPreferredLocation } = usePreferredLocation();

  // Step 3: Preferences
  const [address, setAddress] = useState('');
  const [addressCoords, setAddressCoords] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  useEffect(() => {
    const saved = loadPreferredLocation();
    if (saved && !address) {
      setAddress(saved.address);
      setAddressCoords({ latitude: saved.latitude, longitude: saved.longitude });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- hydrate once on mount

  const persistPreferredLocation = (item) => {
    if (!item?.formatted_address || item.latitude == null || item.longitude == null) return;
    savePreferredLocation({
      address: item.formatted_address,
      latitude: item.latitude,
      longitude: item.longitude,
    });
    setPreferredLocation({
      address: item.formatted_address,
      latitude: item.latitude,
      longitude: item.longitude,
    });
  };

  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('global_score'); // global_score, price, distance, rating
  const [acceptanceType, setAcceptanceType] = useState('all'); // all, auto, manual
  const [providerType, setProviderType] = useState('all'); // all, freelancer, shop
  const [locationType, setLocationType] = useState(() => {
    const loc = searchParams.get('location');
    const isGroup = searchParams.get('group') === '1';
    if (loc === 'mobile') return 'mobile';
    if (loc === 'shop') return 'shop';
    // Group bookings default to in-shop unless client explicitly chose at-home
    if (isGroup) return 'shop';
    return 'any';
  }); // any, shop, mobile
  const [preferredLanguage, setPreferredLanguage] = useState('');
  const [kidsWelcomeOnly, setKidsWelcomeOnly] = useState(false);
  const [groupGuests, setGroupGuests] = useState([{ guest_name: '' }, { guest_name: '' }]);
  const [groupEventLabel, setGroupEventLabel] = useState('');
  const [groupCapsInitialized, setGroupCapsInitialized] = useState(false);

  // Note: activeBarberId is defined here to be used in queries
  const tempBarberId = bookingState?.barberId || urlBarberId;
  const activeBarberId = tempBarberId;

  // Fetch services (Context Aware)
  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['services', bookingState?.shopId, bookingState?.context, activeBarberId],
    queryFn: async () => {
      const shopId = bookingState?.shopId || urlShopId;
      const isIndependent = context === 'independent' || bookingState?.context === 'independent';

      // 1. Shop Context: Fetch services owned by the Shop
      if (shopId) {
        return sovereign.entities.Service.filter({ shop_id: shopId });
      }

      // 2. Independent Context: Fetch services owned by the Barber
      if (isIndependent && activeBarberId) {
        return sovereign.entities.Service.filter({ barber_id: activeBarberId });
      }

      // 3. Generic Context: Fetch ALL services for browsing
      return sovereign.entities.Service.list();
    },
    enabled: true // Always enabled to support generic browsing
  });

  // Core Integrity: User must be authenticated
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => sovereign.auth.me().catch(() => null)
  });

  // GUARD: Context Resolution
  const [isContextValidating, setIsContextValidating] = useState(false);

  useEffect(() => {
    // Only run if we have a barber but no resolved shop context AND not explicitly independent
    // OR if we have a shopId but need to validate it
    if (!tempBarberId) return;

    // If we are already validating, skip
    if (isContextValidating) return;

    const validateContext = async () => {
      // Skip if this is a generic shop booking (no barberId) or results page
      if (!tempBarberId) return;

      setIsContextValidating(true);
      try {
        const barber = await sovereign.entities.Barber.get(tempBarberId);
        // shop_members has no status column; filter only by barber_id so memberships are found
        const memberships = await sovereign.entities.ShopMember.filter({ barber_id: tempBarberId });

        const isIndependent = barber.is_independent;
        const hasShops = memberships.length > 0;
        const targetShopId = urlShopId || bookingState?.shopId;
        const targetContext = context || bookingState?.context;

        const barberData = barber.data || barber;
        const modes = getServiceLocationModes(barberData);
        const wantsMobile =
          locationType === 'mobile' ||
          (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('location') === 'mobile');

        // At-home-only barbers (including VIP mobile specialists) never use shop booking context
        if (modes.mobile_only || wantsMobile) {
          if (targetShopId || bookingState?.shopId) {
            updateBooking({ ...(bookingState || {}), shopId: undefined, context: 'independent' });
          }
          return;
        }

        // Case A: Target is Shop
        if (targetShopId) {
          const isValid = memberships.some(m => m.shop_id === targetShopId);
          if (!isValid) {
            toast.error("This barber is no longer at this location.");
            navigate(createPageUrl(`BarberProfile?id=${tempBarberId}`));
            return;
          }
          // Valid Shop Context
          return;
        }

        // Case B: Target is Independent
        if (targetContext === 'independent') {
          if (!isIndependent) {
            toast.error("This barber does not offer independent services.");
            navigate(createPageUrl(`BarberProfile?id=${tempBarberId}`));
            return;
          }
          // Valid Independent Context
          return;
        }

        // Case C: Ambiguous (No target set)
        // Auto-resolve single context
        if (hasShops && !isIndependent && memberships.length === 1) {
          const shopId = memberships[0].shop_id;
          updateBooking({ ...bookingState, shopId });
          // We let the flow continue, the state update will trigger re-render
          return;
        }

        if (!hasShops && isIndependent) {
          // Implicit independent
          return;
        }

        // If we are here, it's ambiguous (Hybrid or Multi-Shop)
        // Force redirect to Profile to choose
        // toast.info("Please select a location to book.");
        // navigate(createPageUrl(`BarberProfile?id=${tempBarberId}`));

        // To prevent infinite loop if Profile redirects back here without params,
        // Profile MUST ensure params are set.
        // But we should check if we just came from there?
        // For safety, we redirect.
        if (hasShops || isIndependent) {
          toast.info("Please select a location.");
          navigate(createPageUrl(`BarberProfile?id=${tempBarberId}`));
        } else {
          // Barber has no context at all? Dead end.
          toast.error("This barber is not currently accepting bookings.");
          navigate(createPageUrl('Home'));
        }

      } catch (e) {
        console.error("Context validation error", e);
      } finally {
        setIsContextValidating(false);
      }
    };

    validateContext();
  }, [tempBarberId, urlShopId, context, bookingState?.shopId, bookingState?.context, locationType]);

  const { data: staffConfig } = useQuery({
    queryKey: ['staffConfig', tempBarberId, bookingState?.shopId],
    queryFn: async () => {
      if (!tempBarberId) return null;

      let member = null;
      const shopId = bookingState?.shopId || urlShopId;

      // Context Resolution: If Shop ID is known, find specific member record
      if (shopId) {
        const members = await sovereign.entities.ShopMember.filter({ barber_id: tempBarberId, shop_id: shopId });
        member = members[0];
      } else {
        if (context !== 'independent') {
          // Fallback fetch if auto-resolve hasn't happened yet or failed
          const members = await sovereign.entities.ShopMember.filter({ barber_id: tempBarberId });
          member = members[0];
        }
      }

      // If independent, we have no shop member record, but we are "enabled" by default for our own services.
      if (!member) return { member: null, configs: [] };

      const configs = await sovereign.entities.StaffServiceConfig.filter({ shop_member_id: member.id });
      return { member, configs };
    },
    enabled: !!tempBarberId && !isContextValidating
  });

  // Filter Services by Capability (Role/Config)
  const availableServices = React.useMemo(() => {
    if (!services.length) return [];

    // If no specific barber, show all shop services (Any Professional)
    if (!activeBarberId) return services;

    // If Independent context, assume all owned services are allowed
    if (!staffConfig?.member) return services;

    // Shop Context: Filter based on Config
    return services.filter(service => {
      const config = staffConfig.configs.find(c => c.service_id === service.id);

      // CAPABILITY RULE: 
      // If config exists, respect `is_enabled`.
      // If config does NOT exist, default to TRUE (Staff can perform shop services unless disabled).
      if (config) {
        return config.is_enabled;
      }
      return true;
    });
  }, [services, activeBarberId, staffConfig]);

  // Ensure selected services remain valid against availability
  useEffect(() => {
    if (selectedServices.length > 0 && availableServices.length > 0) {
      const validIds = selectedServices.filter(id => availableServices.some(s => s.id === id));
      if (validIds.length !== selectedServices.length) {
        setSelectedServices(validIds);
      }
    }
  }, [availableServices, selectedServices]);

  // Fetch barbers (always enabled to show provider names)
  const { data: allBarbers = [], isLoading: isLoadingBarbers, isError: _barbersListError } = useQuery({
    queryKey: ['barbers'],
    queryFn: async () => {
      try {
        const list = await sovereign.entities.Barber.list();
        return Array.isArray(list) ? list : [];
      } catch {
        return [];
      }
    },
    enabled: true,
    retry: 3,
    retryDelay: (i) => (i + 1) * 1000
  });

  const { data: bookingShops = [] } = useQuery({
    queryKey: ['explore-shops'],
    queryFn: async () => {
      try {
        const list = await sovereign.entities.Shop.list();
        return Array.isArray(list) ? list : [];
      } catch {
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  const bookingShopById = React.useMemo(() => {
    const map = {};
    for (const s of bookingShops) {
      map[s.id] = {
        ...s,
        spoken_languages: parseSpokenLanguages(s.spoken_languages),
        children_friendly: parseChildrenFriendly(s.children_friendly),
      };
    }
    return map;
  }, [bookingShops]);

  const { data: languageOptions = FALLBACK_LANGUAGE_OPTIONS } = useQuery({
    queryKey: ['language-options'],
    queryFn: () => sovereign.languages.getOptions(),
    staleTime: 1000 * 60 * 60,
  });

  // Fetch specific barber if ID is present
  const { data: selectedBarber, isError: _selectedBarberError, isFetched: selectedBarberFetched } = useQuery({
    queryKey: ['barber', activeBarberId],
    queryFn: async () => {
      if (!activeBarberId) return null;
      try {
        return await sovereign.entities.Barber.get(activeBarberId);
      } catch {
        return null;
      }
    },
    enabled: !!activeBarberId,
    retry: 2
  });

  const activeShopId = bookingState?.shopId || urlShopId;
  const bookingContext = context || bookingState?.context;
  const isShopContext = isShopBookingContext(activeShopId, bookingContext);

  const { data: shopLocationSettings } = useQuery({
    queryKey: ['shop-service-locations', activeShopId],
    queryFn: () => sovereign.serviceLocation.getShop(activeShopId),
    enabled: !!activeShopId,
    staleTime: 1000 * 60 * 5,
  });

  const normalizedSelectedBarber = React.useMemo(() => {
    if (!selectedBarber) return null;
    const nested = selectedBarber.data || {};
    return {
      ...selectedBarber,
      ...nested,
      id: selectedBarber.id ?? nested.id,
      offers_shop_service: nested.offers_shop_service ?? selectedBarber.offers_shop_service,
      offers_mobile_service: nested.offers_mobile_service ?? selectedBarber.offers_mobile_service,
      is_vip: nested.is_vip ?? selectedBarber.is_vip,
    };
  }, [selectedBarber]);

  const barberServiceModes = React.useMemo(
    () => getServiceLocationModes(normalizedSelectedBarber),
    [normalizedSelectedBarber]
  );

  const effectiveServiceModes = React.useMemo(() => {
    if (isShopContext && shopLocationSettings && normalizedSelectedBarber) {
      return getShopBookingLocationModes(normalizedSelectedBarber, shopLocationSettings);
    }
    if (isShopContext && shopLocationSettings && !normalizedSelectedBarber) {
      return getServiceLocationModes(shopLocationSettings);
    }
    return barberServiceModes;
  }, [isShopContext, shopLocationSettings, normalizedSelectedBarber, barberServiceModes]);

  React.useEffect(() => {
    if (!normalizedSelectedBarber && !isShopContext) return;
    const modes = effectiveServiceModes;
    if (isShopContext && modes.shop_only) {
      setLocationType('shop');
      return;
    }
    if (!normalizedSelectedBarber) return;
    const barberModes = getServiceLocationModes(normalizedSelectedBarber);
    if (locationType === 'mobile' && !modes.mobile) {
      setLocationType(modes.shop ? 'shop' : 'mobile');
      toast.message('This barber only offers in-shop visits');
    } else if (locationType === 'shop' && !modes.shop && modes.mobile) {
      setLocationType('mobile');
      toast.message('This barber only offers at-home visits');
    } else if (locationType === 'any') {
      if (barberModes.mobile_only) setLocationType('mobile');
      else if (barberModes.shop_only || (isShopContext && modes.shop_only)) setLocationType('shop');
    }
  }, [
    normalizedSelectedBarber?.id,
    normalizedSelectedBarber?.offers_shop_service,
    normalizedSelectedBarber?.offers_mobile_service,
    isShopContext,
    shopLocationSettings?.offers_shop_service,
    shopLocationSettings?.offers_mobile_service,
    effectiveServiceModes,
    locationType,
  ]);

  // Fetch shifts for this barber to determine availability
  // If no activeBarberId (generic booking), we fetch ALL shifts for the shop context
  const { data: barberShifts = [] } = useQuery({
    queryKey: ['shifts', activeBarberId, bookingState?.shopId],
    queryFn: async () => {
      if (activeBarberId) {
        return sovereign.entities.Shift.filter({ barber_id: activeBarberId });
      }
      // If generic booking in Shop Context, fetch all shop shifts
      if (bookingState?.shopId) {
        return sovereign.entities.Shift.filter({ shop_id: bookingState.shopId });
      }
      // If totally generic (Explore mode), we can't easily fetch ALL shifts in system efficiently.
      // Fallback: Return empty and let logic use default 9-6 or maybe a subset.
      return [];
    },
    enabled: true // Always try to fetch shifts if we can
  });

  // Fetch time blocks (time off)
  const { data: barberTimeOff = [] } = useQuery({
    queryKey: ['timeblocks', activeBarberId],
    queryFn: async () => {
      if (!activeBarberId) return [];
      return sovereign.entities.TimeBlock.filter({ barber_id: activeBarberId });
    },
    enabled: !!activeBarberId
  });

  // Fetch Pricing Rules (Platform Commission)
  const { data: pricingRules = [] } = useQuery({
    queryKey: ['pricingRules'],
    queryFn: () => sovereign.entities.PricingRule.list()
  });

  const activePricingRule = pricingRules.find(r => r.is_active) || {
    commission_freelancer: 0.10, // Default 10%
    commission_shop: 0.05 // Default 5%
  };

  // PHASE 3: Fetch Existing Bookings for Availability Check
  const { data: existingBookings = [] } = useQuery({
    queryKey: ['existing-bookings', activeBarberId, selectedDate],
    queryFn: async () => {
      if (!activeBarberId || !selectedDate) return [];
      const dateStr = format(selectedDate, 'PPP');
      // Fetch bookings for this barber on this day
      // Note: Ideally backend supports date range filtering. 
      // Here we fetch active bookings and filter client-side for precision.
      const bookings = await sovereign.entities.Booking.filter({
        barber_id: activeBarberId
      });

      return bookings.filter(b =>
        b.status !== 'cancelled' &&
        b.status !== 'no_show' &&
        b.date_text === dateStr // strict date match
      );
    },
    enabled: !!activeBarberId && !!selectedDate
  });

  // Helper to get effective price/duration
  const getServiceDetails = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return { duration: 0, price: 0, name: '', category: '' };

    const serviceData = service.data || service;
    const baseMinutes = serviceData.duration_minutes || serviceData.duration_min || parseInt((serviceData.duration_text || '0').match(/\d+/)?.[0] || 0);
    const baseAmount = serviceData.price || parseFloat((serviceData.price_text || '0').replace(/[^0-9.]/g, '') || 0);

    if (staffConfig?.configs) {
      const config = staffConfig.configs.find(c => c.service_id === serviceId);
      if (config) {
        return {
          duration: config.custom_duration || baseMinutes,
          price: config.custom_price || baseAmount,
          name: serviceData.name,
          category: serviceData.category
        };
      }
    }
    return { duration: baseMinutes, price: baseAmount, name: serviceData.name, category: serviceData.category };
  };

  // Calculate totals (local fallback when quote unavailable)
  const totalDurationLocal = selectedServices.reduce((sum, serviceId) => sum + getServiceDetails(serviceId).duration, 0);
  const basePriceLocal = selectedServices.reduce((sum, serviceId) => sum + getServiceDetails(serviceId).price, 0);

  const shopIdForQuote = bookingState?.shopId || urlShopId;
  const promoForQuote = appliedPromotion?.code?.trim() || null;

  const { data: groupBookingCaps } = useQuery({
    queryKey: ['barber-group-booking', activeBarberId],
    queryFn: () => sovereign.groupBooking.getBarber(activeBarberId),
    enabled: !!activeBarberId && groupMode,
  });

  React.useEffect(() => {
    if (!groupMode || !groupBookingCaps || groupCapsInitialized) return;
    const min = groupBookingCaps.min_party ?? 2;
    setGroupGuests(Array.from({ length: min }, () => ({ guest_name: '' })));
    setGroupCapsInitialized(true);
    if (!groupBookingCaps.offers_group_booking) {
      toast.error('This barber has not enabled group bookings. Choose another professional or book individually.');
    }
  }, [groupMode, groupBookingCaps, groupCapsInitialized]);

  const groupModeActive =
    groupMode && groupBookingCaps?.offers_group_booking && groupGuests.length >= (groupBookingCaps.min_party ?? 2);

  const { data: groupQuote, refetch: _refetchGroupQuote, isFetching: groupQuoteLoading } = useQuery({
    queryKey: [
      'group-booking-quote',
      activeBarberId,
      shopIdForQuote,
      selectedServices.slice().sort().join(','),
      groupGuests.length,
      promoForQuote,
    ],
    queryFn: () =>
      sovereign.groupBooking.quote({
        barber_id: activeBarberId,
        shop_id: shopIdForQuote || null,
        shop_member_id: shopIdForQuote ? staffConfig?.member?.id : null,
        service_ids: selectedServices,
        guests: groupGuests,
        promo_code: promoForQuote,
        context_type: shopIdForQuote ? 'shop' : 'independent',
      }),
    enabled:
      groupModeActive &&
      selectedServices.length > 0 &&
      (!shopIdForQuote || !!staffConfig?.member?.id),
    staleTime: 30_000,
  });

  const { data: bookingOffers, isLoading: offersLoading } = useQuery({
    queryKey: [
      'pricing-offers',
      selectedServices.slice().sort().join(','),
      activeBarberId,
      shopIdForQuote,
      staffConfig?.member?.id,
    ],
    queryFn: () =>
      sovereign.pricing.getOffers({
        service_ids: selectedServices,
        barber_id: activeBarberId || undefined,
        shop_id: shopIdForQuote || undefined,
        shop_member_id: shopIdForQuote ? staffConfig?.member?.id : undefined,
      }),
    enabled: !!(shopIdForQuote || activeBarberId),
    staleTime: 20_000,
  });

  const { data: priceQuote, refetch: refetchPriceQuote } = useQuery({
    queryKey: [
      'pricing-quote',
      selectedServices.slice().sort().join(','),
      activeBarberId,
      shopIdForQuote,
      staffConfig?.member?.id,
      promoForQuote,
    ],
    queryFn: () =>
      sovereign.pricing.quote({
        service_ids: selectedServices,
        barber_id: activeBarberId,
        shop_id: shopIdForQuote || null,
        shop_member_id: shopIdForQuote ? staffConfig?.member?.id : null,
        promo_code: promoForQuote,
        context_type: shopIdForQuote ? 'shop' : 'independent',
      }),
    enabled:
      !!activeBarberId &&
      selectedServices.length > 0 &&
      (!shopIdForQuote || !!staffConfig?.member?.id),
    staleTime: 30_000,
  });

  const totalDuration = groupModeActive
    ? (groupQuote?.total_duration_minutes ?? totalDurationLocal * groupGuests.length)
    : (priceQuote?.total_duration_minutes ?? totalDurationLocal);
  const basePrice = groupModeActive
    ? (groupQuote?.group_subtotal ?? basePriceLocal * groupGuests.length)
    : (priceQuote?.sum_price ?? basePriceLocal);
  const comboSavings = groupModeActive ? 0 : (priceQuote?.combo_savings ?? 0);
  const subtotalAfterCombo = groupModeActive
    ? (groupQuote?.group_subtotal ?? basePrice)
    : (priceQuote?.subtotal_after_combo ?? basePriceLocal);
  const bundleMatch = groupModeActive ? null : (priceQuote?.bundle ?? null);

  const calculateDiscount = () => {
    if (groupModeActive) {
      const groupDisc = groupQuote?.group_discount_amount ?? 0;
      const promoDisc = groupQuote?.promo?.discount_amount ?? 0;
      return groupDisc + promoDisc;
    }
    if (priceQuote?.promo?.discount_amount != null) return priceQuote.promo.discount_amount;
    if (!appliedPromotion) return 0;
    const fromServer =
      typeof appliedPromotion.discount_amount === 'number' && Number.isFinite(appliedPromotion.discount_amount)
        ? appliedPromotion.discount_amount
        : null;
    if (fromServer != null) return fromServer;

    const discountText = appliedPromotion.discount_text || '';
    const amount = parseFloat(discountText.replace(/[^0-9.]/g, '') || 0);

    if (discountText.includes('%')) {
      return (subtotalAfterCombo * amount) / 100;
    }
    return amount;
  };

  const promoDiscountAmount = calculateDiscount();
  const totalPrice = groupModeActive
    ? (groupQuote?.final_price ?? Math.max(0, subtotalAfterCombo - promoDiscountAmount))
    : (priceQuote?.final_price ?? Math.max(0, subtotalAfterCombo - promoDiscountAmount));

  const atHomeVisitForQuote = Boolean(
    locationType === 'mobile' ||
    (normalizedSelectedBarber && getServiceLocationModes(normalizedSelectedBarber).mobile_only),
  );

  const travelContextShopId = (() => {
    const shopId = bookingState?.shopId || urlShopId;
    const isIndependent = context === 'independent' || bookingState?.context === 'independent';
    if (atHomeVisitForQuote || isIndependent) return null;
    return shopId || null;
  })();

  const {
    data: travelQuote,
    isLoading: travelQuoteLoading,
    isFetching: travelQuoteFetching,
  } = useQuery({
    queryKey: [
      'travel-quote',
      activeBarberId,
      travelContextShopId,
      context || bookingState?.context,
      address.trim(),
      addressCoords?.latitude,
      addressCoords?.longitude,
    ],
    queryFn: () =>
      sovereign.atHomeService.quote({
        barber_id: activeBarberId,
        shop_id: travelContextShopId || undefined,
        context_type: travelContextShopId ? 'shop' : 'independent',
        address: address.trim(),
        latitude: addressCoords?.latitude,
        longitude: addressCoords?.longitude,
      }),
    enabled: !!activeBarberId && atHomeVisitForQuote && address.trim().length >= 8,
    staleTime: 30_000,
    retry: 1,
  });

  const travelFeeAmount = atHomeVisitForQuote ? (travelQuote?.travel_fee ?? 0) : 0;
  const travelOutOfArea =
    travelQuote?.configured === true && travelQuote?.in_service_area === false;
  const grandTotal = totalPrice + travelFeeAmount;

  const { data: loyaltyMe } = useQuery({
    queryKey: ['loyalty-me', currentUser?.id],
    queryFn: () => sovereign.loyalty.getMe(),
    enabled: !!currentUser?.id,
  });

  const { data: loyaltyEarnPreview } = useQuery({
    queryKey: ['loyalty-preview', grandTotal, loyaltyMe?.tier],
    queryFn: () => sovereign.loyalty.previewEarn(grandTotal, loyaltyMe?.tier ?? 'Bronze'),
    enabled: grandTotal >= 5,
  });

  const pointsEarnedPreview = loyaltyEarnPreview?.points_earned ?? 0;
  const loyaltyRewardCodes = loyaltyMe?.active_reward_codes ?? [];

  // Calculate Financial Breakdown (Commission & Payouts)
  const financialBreakdown = React.useMemo(() => {
    const isShopContext = !!(bookingState?.shopId || urlShopId);
    const commissionRate = isShopContext
      ? (activePricingRule.commission_shop || 0.05)
      : (activePricingRule.commission_freelancer || 0.10);

    const platformFee = grandTotal * commissionRate;
    const taxRate = 0; // Simplified for MVP (assume baked in or 0)
    const taxAmount = grandTotal * taxRate;

    const providerPayout = Math.max(0, grandTotal - platformFee - taxAmount);

    return {
      base_price: basePrice,
      subtotal_after_combo: subtotalAfterCombo,
      combo_savings: comboSavings,
      bundle_id: bundleMatch?.bundle_id ?? null,
      discount_amount: promoDiscountAmount,
      travel_fee: travelFeeAmount,
      travel_distance_km: travelQuote?.distance_km ?? null,
      travel_zone_label: travelQuote?.zone_label ?? null,
      final_price: grandTotal,
      platform_fee: platformFee,
      tax_amount: taxAmount,
      provider_payout: providerPayout,
      commission_rate_snapshot: commissionRate,
      currency: 'USD'
    };
  }, [basePrice, subtotalAfterCombo, comboSavings, bundleMatch, promoDiscountAmount, grandTotal, travelFeeAmount, travelQuote, bookingState?.shopId, urlShopId, activePricingRule]);

  const shopIdForCash = bookingState?.shopId || urlShopId;
  const { data: cashAvailability } = useQuery({
    queryKey: ['cash-availability', activeBarberId, shopIdForCash],
    queryFn: () => sovereign.providerWallet.getCashAvailability(activeBarberId, shopIdForCash || undefined),
    enabled: !!activeBarberId && isSpecificBarberBooking,
  });

  const { data: paymentProtectionPreview } = useQuery({
    queryKey: ['payment-protection-preview', activeBarberId, shopIdForCash, grandTotal, paymentMethod],
    queryFn: () =>
      sovereign.paymentProtection.getPreview({
        barberId: activeBarberId,
        shopId: shopIdForCash || undefined,
        totalPrice: grandTotal,
        paymentMethod,
      }),
    enabled: !!activeBarberId && isSpecificBarberBooking && grandTotal > 0,
  });

  const isGuestCheckout = !currentUser?.id;
  const guestBookingBlock = isGuestBookingBlocked(
    paymentProtectionPreview,
    cashAvailability,
    paymentMethod,
    !!currentUser?.id
  );

  useEffect(() => {
    saveGuestContact(guestContact);
  }, [guestContact]);

  useEffect(() => {
    if (isGuestCheckout && cashAvailability?.accepts_cash) {
      setPaymentMethod('cash_at_store');
    }
  }, [isGuestCheckout, cashAvailability?.accepts_cash]);

  const handleApplyPromo = async () => {
    if (!promoCode) return;
    setPromoError('');

    try {
      if (!currentUser?.id) {
        setPromoError('Log in to apply a promo code');
        setAppliedPromotion(null);
        return;
      }
      if (!activeBarberId) {
        setPromoError('Select a barber first');
        setAppliedPromotion(null);
        return;
      }
      const shopId = bookingState?.shopId || urlShopId;
      const quote = await sovereign.pricing.quote({
        service_ids: selectedServices,
        barber_id: activeBarberId,
        shop_id: shopId || null,
        shop_member_id: shopId ? staffConfig?.member?.id : null,
        promo_code: promoCode.trim(),
        user_id: currentUser.id,
        context_type: shopId ? 'shop' : 'independent',
      });
      if (quote.promo) {
        setAppliedPromotion({
          code: quote.promo.code,
          discount_text: quote.promo.discount_text,
          discount_amount: quote.promo.discount_amount,
        });
        setPromoError('');
        refetchPriceQuote();
      } else {
        setPromoError('Invalid promo code');
        setAppliedPromotion(null);
      }
    } catch (e) {
      setPromoError(e.message || 'Failed to validate code');
      setAppliedPromotion(null);
    }
  };

  // Filter and sort barbers
  const filteredBarbers = React.useMemo(() => {
    if (currentStep < 3) return [];

    let filtered = allBarbers.filter(barber => {
      const barberData = barber.data || barber;
      // Filter by minimum rating
      if (minRating > 0 && (barberData.rating || 0) < minRating) return false;

      // Filter by acceptance type
      if (acceptanceType === 'auto' && !barberData.auto_accept) return false;
      if (acceptanceType === 'manual' && barberData.auto_accept) return false;

      // Filter by provider type
      if (providerType === 'freelancer' && barberData.type === 'shop') return false;
      if (providerType === 'shop' && barberData.type !== 'shop') return false;

      // Filter by location type (shop vs at-home)
      if (locationType === 'shop' && !offersShopService(barberData)) return false;
      if (locationType === 'mobile' && !offersMobileService(barberData)) return false;

      // Group booking: only barbers who accept group parties
      if (groupMode && !barberData.offers_group_booking) return false;

      if (preferredLanguage) {
        const barberLangs = parseSpokenLanguages(barberData.spoken_languages);
        const shopLangs = barberData.shop_id ? bookingShopById[barberData.shop_id]?.spoken_languages || [] : [];
        if (!matchesLanguageFilter(barberLangs, shopLangs, [preferredLanguage])) return false;
      }

      if (kidsWelcomeOnly) {
        const shopFriendly = barberData.shop_id ? bookingShopById[barberData.shop_id]?.children_friendly : false;
        if (!matchesChildrenFriendlyFilter(barberData.children_friendly, shopFriendly, true)) return false;
      }

      return true;
    });

    // Calculate scores and sort
    filtered = filtered.map(barber => {
      const barberData = barber.data || barber;
      const rating = barberData.rating || 0;
      const reviewCount = barberData.review_count || 0;
      const estimatedPrice = totalPrice;

      const barberLat = barberData.latitude;
      const barberLng = barberData.longitude;
      let barberDistance = null;
      if (addressCoords?.latitude != null && addressCoords?.longitude != null && barberLat != null && barberLng != null) {
        barberDistance = roundKm(
          distanceKm(addressCoords.latitude, addressCoords.longitude, barberLat, barberLng)
        );
      }

      const distanceScore =
        barberDistance != null ? Math.max(0, 1 - barberDistance / 50) : address ? 0.35 : 0.5;
      const ratingScore = rating / 5;
      const reviewScore = Math.min(reviewCount / 100, 1);
      const priceScore = estimatedPrice > 0 ? (1 - Math.min(estimatedPrice / 200, 1)) : 0.5;

      const globalScore = (ratingScore * 0.4 + reviewScore * 0.2 + distanceScore * 0.2 + priceScore * 0.2) * 100;

      return {
        ...barber,
        distance: barberDistance ?? 999,
        distance_km: barberDistance,
        estimatedPrice,
        globalScore
      };
    });

    // Sort based on preference
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.estimatedPrice - b.estimatedPrice;
        case 'distance':
          return (a.distance_km ?? 999) - (b.distance_km ?? 999);
        case 'rating':
          return b.rating - a.rating;
        case 'global_score':
        default:
          return b.globalScore - a.globalScore;
      }
    });

    return filtered;
  }, [allBarbers, minRating, sortBy, address, addressCoords, totalPrice, currentStep, acceptanceType, providerType, locationType, preferredLanguage, kidsWelcomeOnly, bookingShopById, groupMode]);

  const handleServiceToggle = (serviceId) => {
    const isSelecting = !selectedServices.includes(serviceId);

    if (isSelecting) {
      sovereign.analytics.track({
        eventName: 'select_service',
        properties: {
          service_id: serviceId,
          barber_id: activeBarberId
        }
      });
    }

    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleAddServices = (serviceIds) => {
    if (!Array.isArray(serviceIds) || serviceIds.length === 0) return;
    setSelectedServices((prev) => [...new Set([...prev, ...serviceIds])]);
    toast.success('Added to your booking');
  };

  const handleAddBundle = (serviceIds) => {
    if (!Array.isArray(serviceIds) || serviceIds.length === 0) return;
    setSelectedServices([...new Set(serviceIds)]);
    toast.success('Combo added to your booking');
  };

  const handleApplyPromoFromOffer = async (code) => {
    if (!code) return;
    setPromoCode(code);
    if (!currentUser?.id || !activeBarberId || selectedServices.length === 0) {
      toast.info(`Promo ${code} saved, we'll apply it at checkout`);
      return;
    }
    try {
      const shopId = bookingState?.shopId || urlShopId;
      const quote = await sovereign.pricing.quote({
        service_ids: selectedServices,
        barber_id: activeBarberId,
        shop_id: shopId || null,
        shop_member_id: shopId ? staffConfig?.member?.id : null,
        promo_code: code,
        context_type: shopId ? 'shop' : 'independent',
      });
      if (quote.promo) {
        setAppliedPromotion({
          code: quote.promo.code,
          discount_text: quote.promo.discount_text,
          discount_amount: quote.promo.discount_amount,
        });
        setPromoError('');
        toast.success(`${code} applied`);
        refetchPriceQuote();
      }
    } catch {
      toast.info(`Promo ${code} saved, apply at checkout`);
    }
  };

  const canProceed = () => {
    if (isSpecificBarberBooking) {
      switch (currentStep) {
        case 0: return selectedServices.length > 0;
        case 1: return selectedDate && selectedTime;
        case 2: return false; // Final step (Confirmation)
        default: return false;
      }
    } else {
      switch (currentStep) {
        case 0: return selectedServices.length > 0;
        case 1: return selectedDate && selectedTime;
        case 2: return true; // Preferences are optional
        case 3: return false; // Final step
        default: return false;
      }
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1 && canProceed()) {
      const nextStep = currentStep + 1;
      sovereign.analytics.track({
        eventName: 'view_booking_step',
        properties: {
          step_index: nextStep,
          step_name: STEPS[nextStep],
          barber_id: activeBarberId,
          context_type: context || bookingState?.context || (bookingState?.shopId ? 'shop' : 'unknown')
        }
      });
      setCurrentStep(nextStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Adjust step index for rendering content when in specific barber mode
  // If specific barber:
  // Step 0: Services (same)
  // Step 1: Date & Time (same)
  // Step 2: Confirmation (renders as Step 3 content in original logic, or we need to map it)

  // To keep render logic simple, let's map the visual step to the logical content step
  const renderStepContent = () => {
    if (isSpecificBarberBooking) {
      if (currentStep === 0) return 'services';
      if (currentStep === 1) return 'datetime';
      if (currentStep === 2) return 'confirmation';
    } else {
      if (currentStep === 0) return 'services';
      if (currentStep === 1) return 'datetime';
      if (currentStep === 2) return 'preferences';
      if (currentStep === 3) return 'results';
    }
    return 'services';
  };

  const currentContent = renderStepContent();

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [waitlistDialogOpen, setWaitlistDialogOpen] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState(null);
  const [confirmedPaymentStep, setConfirmedPaymentStep] = useState('full_payment');
  const [confirmedBookingMeta, setConfirmedBookingMeta] = useState(null);

  const createBookingMutation = useMutation({
    mutationFn: (data) => sovereign.entities.Booking.create(data),
    onSuccess: async (newBooking) => {
      setConfirmedBookingMeta({
        isGroup: groupModeActive,
        isAtHome: locationType === 'mobile',
        partySize: groupModeActive ? groupGuests.length : null,
        eventLabel: groupEventLabel || null,
        address: locationType === 'mobile' ? address?.trim() : null,
      });
      // Send Notifications

      // 1. To Client (Current User)
      // We assume current user is logged in, but if not we might not have ID.
      // Ideally we'd have the user object here. 
      // For now we'll skip client ID if not available, or assume auth context is active.

      // 2. To Barber (Provider)
      if (selectedBarber) {
        // Notify the barber if they have a linked user account or email
        const barberUserId = selectedBarber.user_id; // Added field
        const barberEmail = selectedBarber.email;     // Added field

        if (barberUserId || barberEmail) {
          await sendNotification({
            userId: barberUserId,
            email: barberEmail,
            title: "New Booking Request",
            message: `New request from client for ${format(selectedDate, 'PPP')} at ${selectedTime}.`,
            type: "booking_request",
            link: createPageUrl(`ProviderBookings`), // Providers view bookings here
            relatedEntityId: newBooking.id
          });
        }

        // Notify the Client (Current User)
        const user = await sovereign.auth.me().catch(() => null);
        if (user) {
          await sendNotification({
            userId: user.id,
            email: user.email,
            title: "Booking Request Sent",
            message: `Your appointment with ${selectedBarber.name} on ${format(selectedDate, 'PPP')} at ${selectedTime} is pending confirmation.`,
            type: "booking_request",
            link: createPageUrl(`UserBookings`),
            relatedEntityId: newBooking.id
          });
        }
      }

      // Show success modal instead of navigating
      setConfirmedBookingId(newBooking.id);
      setConfirmedPaymentStep(paymentProtectionPreview?.next_step || 'full_payment');
      setShowSuccessModal(true);

      // Trigger confetti
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };
      const randomInRange = (min, max) => Math.random() * (max - min) + min;
      const interval = setInterval(function () {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
    },
    onError: (error) => {
      const msg = error?.message || 'Failed to create booking';
      if (/taken|unavailable|chair|slot is/i.test(msg)) {
        setWaitlistDialogOpen(true);
        toast.error('This time slot is no longer available');
      } else {
        toast.error(msg);
      }
    },
  });

  const createGuestBookingMutation = useMutation({
    mutationFn: (data) => sovereign.bookings.createGuest(data),
    onSuccess: async (newBooking) => {
      if (newBooking.guest_access_token) {
        setConfirmedGuestToken(newBooking.guest_access_token);
        saveGuestBookingToken(newBooking.id, newBooking.guest_access_token);
      }
      setConfirmedBookingMeta({
        isGroup: groupModeActive,
        isAtHome: locationType === 'mobile',
        partySize: groupModeActive ? groupGuests.length : null,
        eventLabel: groupEventLabel || null,
        address: locationType === 'mobile' ? address?.trim() : null,
      });
      setConfirmedBookingId(newBooking.id);
      setConfirmedPaymentStep('none');
      setShowSuccessModal(true);

      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };
      const randomInRange = (min, max) => Math.random() * (max - min) + min;
      const interval = setInterval(function () {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create booking');
    },
  });

  const createPaymentSessionMutation = useMutation({
    mutationFn: async (bookingId) => {
      try {
        const result = await sovereign.paymentProtection.bookingCheckout(bookingId);
        return { url: result.url, step: result.step };
      } catch {
        const { url } = await sovereign.functions.invoke('create-checkout-session', { bookingId });
        return { url, step: 'full_payment' };
      }
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast.error(`Payment Error: ${  error.message}`);
    }
  });

  const handleConfirmBooking = () => {
    if (!selectedDate || !selectedTime) return;

    // --- PHASE 2: WRITE-TIME INVARIANT ENFORCEMENT ---

    const bookingAsGuest = !currentUser?.id;

    if (bookingAsGuest) {
      const contactErr = validateGuestContact(guestContact);
      if (contactErr) {
        setGuestContactError(contactErr);
        toast.error(contactErr);
        return;
      }
      setGuestContactError('');
      if (guestBookingBlock.blocked) {
        toast.error(guestBookingBlock.reason || 'Sign in required for this booking');
        return;
      }
      if (paymentMethod !== 'cash_at_store') {
        toast.error('Guest bookings use pay-at-shop. Sign in for online payment.');
        return;
      }
    }

    // 2. Barber Identity Check
    if (!activeBarberId) {
      toast.error("System Error: No barber identified. Please restart.");
      return;
    }

    // 3. Context & Location Integrity Check
    if (locationType === 'mobile' && !address?.trim()) {
      toast.error('Please enter your address for at-home service');
      return;
    }

    if (normalizedSelectedBarber && locationType !== 'mobile' && !offersShopService(normalizedSelectedBarber)) {
      toast.error('This barber only offers at-home visits, enter your address');
      return;
    }

    if (locationType === 'mobile' && normalizedSelectedBarber && !offersMobileService(normalizedSelectedBarber)) {
      toast.error('This barber does not offer at-home visits');
      return;
    }

    if (groupMode && groupBookingCaps && !groupBookingCaps.offers_group_booking) {
      toast.error('This barber has not enabled group bookings');
      return;
    }

    if (groupModeActive) {
      const minParty = groupBookingCaps?.min_party ?? 2;
      const maxParty = groupBookingCaps?.max_party ?? 8;
      if (groupGuests.length < minParty || groupGuests.length > maxParty) {
        toast.error(`Group size must be between ${minParty} and ${maxParty} guests`);
        return;
      }
      if (!groupQuote) {
        toast.error('Group price is still loading, please wait a moment and try again');
        return;
      }
      if (selectedServices.length === 0) {
        toast.error('Select at least one service for the group');
        return;
      }
    }

    const mobileOnlyBarber = normalizedSelectedBarber
      ? getServiceLocationModes(normalizedSelectedBarber).mobile_only
      : false;
    const atHomeVisit =
      locationType === 'mobile' || mobileOnlyBarber;

    if (atHomeVisit) {
      if (travelOutOfArea) {
        toast.error(
          travelQuote?.service_radius_km
            ? `This address is outside the ${travelQuote.service_radius_km} km service area`
            : 'This address is outside the service area'
        );
        return;
      }
      if (
        address.trim().length >= 8 &&
        travelQuote?.configured !== false &&
        (travelQuoteLoading || travelQuoteFetching || !travelQuote)
      ) {
        toast.error('Travel fee is still calculating, please wait a moment');
        return;
      }
    }

    // We must have either a valid shop_id OR an explicit independent / at-home context
    const shopId = bookingState?.shopId || urlShopId;
    const isIndependentContext = context === 'independent' || bookingState?.context === 'independent';
    const effectiveShopId = atHomeVisit ? null : shopId;

    // If we have a shopId, we MUST have a resolved shop_member_id (provenance)
    if (effectiveShopId && !staffConfig?.member?.id) {
      toast.error("System Error: Could not verify barber's membership at this shop.");
      return;
    }

    // If no shopId, we MUST be in independent mode (or at-home visit)
    if (!effectiveShopId && !isIndependentContext) {
      if (selectedBarber?.is_independent && !effectiveShopId) {
        // Acceptable implicit independent
      } else if (atHomeVisit) {
        // At-home visit, independent context implied
      } else {
        toast.error("Booking Context Error: Please select a specific location (Shop or Independent).");
        return;
      }
    }

    // --- END INVARIANTS ---

    // Get service names
    const serviceNames = selectedServices
      .map(id => services.find(s => s.id === id)?.data?.name || services.find(s => s.id === id)?.name)
      .filter(Boolean)
      .join(', ');

    const description = appliedPromotion
      ? `Promo Code: ${appliedPromotion.code} applied. Discount: ${appliedPromotion.discount_text}.`
      : '';

    // Create Immutable Snapshot
    const snapshot = {
      services: selectedServices.map((id) => ({ service_id: id, ...getServiceDetails(id) })),
      total_duration: totalDuration,
      total_price: grandTotal,
      base_price: basePrice,
      subtotal_after_combo: subtotalAfterCombo,
      combo_savings: comboSavings,
      travel_fee: travelFeeAmount,
      travel_distance_km: travelQuote?.distance_km ?? null,
      travel_zone_label: travelQuote?.zone_label ?? null,
      bundle: bundleMatch
        ? {
            id: bundleMatch.bundle_id,
            name: bundleMatch.bundle_name,
            combo_price: bundleMatch.combo_price,
          }
        : null,
      applied_promotion: appliedPromotion ? {
        code: appliedPromotion.code,
        discount: appliedPromotion.discount_text,
        id: appliedPromotion.promotion_id || appliedPromotion.id
      } : null
    };

    // Analytics: Confirm Attempt
    sovereign.analytics.track({
      eventName: 'confirm_booking_attempt',
      properties: {
        barber_id: activeBarberId,
        shop_id: effectiveShopId,
        total_price: grandTotal,
        travel_fee: travelFeeAmount,
        service_count: selectedServices.length,
        context_type: effectiveShopId ? 'shop' : 'independent',
        visit_type: atHomeVisit ? 'mobile' : 'shop',
      }
    });

    setConfirmedPaymentMethod(paymentMethod);

    const bookingPayload = {
      // Core Identity
      barber_id: activeBarberId,
      shop_id: effectiveShopId,
      shop_member_id: effectiveShopId ? staffConfig?.member?.id : null,
      service_ids: selectedServices,
      ...(groupModeActive
        ? {
            booking_type: 'group',
            guests: groupGuests,
            group_event_label: groupEventLabel || undefined,
            party_size: groupGuests.length,
          }
        : {}),

      // Display Data
      service_name: serviceNames || 'Barber Service',
      date_text: format(selectedDate, 'PPP'),
      time_text: selectedTime,
      location: atHomeVisit
        ? address.trim()
        : address || selectedBarber?.location || 'Barbershop',
      location_text: atHomeVisit ? address.trim() : undefined,
      visit_type: resolveClientLocationType(
        normalizedSelectedBarber,
        atHomeVisit ? 'mobile' : locationType === 'shop' ? 'shop' : 'shop'
      ),

      // State
      status: 'pending',
      payment_status: 'unpaid',
      payment_method: paymentMethod,

      // Financials (Locked)
      price_at_booking: grandTotal,
      travel_fee_amount: atHomeVisit ? travelFeeAmount : undefined,
      client_latitude: atHomeVisit ? travelQuote?.client_latitude : undefined,
      client_longitude: atHomeVisit ? travelQuote?.client_longitude : undefined,
      duration_at_booking: totalDuration,
      service_snapshot: snapshot,
      financial_breakdown: financialBreakdown,
      discount_code: appliedPromotion?.code || undefined,

      // Metadata
      image_url: selectedBarber?.image_url,
      category: 'upcoming',
      description,

      context_type: effectiveShopId ? 'shop' : 'independent',
      customer_notes: customerNotes,
    };

    if (bookingAsGuest) {
      createGuestBookingMutation.mutate({
        ...bookingPayload,
        guest_name: guestContact.guest_name.trim(),
        guest_phone: guestContact.guest_phone.trim(),
        guest_email: guestContact.guest_email?.trim() || undefined,
      });
      return;
    }

    createBookingMutation.mutate({
      ...bookingPayload,
      client_id: currentUser.id,
    });
  };

  const handleBarberSelect = (barber) => {
    const barberId = barber.id || barber.data?.id || barber;
    const barberData = barber.data || barber;

    if (groupMode && !barberData.offers_group_booking) {
      toast.error('This barber does not offer group bookings. Choose another professional.');
      return;
    }
    if (locationType === 'shop' && !offersShopService(barberData)) {
      toast.error('This barber only offers at-home visits');
      return;
    }
    if (locationType === 'mobile' && !offersMobileService(barberData)) {
      toast.error('This barber does not offer at-home visits');
      return;
    }

    updateBooking({
      barberId,
      selectedServices: selectedServices.map(id => services.find(s => s.id === id)).filter(Boolean),
      selectedDate,
      selectedTime,
      address,
      minRating,
      sortBy,
      acceptanceType
    });

    if (groupMode) {
      const modes = getServiceLocationModes(barberData);
      let url = `BookingFlow?group=1&barberId=${barberId}&step=confirm&context=independent`;
      if (modes.mobile_only || locationType === 'mobile' || !offersShopService(barberData)) {
        url += '&location=mobile';
      } else {
        const shopId = barberData.shop_id || urlShopId || bookingState?.shopId;
        if (shopId) url += `&shopId=${shopId}`;
        url += '&location=shop';
      }
      navigate(createPageUrl(url));
      return;
    }

    navigate(createPageUrl(`BarberProfile?id=${barberId}`));
  };

  const handleUseMyLocation = async () => {
    setIsLoadingLocation(true);
    try {
      if (!navigator.geolocation) {
        toast.error('Geolocation is not supported by your browser');
        setIsLoadingLocation(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const data = await sovereign.atHomeService.reverseGeocode(latitude, longitude);
            setAddress(data.formatted_address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            setAddressCoords({ latitude, longitude });
            persistPreferredLocation({
              formatted_address: data.formatted_address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              latitude,
              longitude,
            });
          } catch {
            setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            setAddressCoords({ latitude, longitude });
            persistPreferredLocation({
              formatted_address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              latitude,
              longitude,
            });
          }
          setIsLoadingLocation(false);
        },
        () => {
          toast.error('Unable to retrieve your location. Please enter your address manually.');
          setIsLoadingLocation(false);
        }
      );
    } catch {
      toast.error('Error accessing location');
      setIsLoadingLocation(false);
    }
  };

  // Auto-select first category when services load
  useEffect(() => {
    if (services.length > 0 && !selectedCategory) {
      const groupedServices = services.reduce((acc, service) => {
        const category = service?.data?.category || service?.category || 'Other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(service);
        return acc;
      }, {});
      const categories = Object.keys(groupedServices);
      if (categories.length > 0) {
        setSelectedCategory(categories[0]);
      }
    }
  }, [services, selectedCategory]);

  // Calculate available time slots based on Shifts, TimeOff, and Existing Bookings
  const getAvailableTimeSlots = () => {
    if (!selectedDate) return [];

    // Generic Booking (Any Professional) - Aggregate Availability
    if (!activeBarberId) {
      // If we have shop shifts, we can try to find open slots
      if (barberShifts.length > 0) {
        // Get all shifts for this day across all staff
        const dayShifts = barberShifts.filter(s => s.day === format(selectedDate, 'EEEE'));
        if (dayShifts.length === 0) return []; // Shop closed?

        // Find union of all time ranges
        // Simple approach: Start from earliest start_time, end at latest end_time
        // And create 30min slots.
        // For each slot, check if at least one shift covers it.

        // Sort shifts by start
        const sorted = [...dayShifts].sort((a, b) => a.start_time.localeCompare(b.start_time));
        const startStr = sorted[0].start_time;

        // Find latest end
        const endStr = dayShifts.reduce((max, s) => s.end_time > max ? s.end_time : max, '00:00');

        const slots = [];
        const current = new Date(`2000-01-01T${startStr}`);
        const end = new Date(`2000-01-01T${endStr}`);

        while (current < end) {
          const timeString = format(current, 'h:mm a');
          slots.push(timeString);
          current.setMinutes(current.getMinutes() + 30);
        }
        return slots;
      }

      // Default fallback
      return [
        '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
        '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'
      ];
    }

    const dayOfWeek = format(selectedDate, 'EEEE');
    const currentShopId = bookingState?.shopId || urlShopId; // Resolved context

    // 1. Find Context-Specific Shift
    // Filter shifts that match the current booking context (Shop ID or Independent)
    const relevantShift = barberShifts.find(s => {
      if (s.day !== dayOfWeek) return false;

      if (currentShopId) {
        return s.shop_id === currentShopId; // Must match shop
      } else {
        return !s.shop_id; // Independent (null shop_id)
      }
    });

    // Strict Availability: If barber has defined shifts but none for this context/day -> Closed
    if (barberShifts.length > 0 && !relevantShift) {
      return [];
    }

    // Fallback for new barbers without shifts: Default 9-6
    const startStr = relevantShift ? relevantShift.start_time : '09:00';
    const endStr = relevantShift ? relevantShift.end_time : '18:00';

    // 2. Generate Slots
    const slots = [];
    const current = new Date(`2000-01-01T${startStr}`);
    const end = new Date(`2000-01-01T${endStr}`);
    const slotDuration = totalDuration || 30; // Use selected service duration or default 30m

    while (current < end) {
      const timeString = format(current, 'h:mm a');

      // Construct precise slot Date objects
      const slotStart = new Date(selectedDate);
      slotStart.setHours(current.getHours(), current.getMinutes(), 0, 0);

      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotStart.getMinutes() + slotDuration);

      // 3. Check TimeBlocks (Global + Context Specific)
      const isBlockedOff = barberTimeOff.some(block => {
        // Rule: Block applies if it is Global (no shop_id) OR matches current Shop Context
        const isRelevantBlock = !block.shop_id || block.shop_id === currentShopId;
        if (!isRelevantBlock) return false;

        const blockStart = new Date(block.start_datetime);
        const blockEnd = new Date(block.end_datetime);
        // Overlap check
        return (slotStart < blockEnd && slotEnd > blockStart);
      });

      // 4. Check Existing Bookings (Global - Physical constraint)
      // A barber cannot be in two places at once, so we check ALL bookings regardless of shop_id
      const isDoubleBooked = existingBookings.some(booking => {
        // Parse booking time (e.g., "3:00 PM")
        // Note: In real app, booking should store ISO start_time/end_time. 
        // Using helper or assuming we have parsed times would be better.
        // Here we rely on strict text match or simple time comparison if format allows.
        // For robustness, let's assume strict 1hr slots or simple collision.

        // Simplest Check: Exact time match
        if (booking.time_text === timeString) return true;

        // Advanced Check: Overlap (if we had durations)
        // ... Phase 4 can improve this. For Phase 3, strict slot match is the baseline.
        return false;
      });

      if (!isBlockedOff && !isDoubleBooked) {
        slots.push(timeString);
      }

      // Step: 30 mins or 1 hour? Defaulting to 30 min intervals for finer granularity
      current.setMinutes(current.getMinutes() + 30);
    }

    return slots;
  };

  const getWaitlistTimeSlots = () => {
    if (!selectedDate || !activeBarberId) return [];

    const dayOfWeek = format(selectedDate, 'EEEE');
    const currentShopId = bookingState?.shopId || urlShopId;
    const relevantShift = barberShifts.find((s) => {
      if (s.day !== dayOfWeek) return false;
      if (currentShopId) return s.shop_id === currentShopId;
      return !s.shop_id;
    });
    if (barberShifts.length > 0 && !relevantShift) return [];

    const startStr = relevantShift ? relevantShift.start_time : '09:00';
    const endStr = relevantShift ? relevantShift.end_time : '18:00';
    const waitlist = [];
    const current = new Date(`2000-01-01T${startStr}`);
    const end = new Date(`2000-01-01T${endStr}`);
    const slotDuration = totalDuration || 30;

    while (current < end) {
      const timeString = format(current, 'h:mm a');
      const slotStart = new Date(selectedDate);
      slotStart.setHours(current.getHours(), current.getMinutes(), 0, 0);
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotStart.getMinutes() + slotDuration);

      const isBlockedOff = barberTimeOff.some((block) => {
        const isRelevantBlock = !block.shop_id || block.shop_id === currentShopId;
        if (!isRelevantBlock) return false;
        const blockStart = new Date(block.start_datetime);
        const blockEnd = new Date(block.end_datetime);
        return slotStart < blockEnd && slotEnd > blockStart;
      });

      const isDoubleBooked = existingBookings.some((booking) => booking.time_text === timeString);

      if (isDoubleBooked && !isBlockedOff) {
        waitlist.push(timeString);
      }

      current.setMinutes(current.getMinutes() + 30);
    }

    return waitlist;
  };

  const localTimeSlots = getAvailableTimeSlots();
  const localWaitlistSlots = getWaitlistTimeSlots();

  const shopIdForSlots = bookingState?.shopId || urlShopId;
  const { data: serverDaySlots, isFetching: slotsLoading } = useQuery({
    queryKey: ['barber-day-slots', activeBarberId, selectedDate?.toISOString?.()?.slice(0, 10), shopIdForSlots, totalDuration],
    queryFn: () =>
      sovereign.bookings.getBarberDaySlots(activeBarberId, {
        date: format(selectedDate, 'yyyy-MM-dd'),
        duration: totalDuration || 30,
        shop_id: shopIdForSlots || undefined,
        context_type: shopIdForSlots ? 'shop' : 'independent',
      }),
    enabled: Boolean(activeBarberId && selectedDate),
    staleTime: 30_000,
  });

  const timeSlots = serverDaySlots?.available ?? localTimeSlots;
  const waitlistTimeSlots = serverDaySlots?.waitlist ?? localWaitlistSlots;

  const handleASAP = async () => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const shopId = bookingState?.shopId || urlShopId;

    const pickNextSlot = (slots, baseDate) => {
      const available = slots?.available ?? [];
      if (available.length === 0) return null;
      const currentHour = baseDate.getHours();
      const nextToday = available.find((slot) => {
        const [time, period] = slot.split(' ');
        let [hours] = time.split(':').map(Number);
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        return hours > currentHour;
      });
      return nextToday ?? available[0];
    };

    try {
      let targetDate = today;
      let slots = await sovereign.bookings.getBarberDaySlots(activeBarberId, {
        date: format(today, 'yyyy-MM-dd'),
        duration: totalDuration || 30,
        shop_id: shopId || undefined,
        context_type: shopId ? 'shop' : 'independent',
      });
      let chosen = pickNextSlot(slots, now);

      if (!chosen) {
        targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() + 1);
        slots = await sovereign.bookings.getBarberDaySlots(activeBarberId, {
          date: format(targetDate, 'yyyy-MM-dd'),
          duration: totalDuration || 30,
          shop_id: shopId || undefined,
          context_type: shopId ? 'shop' : 'independent',
        });
        chosen = slots?.available?.[0] ?? '10:00 AM';
      }

      setSelectedDate(targetDate);
      setSelectedTime(chosen);
    } catch {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      setSelectedDate(tomorrow);
      setSelectedTime('10:00 AM');
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  return (
    <div className="stb-page pb-24 lg:pb-8 stb-page">
      <MetaTags
        title="Book Appointment"
        description="Find and book with the best barbers in your area"
      />

      {/* Progress Header */}
      <div className="sticky top-0 z-30 stb-glass border-b border-border/80 bg-background/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-0.5">Booking</p>
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">Book Appointment</h1>
            </div>
            {currentStep > 0 && currentStep < 3 && !isContextValidating && (
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            )}
          </div>

          {/* Step Indicator, compact on mobile */}
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
            {STEPS.map((step, index) => (
              <React.Fragment key={step}>
                <div className={cn(
                  "flex shrink-0 items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all font-semibold",
                  index === currentStep ? "stb-step-active" :
                    index < currentStep ? "stb-step-done" : "bg-muted/60 text-muted-foreground"
                )}>
                  {index < currentStep ? (
                    <Check className="w-4 h-4 shrink-0" />
                  ) : (
                    <span className={cn(
                      "w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold",
                      index === currentStep ? "bg-primary-foreground/20 text-primary-foreground" : "bg-background/80 text-muted-foreground"
                    )}>
                      {index + 1}
                    </span>
                  )}
                  <span className="text-xs sm:text-sm font-semibold hidden sm:inline">{step}</span>
                  <span className="sr-only sm:hidden">{step}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={cn(
                    "h-0.5 shrink-0 w-4 sm:flex-1 sm:max-w-12",
                    index < currentStep ? "bg-primary" : "bg-muted"
                  )} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden" role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={STEPS.length}>
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        {activeBarberId && selectedBarberFetched && !selectedBarber && !isContextValidating ? (
          <div className="flex flex-col items-center justify-center py-20 min-h-[50vh] text-center">
            <h2 className="text-xl font-bold mb-2">Professional not found</h2>
            <p className="text-muted-foreground mb-4 max-w-md">This barber may no longer be listed or the link is invalid. Choose someone from Find a Barber to continue.</p>
            <Button asChild><Link to={createPageUrl('Explore')}>Find a Barber</Link></Button>
          </div>
        ) : isContextValidating ? (
          <div className="flex flex-col items-center justify-center py-20 min-h-[50vh]">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <h2 className="text-xl font-bold mb-2">Verifying Availability...</h2>
            <p className="text-muted-foreground">Checking barber schedule and location</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* STEP 1: Services */}
            {currentContent === 'services' && (
              <BookingServicesStep
                selectedBarber={selectedBarber}
                servicesLoading={servicesLoading}
                services={services}
                availableServices={availableServices}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                selectedServices={selectedServices}
                onServiceToggle={handleServiceToggle}
                getServiceDetails={getServiceDetails}
                activeBarberId={activeBarberId}
                allBarbers={allBarbers}
                totalDuration={totalDuration}
                totalPrice={totalPrice}
                comboSavings={comboSavings}
                bundleMatch={bundleMatch}
                bookingOffers={bookingOffers}
                offersLoading={offersLoading}
                onAddServices={handleAddServices}
                onAddBundle={handleAddBundle}
                onApplyPromoFromOffer={handleApplyPromoFromOffer}
                onNext={handleNext}
                canProceed={canProceed()}
              />
            )}

            {/* STEP 2: Date & Time */}
            {currentContent === 'datetime' && (
              <BookingDateTimeStep
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                selectedTime={selectedTime}
                onSelectTime={setSelectedTime}
                timeSlots={timeSlots}
                waitlistTimeSlots={waitlistTimeSlots}
                slotsLoading={slotsLoading}
                onJoinWaitlist={(time) => {
                  if (time) setSelectedTime(time);
                  setWaitlistDialogOpen(true);
                }}
                onASAP={handleASAP}
                onNext={handleNext}
                canProceed={canProceed()}
              />
            )}

            {/* STEP 3: Preferences */}
            {currentContent === 'preferences' && (
              <motion.div
                key="preferences"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">Set Your Preferences</h2>
                  <p className="text-muted-foreground">Customize your search criteria (all optional)</p>
                </div>

                <div className="max-w-3xl mx-auto space-y-6">
                  {groupMode && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950">
                      <p className="font-semibold mb-1">Group booking, friends &amp; family</p>
                      <p>
                        Book multiple guests in one visit at the shop (default) or at home if you choose mobile.
                        No account needed for your party, add guest names at checkout, or sign in for promos and online pay.
                      </p>
                    </div>
                  )}
                  {/* Location */}
                  <div className="bg-card rounded-2xl border border-border p-6">
                    <h3 className="font-bold mb-2 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      Location
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Enter your address to find nearby barbers. Leave empty to skip location-based filtering.
                    </p>
                    <div className="flex gap-3">
                      <AddressAutocomplete
                        placeholder="Enter your address or zip code"
                        value={address}
                        onChange={(value) => {
                          setAddress(value);
                          setAddressCoords(null);
                        }}
                        onSelect={(item) => {
                          setAddress(item.formatted_address);
                          setAddressCoords({ latitude: item.latitude, longitude: item.longitude });
                          persistPreferredLocation(item);
                        }}
                        inputClassName="h-12"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleUseMyLocation}
                        disabled={isLoadingLocation}
                        className="h-12 px-6"
                      >
                        {isLoadingLocation ? (
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <MapPin className="w-4 h-4 mr-2" />
                            Use My Location
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Minimum Rating */}
                  <div className="bg-card rounded-2xl border border-border p-6">
                    <h3 className="font-bold mb-2 flex items-center gap-2">
                      <Star className="w-5 h-5 text-primary" />
                      Minimum Rating
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Filter out barbers below this rating threshold
                    </p>
                    <div className="flex gap-3">
                      {[0, 3, 4, 4.5].map(rating => (
                        <button
                          key={rating}
                          onClick={() => setMinRating(rating)}
                          className={cn(
                            "flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all",
                            minRating === rating
                              ? "border-primary bg-primary text-white"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          {rating === 0 ? 'Any' : `${rating}★+`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Location Preference */}
                  <div className="bg-card rounded-2xl border border-border p-6">
                    <h3 className="font-bold mb-2 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      Service Location
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Where would you like the service? Only barbers matching your choice will appear.
                    </p>
                    <div className={cn(
                      'grid gap-3',
                      activeBarberId && effectiveServiceModes.both ? 'grid-cols-2' :
                      activeBarberId && effectiveServiceModes.mobile_only ? 'grid-cols-1' :
                      isShopContext && effectiveServiceModes.shop_only ? 'grid-cols-1' :
                      'grid-cols-3'
                    )}>
                      {(!activeBarberId || effectiveServiceModes.both || effectiveServiceModes.shop) && (
                      <button
                        onClick={() => setLocationType('any')}
                        className={cn(
                          "py-3 px-4 rounded-lg border-2 font-medium transition-all text-sm",
                          !activeBarberId && locationType === 'any'
                            ? "border-primary bg-primary text-white"
                            : "border-border hover:border-primary/50",
                          (activeBarberId || isShopContext) && "hidden"
                        )}
                      >
                        Any
                      </button>
                      )}
                      {(!activeBarberId || effectiveServiceModes.shop || effectiveServiceModes.both) && (
                      <button
                        onClick={() => setLocationType('shop')}
                        className={cn(
                          "py-3 px-4 rounded-lg border-2 font-medium transition-all text-sm",
                          locationType === 'shop' || (activeBarberId && effectiveServiceModes.shop_only) || (isShopContext && effectiveServiceModes.shop_only)
                            ? "border-primary bg-primary text-white"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        At barber&apos;s
                      </button>
                      )}
                      {!isShopContext && (!activeBarberId || effectiveServiceModes.mobile || effectiveServiceModes.both) && (
                      <button
                        onClick={() => setLocationType('mobile')}
                        className={cn(
                          "py-3 px-4 rounded-lg border-2 font-medium transition-all text-sm",
                          locationType === 'mobile' || (activeBarberId && effectiveServiceModes.mobile_only)
                            ? "border-primary bg-primary text-white"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        At my place
                      </button>
                      )}
                    </div>
                    {isShopContext && effectiveServiceModes.shop_only && (
                      <p className="text-xs text-muted-foreground mt-3">
                        This shop only accepts in-shop visits, clients come to the location.
                      </p>
                    )}
                    {activeBarberId && effectiveServiceModes.shop_only && !isShopContext && (
                      <p className="text-xs text-muted-foreground mt-3">This barber only accepts in-shop visits.</p>
                    )}
                    {activeBarberId && effectiveServiceModes.mobile_only && (
                      <p className="text-xs text-violet-700 mt-3">
                        {normalizedSelectedBarber?.is_vip
                          ? 'VIP at-home specialist, enter your address at checkout for visits to your location.'
                          : 'This barber only offers at-home visits, you\u2019ll enter your address at checkout.'}
                      </p>
                    )}
                  </div>

                  {/* Spoken language */}
                  <div className="bg-card rounded-2xl border border-border p-6">
                    <h3 className="font-bold mb-2 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-primary" />
                      Spoken language
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Prefer a barber or shop team that speaks your language
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setPreferredLanguage('')}
                        className={cn(
                          'px-3 py-2 rounded-lg border text-sm font-medium',
                          !preferredLanguage ? 'border-primary bg-primary text-white' : 'border-border'
                        )}
                      >
                        Any
                      </button>
                      {languageOptions.slice(0, 10).map((lang) => (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => setPreferredLanguage(lang.code === preferredLanguage ? '' : lang.code)}
                          className={cn(
                            'px-3 py-2 rounded-lg border text-sm font-medium',
                            preferredLanguage === lang.code ? 'border-primary bg-primary text-white' : 'border-border'
                          )}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-card rounded-2xl border border-border p-6">
                    <h3 className="font-bold mb-2 flex items-center gap-2">
                      <Baby className="w-5 h-5 text-primary" />
                      {CHILDREN_FRIENDLY_LABEL}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Show only barbers or shops that welcome children
                    </p>
                    <button
                      type="button"
                      onClick={() => setKidsWelcomeOnly((v) => !v)}
                      className={cn(
                        'px-4 py-2 rounded-lg border text-sm font-medium',
                        kidsWelcomeOnly ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-border'
                      )}
                    >
                      {kidsWelcomeOnly ? `${CHILDREN_FRIENDLY_LABEL} only` : 'Any provider'}
                    </button>
                  </div>

                  {/* Provider Type */}
                  <div className="bg-card rounded-2xl border border-border p-6">
                    <h3 className="font-bold mb-2 flex items-center gap-2">
                      <Scissors className="w-5 h-5 text-primary" />
                      Provider Type
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Choose the type of experience you prefer
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => setProviderType('all')}
                        className={cn(
                          "py-3 px-4 rounded-lg border-2 font-medium transition-all text-sm",
                          providerType === 'all'
                            ? "border-primary bg-primary text-white"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        Any
                      </button>
                      <button
                        onClick={() => setProviderType('freelancer')}
                        className={cn(
                          "py-3 px-4 rounded-lg border-2 font-medium transition-all text-sm",
                          providerType === 'freelancer'
                            ? "border-primary bg-primary text-white"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        Freelancer
                      </button>
                      <button
                        onClick={() => setProviderType('shop')}
                        className={cn(
                          "py-3 px-4 rounded-lg border-2 font-medium transition-all text-sm",
                          providerType === 'shop'
                            ? "border-primary bg-primary text-white"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        Barbershop
                      </button>
                    </div>
                  </div>

                  {/* Acceptance Type */}
                  <div className="bg-card rounded-2xl border border-border p-6">
                    <h3 className="font-bold mb-2 flex items-center gap-2">
                      <Check className="w-5 h-5 text-primary" />
                      Booking Confirmation
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Choose your preferred booking confirmation method
                    </p>
                    <div className="grid grid-cols-1 gap-3">
                      <button
                        onClick={() => setAcceptanceType('all')}
                        className={cn(
                          "flex items-center gap-3 py-4 px-4 rounded-lg border-2 transition-all text-left",
                          acceptanceType === 'all'
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold">Show All</div>
                          <div className="text-xs text-muted-foreground">Both instant and pending confirmation</div>
                        </div>
                      </button>
                      <button
                        onClick={() => setAcceptanceType('auto')}
                        className={cn(
                          "flex items-center gap-3 py-4 px-4 rounded-lg border-2 transition-all text-left",
                          acceptanceType === 'auto'
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                          <Check className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold">Instant Confirmation</div>
                          <div className="text-xs text-muted-foreground">Barbers who accept automatically</div>
                        </div>
                      </button>
                      <button
                        onClick={() => setAcceptanceType('manual')}
                        className={cn(
                          "flex items-center gap-3 py-4 px-4 rounded-lg border-2 transition-all text-left",
                          acceptanceType === 'manual'
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                          <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold">Pending Confirmation</div>
                          <div className="text-xs text-muted-foreground">Barbers who review before accepting</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Sort Preference */}
                  <div className="bg-card rounded-2xl border border-border p-6">
                    <h3 className="font-bold mb-2 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Sort Results By
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Choose how to rank and display barber results
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button
                        onClick={() => setSortBy('global_score')}
                        className={cn(
                          "flex items-center gap-3 py-4 px-4 rounded-lg border-2 transition-all text-left",
                          sortBy === 'global_score'
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <Sparkles className="w-5 h-5 text-primary" />
                        <div>
                          <div className="font-semibold">Best Match</div>
                          <div className="text-xs text-muted-foreground">Balanced score</div>
                        </div>
                      </button>
                      <button
                        onClick={() => setSortBy('price')}
                        className={cn(
                          "flex items-center gap-3 py-4 px-4 rounded-lg border-2 transition-all text-left",
                          sortBy === 'price'
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <DollarSign className="w-5 h-5 text-primary" />
                        <div>
                          <div className="font-semibold">Lowest Price</div>
                          <div className="text-xs text-muted-foreground">Budget friendly</div>
                        </div>
                      </button>
                      <button
                        onClick={() => setSortBy('distance')}
                        className={cn(
                          "flex items-center gap-3 py-4 px-4 rounded-lg border-2 transition-all text-left",
                          sortBy === 'distance'
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <MapPin className="w-5 h-5 text-primary" />
                        <div>
                          <div className="font-semibold">Nearest</div>
                          <div className="text-xs text-muted-foreground">Closest to you</div>
                        </div>
                      </button>
                      <button
                        onClick={() => setSortBy('rating')}
                        className={cn(
                          "flex items-center gap-3 py-4 px-4 rounded-lg border-2 transition-all text-left",
                          sortBy === 'rating'
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <Award className="w-5 h-5 text-primary" />
                        <div>
                          <div className="font-semibold">Top Rated</div>
                          <div className="text-xs text-muted-foreground">Highest reviews</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    size="lg"
                    onClick={handleNext}
                    className="px-8"
                  >
                    Show Results <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Results or Confirmation */}
            {(currentContent === 'results' || currentContent === 'confirmation') && (
              <BookingConfirmationStep
                hasBarberId={!!(bookingState?.barberId || urlBarberId)}
                selectedBarber={selectedBarber}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                selectedServices={selectedServices}
                services={services}
                customerNotes={customerNotes}
                onCustomerNotesChange={setCustomerNotes}
                promoCode={promoCode}
                onPromoCodeChange={setPromoCode}
                appliedPromotion={appliedPromotion}
                onApplyPromo={handleApplyPromo}
                onRemovePromo={() => { setAppliedPromotion(null); setPromoCode(''); }}
                promoError={promoError}
                availablePromotions={bookingOffers?.promotions ?? []}
                loyaltyRewardCodes={loyaltyRewardCodes}
                onApplyPromoFromOffer={handleApplyPromoFromOffer}
                basePrice={basePrice}
                subtotalAfterCombo={subtotalAfterCombo}
                comboSavings={comboSavings}
                bundleMatch={bundleMatch}
                discountAmount={promoDiscountAmount}
                totalPrice={totalPrice}
                grandTotal={grandTotal}
                travelFee={travelFeeAmount}
                travelDistanceKm={travelQuote?.distance_km}
                travelZoneLabel={travelQuote?.zone_label}
                travelQuoteLoading={travelQuoteLoading || travelQuoteFetching}
                travelOutOfArea={travelOutOfArea}
                atHomeVisit={atHomeVisitForQuote}
                pointsEarnedPreview={pointsEarnedPreview}
                address={address}
                onConfirmBooking={handleConfirmBooking}
                isConfirming={createBookingMutation.isPending || createGuestBookingMutation.isPending}
                confirmDisabled={
                  (groupModeActive && (groupQuoteLoading || !groupQuote)) ||
                  (atHomeVisitForQuote &&
                    address.trim().length >= 8 &&
                    (travelQuoteLoading || travelQuoteFetching)) ||
                  travelOutOfArea ||
                  (isGuestCheckout && guestBookingBlock.blocked)
                }
                isGuestCheckout={isGuestCheckout}
                guestContact={guestContact}
                onGuestContactChange={setGuestContact}
                guestContactError={guestContactError}
                guestBookingBlocked={guestBookingBlock.blocked}
                guestBlockReason={guestBookingBlock.reason}
                signInReturnPath={location.pathname + location.search}
                cashAvailability={cashAvailability}
                paymentProtectionPreview={paymentProtectionPreview}
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
                filteredBarbers={filteredBarbers}
                isLoadingBarbers={isLoadingBarbers}
                onBarberSelect={handleBarberSelect}
                sortBy={sortBy}
                onGoToPreferences={() => setCurrentStep(2)}
                groupMode={groupModeActive}
                groupSearchMode={groupMode && !groupModeActive}
                groupBookingCaps={groupBookingCaps}
                groupGuests={groupGuests}
                onGroupGuestsChange={setGroupGuests}
                groupEventLabel={groupEventLabel}
                onGroupEventLabelChange={setGroupEventLabel}
                groupQuote={groupQuote}
                groupDiscountAmount={groupQuote?.group_discount_amount ?? 0}
                locationType={locationType}
                onAddressChange={(value) => {
                  setAddress(value);
                  setAddressCoords(null);
                }}
                onAddressSelect={(item) => {
                  setAddress(item.formatted_address);
                  setAddressCoords({ latitude: item.latitude, longitude: item.longitude });
                  persistPreferredLocation(item);
                }}
              />
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md bg-card border-border text-foreground max-h-[90vh] overflow-y-auto">
          <div className="text-center py-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>

            <h2 className="text-2xl font-bold mb-2">
              {confirmedPaymentMethod === 'cash_at_store' ? 'Booking requested!' : 'Booking Confirmed!'}
            </h2>
            <p className="text-muted-foreground mb-2">
              {confirmedPaymentMethod === 'cash_at_store'
                ? confirmedPaymentStep === 'save_card'
                  ? 'Save a card on file to secure your appointment. At your visit, pay your barber in the shop (cash or card on their POS).'
                  : 'Pay your barber in the shop at your appointment (cash or card on their POS). They will confirm once ready.'
                : confirmedPaymentStep === 'deposit'
                  ? "Booking reserved, complete your deposit to confirm."
                  : confirmedPaymentStep === 'auth_hold'
                    ? "Booking reserved, authorize your card to confirm."
                    : confirmedPaymentStep === 'save_card'
                      ? "Booking reserved, save your card to confirm."
                      : "You're all set. We've sent a confirmation email."}
            </p>
            {confirmedBookingMeta && (confirmedBookingMeta.isGroup || confirmedBookingMeta.isAtHome) ? (
              <p className="text-sm text-foreground/80 mb-6 px-2">
                {confirmedBookingMeta.isGroup && confirmedBookingMeta.isAtHome
                  ? `Group at-home booking for ${confirmedBookingMeta.partySize} guests${confirmedBookingMeta.eventLabel ? ` (${confirmedBookingMeta.eventLabel})` : ''}. Your barber will travel to ${confirmedBookingMeta.address || 'your address'}.`
                  : confirmedBookingMeta.isGroup
                    ? `Group booking for ${confirmedBookingMeta.partySize} guests at the shop${confirmedBookingMeta.eventLabel ? `, ${confirmedBookingMeta.eventLabel}` : ''}. Friends and family do not need their own accounts.`
                    : `At-home visit, your barber will come to ${confirmedBookingMeta.address || 'your address'}.`}
              </p>
            ) : (
              <div className="mb-6" aria-hidden />
            )}

            <div className="space-y-2">
              {confirmedGuestToken ? (
                <Link to={createPageUrl(`GuestBooking?token=${encodeURIComponent(confirmedGuestToken)}`)}>
                  <Button className="w-full h-11 mb-2">
                    View your booking
                  </Button>
                </Link>
              ) : null}
              {confirmedBookingId && !confirmedGuestToken && (confirmedPaymentMethod !== 'cash_at_store' || confirmedPaymentStep === 'save_card') && (
                <Button
                  onClick={() => createPaymentSessionMutation.mutate(confirmedBookingId)}
                  disabled={createPaymentSessionMutation.isPending}
                  className="w-full bg-primary text-primary-foreground hover:opacity-95 h-11 mb-2"
                >
                  {createPaymentSessionMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <DollarSign className="w-4 h-4 mr-2" />
                  )}
                  {confirmedPaymentStep === 'deposit'
                    ? 'Pay deposit (Stripe)'
                    : confirmedPaymentStep === 'auth_hold'
                      ? 'Authorize card (Stripe)'
                      : confirmedPaymentStep === 'save_card'
                        ? 'Save card on file (Stripe)'
                        : 'Pay with Card (Stripe)'}
                </Button>
              )}
              <Link to={createPageUrl(confirmedGuestToken ? 'Explore' : 'Dashboard')}>
                <Button variant="outline" className="w-full h-11">
                  <Home className="w-4 h-4 mr-2" />
                  {confirmedGuestToken ? 'Continue exploring' : 'Go to Dashboard'}
                </Button>
              </Link>
              <Link to={createPageUrl('Explore')}>
                <Button variant="outline" className="w-full">
                  Continue Exploring
                </Button>
              </Link>
            </div>

            {confirmedBookingId && (
              <p className="text-xs text-muted-foreground mt-4">Order ID: #{confirmedBookingId}</p>
            )}
          </div>
          <ReferralShareCard
            className="mt-4 text-left"
            title="Invite a friend"
            subtitle="Share ShopTheBarber, you earn when they complete their first booking."
          />
        </DialogContent>
      </Dialog>

      <BookingWaitlistDialog
        open={waitlistDialogOpen}
        onOpenChange={setWaitlistDialogOpen}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        barberId={activeBarberId}
        shopId={bookingState?.shopId || urlShopId}
        serviceId={selectedServices?.[0]}
        serviceIds={selectedServices}
        barberName={normalizedSelectedBarber?.name}
        barberImageUrl={normalizedSelectedBarber?.image_url}
        serviceName={
          selectedServices.length === 1
            ? getServiceDetails(selectedServices[0]).name
            : selectedServices.length > 1
              ? `${selectedServices.length} services`
              : undefined
        }
        servicePrice={priceQuote?.final_price ?? basePriceLocal}
        serviceDuration={priceQuote?.total_duration_minutes ?? totalDurationLocal}
      />
    </div>
  );
}
