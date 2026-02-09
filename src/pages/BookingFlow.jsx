import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useBooking } from '@/components/context/BookingContext';
import { sendNotification } from '@/components/notifications/notificationUtils';
import { MetaTags } from '@/components/seo/MetaTags';
import { toast } from 'sonner';
import {
  Scissors, Clock, MapPin, Star, ArrowRight, ArrowLeft,
  Calendar as CalendarIcon, Check, TrendingUp, DollarSign,
  Award, Sparkles, Loader2, CheckCircle2, Home
} from 'lucide-react';
import React from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { cn } from '@/components/utils';
import confetti from 'canvas-confetti';
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function BookingFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingState, updateBooking } = useBooking();

  const searchParams = new URLSearchParams(location.search);
  const urlBarberId = searchParams.get('barberId');
  const urlShopId = searchParams.get('shopId');
  const urlServiceId = searchParams.get('serviceId');
  const context = searchParams.get('context');

  // Sync URL params to booking state if present
  useEffect(() => {
    const updates = {};
    if (urlBarberId && bookingState?.barberId !== urlBarberId) updates.barberId = urlBarberId;
    if (urlShopId && bookingState?.shopId !== urlShopId) updates.shopId = urlShopId;

    // Handle Service Pre-selection from URL
    if (urlServiceId) {
      // We need to fetch the service object to add it to state, or just store ID
      // Since state uses objects, we might need to rely on the service query to resolve it later.
      // For now, let's just ensure we don't overwrite if already set, or force it.
      // But selectedServices state is local to this component initially.
      // We'll handle this in the services initialization or effect.
    }

    if (Object.keys(updates).length > 0) {
      updateBooking({ ...bookingState, ...updates });
    }
  }, [urlBarberId, urlShopId, bookingState?.barberId, bookingState?.shopId]);

  // Dynamically determine steps based on whether a barber is pre-selected
  const isSpecificBarberBooking = !!(bookingState?.barberId || urlBarberId);
  const STEPS = isSpecificBarberBooking
    ? ['Services', 'Date & Time', 'Confirmation']
    : ['Services', 'Date & Time', 'Preferences', 'Results'];

  // Initialize step from URL or default to 0
  const getInitialStep = () => {
    const params = new URLSearchParams(location.search);
    const stepParam = params.get('step');
    if (stepParam === 'datetime' || stepParam === '1') return 1;
    if (stepParam === 'preferences' || stepParam === '2') return 2;
    if (stepParam === 'results' || stepParam === 'confirm' || stepParam === '3') return 3;
    return 0;
  };

  // Step tracking
  const [currentStep, setCurrentStep] = useState(getInitialStep);

  // Step 1: Services
  // Initialize services from global state or URL param
  const [selectedServices, setSelectedServices] = useState(() => {
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

  // Step 3: Preferences
  const [address, setAddress] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('global_score'); // global_score, price, distance, rating
  const [acceptanceType, setAcceptanceType] = useState('all'); // all, auto, manual
  const [providerType, setProviderType] = useState('all'); // all, freelancer, shop
  const [locationType, setLocationType] = useState('any'); // any, shop, mobile

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
  }, [tempBarberId, urlShopId, context, bookingState?.shopId, bookingState?.context]);

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
  const { data: allBarbers = [], isLoading: isLoadingBarbers, isError: barbersListError } = useQuery({
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

  // Fetch specific barber if ID is present
  const { data: selectedBarber, isError: selectedBarberError, isFetched: selectedBarberFetched } = useQuery({
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
    const baseMinutes = serviceData.duration_min || parseInt((serviceData.duration_text || '0').match(/\d+/)?.[0] || 0);
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

  // Calculate totals
  const totalDuration = selectedServices.reduce((sum, serviceId) => sum + getServiceDetails(serviceId).duration, 0);
  const basePrice = selectedServices.reduce((sum, serviceId) => sum + getServiceDetails(serviceId).price, 0);

  const calculateDiscount = () => {
    if (!appliedPromotion) return 0;
    const discountText = appliedPromotion.discount_text || '';
    const amount = parseFloat(discountText.replace(/[^0-9.]/g, '') || 0);

    if (discountText.includes('%')) {
      return (basePrice * amount) / 100;
    }
    return amount;
  };

  const discountAmount = calculateDiscount();
  const totalPrice = Math.max(0, basePrice - discountAmount);

  // Calculate Financial Breakdown (Commission & Payouts)
  const financialBreakdown = React.useMemo(() => {
    const isShopContext = !!(bookingState?.shopId || urlShopId);
    const commissionRate = isShopContext
      ? (activePricingRule.commission_shop || 0.05)
      : (activePricingRule.commission_freelancer || 0.10);

    const platformFee = totalPrice * commissionRate;
    const taxRate = 0; // Simplified for MVP (assume baked in or 0)
    const taxAmount = totalPrice * taxRate;

    const providerPayout = Math.max(0, totalPrice - platformFee - taxAmount);

    return {
      base_price: basePrice,
      discount_amount: discountAmount,
      final_price: totalPrice,
      platform_fee: platformFee,
      tax_amount: taxAmount,
      provider_payout: providerPayout,
      commission_rate_snapshot: commissionRate,
      currency: 'USD'
    };
  }, [basePrice, discountAmount, totalPrice, bookingState?.shopId, urlShopId, activePricingRule]);

  const handleApplyPromo = async () => {
    if (!promoCode) return;
    setPromoError('');

    try {
      // Fetch promotions to find matching code
      // Note: In a real app, backend should validate this securely
      const promotions = await sovereign.entities.Promotion.list();
      const promo = promotions.find(p => p.code?.toUpperCase() === promoCode.toUpperCase());

      if (promo) {
        setAppliedPromotion(promo);
        setPromoError('');
      } else {
        setPromoError('Invalid promo code');
        setAppliedPromotion(null);
      }
    } catch {
      setPromoError('Failed to validate code');
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

      // Filter by location type (Mobile vs Shop)
      if (locationType === 'mobile' && !barberData.offers_mobile_service) return false;
      // If locationType is 'shop', we generally assume all barbers have a base, 
      // but strictly we could check if they have a location. For now, we assume all valid barbers do.

      return true;
    });

    // Calculate scores and sort
    filtered = filtered.map(barber => {
      const barberData = barber.data || barber;
      const rating = barberData.rating || 0;
      const reviewCount = barberData.review_count || 0;
      const estimatedPrice = totalPrice; // In real app, sum barber's prices for selected services

      // Simple distance mock (would use actual geolocation)
      const mockDistance = Math.random() * 10;

      // Global score: balanced mix of factors
      const ratingScore = rating / 5;
      const reviewScore = Math.min(reviewCount / 100, 1);
      const distanceScore = address ? (1 - mockDistance / 10) : 0.5;
      const priceScore = estimatedPrice > 0 ? (1 - Math.min(estimatedPrice / 200, 1)) : 0.5;

      const globalScore = (ratingScore * 0.4 + reviewScore * 0.2 + distanceScore * 0.2 + priceScore * 0.2) * 100;

      return {
        ...barber,
        distance: mockDistance,
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
          return a.distance - b.distance;
        case 'rating':
          return b.rating - a.rating;
        case 'global_score':
        default:
          return b.globalScore - a.globalScore;
      }
    });

    return filtered;
  }, [allBarbers, minRating, sortBy, address, totalPrice, currentStep]);

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
  const [confirmedBookingId, setConfirmedBookingId] = useState(null);

  const createBookingMutation = useMutation({
    mutationFn: (data) => sovereign.entities.Booking.create(data),
    onSuccess: async (newBooking) => {
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
      alert("Failed to create booking: " + error.message);
    }
  });

  const createPaymentSessionMutation = useMutation({
    mutationFn: async (bookingId) => {
      const { url } = await sovereign.functions.invoke('create-checkout-session', { bookingId });
      return { url };
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast.error("Payment Error: " + error.message);
    }
  });

  const handleConfirmBooking = () => {
    if (!selectedDate || !selectedTime) return;

    // --- PHASE 2: WRITE-TIME INVARIANT ENFORCEMENT ---

    // 1. Authenticated User Check
    if (!currentUser) {
      toast.error("Please log in to complete your booking");
      // Trigger login flow or redirect
      sovereign.auth.redirectToLogin(location.pathname + location.search);
      return;
    }

    // 2. Barber Identity Check
    if (!activeBarberId) {
      toast.error("System Error: No barber identified. Please restart.");
      return;
    }

    // 3. Context & Location Integrity Check
    // We must have either a valid shop_id OR an explicit independent context
    const shopId = bookingState?.shopId || urlShopId;
    const isIndependentContext = context === 'independent' || bookingState?.context === 'independent';

    // If we have a shopId, we MUST have a resolved shop_member_id (provenance)
    if (shopId && !staffConfig?.member?.id) {
      toast.error("System Error: Could not verify barber's membership at this shop.");
      return;
    }

    // If no shopId, we MUST be in independent mode
    if (!shopId && !isIndependentContext) {
      // Edge case: "Implicit" independent if barber has no shops?
      // Phase 1 guard should catch this, but we block writes here to be safe.
      // However, if the barber IS independent and we auto-resolved...
      if (selectedBarber?.is_independent && !shopId) {
        // Acceptable implicit independent
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
      services: selectedServices.map(id => getServiceDetails(id)),
      total_duration: totalDuration,
      total_price: totalPrice,
      base_price: basePrice,
      applied_promotion: appliedPromotion ? {
        code: appliedPromotion.code,
        discount: appliedPromotion.discount_text,
        id: appliedPromotion.id
      } : null
    };

    // Analytics: Confirm Attempt
    sovereign.analytics.track({
      eventName: 'confirm_booking_attempt',
      properties: {
        barber_id: activeBarberId,
        shop_id: shopId,
        total_price: totalPrice,
        service_count: selectedServices.length,
        context_type: shopId ? 'shop' : 'independent'
      }
    });

    createBookingMutation.mutate({
      // Core Identity
      client_id: currentUser.id,
      barber_id: activeBarberId,
      shop_id: shopId || null, // Explicit null if independent
      shop_member_id: shopId ? staffConfig?.member?.id : null, // Only link membership if in shop context

      // Display Data
      service_name: serviceNames || 'Barber Service',
      date_text: format(selectedDate, 'PPP'),
      time_text: selectedTime,
      location: address || selectedBarber?.location || 'Barbershop', // Fallback display location

      // State
      status: 'pending',
      payment_status: 'unpaid',

      // Financials (Locked)
      price_at_booking: totalPrice,
      duration_at_booking: totalDuration,
      service_snapshot: snapshot,
      financial_breakdown: financialBreakdown, // Persist calculated commissions

      // Metadata
      image_url: selectedBarber?.image_url,
      category: 'upcoming',
      description: description,

      // Context info for analytics
      context_type: shopId ? 'shop' : 'independent',
      customer_notes: customerNotes // Save notes
    });
  };

  const handleBarberSelect = (barber) => {
    const barberId = barber.id || barber.data?.id || barber;
    updateBooking({
      barberId,
      selectedServices: selectedServices.map(id => services.find(s => s.id === id)),
      selectedDate,
      selectedTime,
      address,
      minRating,
      sortBy,
      acceptanceType
    });
    navigate(createPageUrl(`BarberProfile?id=${barberId}`));
  };

  const handleUseMyLocation = async () => {
    setIsLoadingLocation(true);
    try {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        setIsLoadingLocation(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Use reverse geocoding via LLM integration
          try {
            const locationData = await sovereign.integrations.Core.InvokeLLM({
              prompt: `Get the address for coordinates: ${latitude}, ${longitude}. Return ONLY the formatted address as a simple string, nothing else.`,
              add_context_from_internet: true
            });

            setAddress(locationData || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          } catch {
            // Fallback to coordinates if geocoding fails
            setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }

          setIsLoadingLocation(false);
        },
        (_error) => {
          alert('Unable to retrieve your location. Please enter manually.');
          setIsLoadingLocation(false);
        }
      );
    } catch {
      alert('Error accessing location');
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
        let current = new Date(`2000-01-01T${startStr}`);
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
    let current = new Date(`2000-01-01T${startStr}`);
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

  const timeSlots = getAvailableTimeSlots();

  const handleASAP = () => {
    const now = new Date();
    const currentHour = now.getHours();

    // Find next available slot today
    const nextSlot = timeSlots.find(slot => {
      const [time, period] = slot.split(' ');
      let [hours, _minutes] = time.split(':').map(Number);
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      return hours > currentHour;
    });

    if (nextSlot) {
      setSelectedDate(now);
      setSelectedTime(nextSlot);
    } else {
      // If no slots today, pick tomorrow first slot
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      setSelectedDate(tomorrow);
      setSelectedTime(timeSlots[0]);
    }

    // Directly advance step to avoid race condition with state update validation
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 lg:pb-8">
      <MetaTags
        title="Book Appointment"
        description="Find and book with the best barbers in your area"
      />

      {/* Progress Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Book Appointment</h1>
            {currentStep > 0 && currentStep < 3 && !isContextValidating && (
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            )}
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2">
            {STEPS.map((step, index) => (
              <React.Fragment key={step}>
                <div className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                  index === currentStep ? "bg-primary/10 text-primary" :
                    index < currentStep ? "bg-gray-50 text-muted-foreground" : "text-muted-foreground"
                )}>
                  {index < currentStep ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                      index === currentStep ? "bg-primary text-white" : "bg-gray-200"
                    )}>
                      {index + 1}
                    </span>
                  )}
                  <span className="text-sm font-medium hidden md:inline">{step}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={cn(
                    "h-0.5 flex-1 max-w-12",
                    index < currentStep ? "bg-primary" : "bg-gray-200"
                  )} />
                )}
              </React.Fragment>
            ))}
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
              <motion.div
                key="services"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">
                    {selectedBarber ? `Booking with ${selectedBarber.name}` : 'Choose Your Services'}
                  </h2>
                  <p className="text-muted-foreground">Select a category and pick your services</p>
                </div>

                {/* Loading State */}
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
                    {/* Category Tabs */}
                    {(() => {
                      const categoryImages = {
                        'Hair': 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&fit=crop',
                        'Beard': 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&fit=crop',
                        'Shave': 'https://images.unsplash.com/photo-1503951914290-93d32b06769c?w=800&fit=crop',
                        'Color': 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&fit=crop',
                        'Facial': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&fit=crop',
                        'Other': 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&fit=crop'
                      };

                      // Use availableServices instead of raw services
                      const groupedServices = availableServices.reduce((acc, service) => {
                        const serviceData = service.data || service;
                        const category = serviceData.category || 'Other';
                        if (!acc[category]) acc[category] = [];
                        acc[category].push(service);
                        return acc;
                      }, {});

                      const categories = Object.keys(groupedServices);
                      const categoryServices = groupedServices[selectedCategory] || [];

                      // Calculate average price for category
                      const avgPrice = categoryServices.length > 0
                        ? categoryServices.reduce((sum, s) => {
                          const sData = s.data || s;
                          const price = sData.price || parseFloat((sData.price_text || '0').replace(/[^0-9.]/g, '')) || 0;
                          return sum + price;
                        }, 0) / categoryServices.length
                        : 0;

                      return (
                        <>
                          {/* Category Selection */}
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                            {categories.map(category => {
                              const count = groupedServices[category].length;
                              return (
                                <button
                                  key={category}
                                  onClick={() => setSelectedCategory(category)}
                                  className={cn(
                                    "relative h-32 rounded-2xl overflow-hidden border-2 transition-all group",
                                    selectedCategory === category
                                      ? "border-primary ring-2 ring-primary/20 scale-105"
                                      : "border-border hover:border-primary/50"
                                  )}
                                >
                                  <OptimizedImage
                                    src={categoryImages[category] || categoryImages['Other']}
                                    alt={category}
                                    fill
                                    width={400}
                                    imgClassName="object-cover"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-4">
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

                                const baseDuration = serviceData.duration_min || parseInt((serviceData.duration_text || '0').match(/\d+/)?.[0] || 0);
                                const basePrice = serviceData.price || parseFloat((serviceData.price_text || '0').replace(/[^0-9.]/g, '') || 0);

                                return (
                                  <div
                                    key={service.id}
                                    onClick={() => handleServiceToggle(service.id)}
                                    className={cn(
                                      "group relative bg-white border-2 rounded-xl overflow-hidden cursor-pointer transition-all duration-300",
                                      isSelected
                                        ? "border-primary shadow-lg shadow-primary/20 scale-[1.02]"
                                        : "border-border hover:border-primary/50 hover:shadow-lg"
                                    )}
                                  >
                                    {/* Checkbox */}
                                    <div className={cn(
                                      "absolute top-2 right-2 z-20 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                      isSelected
                                        ? "bg-primary border-primary"
                                        : "bg-white border-gray-300 group-hover:border-primary/50"
                                    )}>
                                      {isSelected && <Check className="w-3 h-3 text-white" />}
                                    </div>

                                    {/* Service Image */}
                                    <div className="relative h-32 w-full overflow-hidden bg-gray-100">
                                      {serviceData.image_url ? (
                                        <OptimizedImage
                                          src={serviceData.image_url}
                                          alt={serviceData.name}
                                          fill
                                          width={300}
                                          imgClassName="object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                          <Scissors className="w-12 h-12" />
                                        </div>
                                      )}
                                    </div>

                                    {/* Service Details */}
                                    <div className="p-3">
                                      <h3 className="font-bold text-sm mb-1 text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                        {serviceData.name}
                                      </h3>

                                      {/* Provider Name (Generic Mode) */}
                                      {!activeBarberId && serviceData.owner_id && (
                                        <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                                          by {allBarbers.find(b => b.id === serviceData.owner_id)?.name || allBarbers.find(b => b.id === serviceData.owner_id)?.data?.name || 'Provider'}
                                        </p>
                                      )}

                                      {/* Duration and Price */}
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                          <Clock className="w-3 h-3" />
                                          <span className={cn("text-xs", details.duration !== baseDuration && "text-primary font-bold")}>
                                            {details.duration}m
                                          </span>
                                        </div>
                                        <div className={cn("text-base font-bold text-primary", details.price !== basePrice && "text-primary")}>
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
                      );
                    })()}
                  </>
                )}

                {/* Fixed Bottom Action Bar */}
                <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border shadow-2xl">
                  <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {selectedServices.length === 0 ? (
                          <span>Select at least one service to continue</span>
                        ) : (
                          <span>
                            <strong className="text-foreground">{selectedServices.length}</strong> service{selectedServices.length > 1 ? 's' : ''} selected •
                            <strong className="text-foreground ml-1">{totalDuration} min</strong> •
                            <strong className="text-primary ml-1">${totalPrice.toFixed(2)}</strong>
                          </span>
                        )}
                      </div>
                      <Button
                        size="lg"
                        onClick={handleNext}
                        disabled={!canProceed()}
                        className="px-8 shadow-lg"
                      >
                        Continue <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Add bottom padding to prevent content from being hidden under fixed bar */}
                <div className="h-24" />
              </motion.div>
            )}

            {/* STEP 2: Date & Time */}
            {currentContent === 'datetime' && (
              <motion.div
                key="datetime"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">Select Date & Time</h2>
                  <p className="text-muted-foreground">Choose your preferred appointment time</p>
                </div>

                <div className="flex justify-center mb-8">
                  <Button
                    size="lg"
                    onClick={handleASAP}
                    className="bg-primary text-primary-foreground hover:opacity-95 px-8 h-14 text-lg rounded-full shadow-lg"
                  >
                    <Clock className="w-5 h-5 mr-2" /> Book ASAP (Next Available)
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
                  {/* Date Selection */}
                  <div className="bg-white rounded-2xl border border-border p-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5 text-primary" />
                      Pick a Date
                    </h3>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date()}
                      className="rounded-xl border-0 w-full"
                    />
                    {selectedDate && (
                      <p className="mt-4 text-sm text-center text-muted-foreground">
                        Selected: <strong className="text-foreground">{format(selectedDate, 'PPPP')}</strong>
                      </p>
                    )}
                  </div>

                  {/* Time Selection */}
                  <div className="bg-white rounded-2xl border border-border p-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      Pick a Time
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {timeSlots.map(time => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={cn(
                            "py-3 px-4 rounded-lg border-2 font-medium transition-all text-sm",
                            selectedTime === time
                              ? "border-primary bg-primary text-white"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    size="lg"
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="px-8"
                  >
                    Continue <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </motion.div>
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
                  {/* Location */}
                  <div className="bg-white rounded-2xl border border-border p-6">
                    <h3 className="font-bold mb-2 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      Location
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Enter your address to find nearby barbers. Leave empty to skip location-based filtering.
                    </p>
                    <div className="flex gap-3">
                      <Input
                        placeholder="Enter your address or zip code"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="h-12 flex-1"
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
                  <div className="bg-white rounded-2xl border border-border p-6">
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
                  <div className="bg-white rounded-2xl border border-border p-6">
                    <h3 className="font-bold mb-2 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      Service Location
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Where would you like the service to take place?
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => setLocationType('any')}
                        className={cn(
                          "py-3 px-4 rounded-lg border-2 font-medium transition-all text-sm",
                          locationType === 'any'
                            ? "border-primary bg-primary text-white"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        Any
                      </button>
                      <button
                        onClick={() => setLocationType('shop')}
                        className={cn(
                          "py-3 px-4 rounded-lg border-2 font-medium transition-all text-sm",
                          locationType === 'shop'
                            ? "border-primary bg-primary text-white"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        At Barber's
                      </button>
                      <button
                        onClick={() => setLocationType('mobile')}
                        className={cn(
                          "py-3 px-4 rounded-lg border-2 font-medium transition-all text-sm",
                          locationType === 'mobile'
                            ? "border-primary bg-primary text-white"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        At My Place
                      </button>
                    </div>
                  </div>

                  {/* Provider Type */}
                  <div className="bg-white rounded-2xl border border-border p-6">
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
                  <div className="bg-white rounded-2xl border border-border p-6">
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
                  <div className="bg-white rounded-2xl border border-border p-6">
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
              <motion.div
                key="results"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {bookingState?.barberId ? (
                  // CONFIRMATION VIEW (Specific Barber)
                  <div className="max-w-3xl mx-auto">
                    {/* Loading State for Selected Barber */}
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

                                {/* Promo Code Input */}
                                {/* Customer Notes Input */}
                                <div className="mt-4 pt-4 border-t border-border">
                                  <label className="text-sm font-semibold mb-2 block">Special Requests / Notes</label>
                                  <textarea
                                    className="w-full min-h-[80px] p-3 rounded-lg border border-gray-200 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                                    placeholder="Any allergies, style preferences, or access needs?"
                                    value={customerNotes}
                                    onChange={(e) => setCustomerNotes(e.target.value)}
                                  />
                                </div>

                                <div className="mt-4 pt-4 border-t border-border">
                                  {!appliedPromotion ? (
                                    <div className="flex gap-2">
                                      <Input
                                        placeholder="Promo Code"
                                        value={promoCode}
                                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                        className="h-10 uppercase"
                                      />
                                      <Button onClick={handleApplyPromo} variant="outline" size="sm" className="h-10">
                                        Apply
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex justify-between items-center bg-green-50 p-2 rounded text-sm text-green-700 border border-green-200">
                                      <span className="font-medium flex items-center gap-1">
                                        <Check className="w-4 h-4" /> {appliedPromotion.code} applied
                                      </span>
                                      <button onClick={() => { setAppliedPromotion(null); setPromoCode(''); }} className="text-xs hover:underline">
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
                          onClick={handleConfirmBooking}
                          disabled={createBookingMutation.isPending}
                        >
                          {createBookingMutation.isPending ? 'Confirming...' : 'Confirm Booking'}
                          {!createBookingMutation.isPending && <Check className="w-5 h-5 ml-2" />}
                        </Button>
                      </>
                    )}
                  </div>
                ) : (
                  // RESULTS VIEW (Search Mode)
                  <>
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
                        <Button variant="outline" onClick={() => setCurrentStep(2)}>
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
                            onClick={() => handleBarberSelect(barber)}
                            className="bg-white rounded-2xl border border-border p-5 cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all group"
                          >
                            <div className="flex items-start gap-4 mb-4">
                              <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                                <OptimizedImage
                                  src={(barber.data || barber).image_url || "https://images.unsplash.com/photo-1503951914290-93d32b06769c?w=200&fit=crop"}
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
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
          <div className="text-center py-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>

            <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
            <p className="text-gray-400 mb-6">You're all set. We've sent a confirmation email.</p>

            <div className="space-y-2">
              {confirmedBookingId && (
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
                  Pay with Card (Stripe)
                </Button>
              )}
              <Link to={createPageUrl('Dashboard')}>
                <Button variant="outline" className="w-full border-white/10 hover:bg-white/5 text-gray-300 h-11">
                  <Home className="w-4 h-4 mr-2" /> Go to Dashboard
                </Button>
              </Link>
              <Link to={createPageUrl('Explore')}>
                <Button variant="outline" className="w-full border-white/10 hover:bg-white/5 text-gray-300">
                  Continue Exploring
                </Button>
              </Link>
            </div>

            {confirmedBookingId && (
              <p className="text-xs text-gray-600 mt-4">Order ID: #{confirmedBookingId}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
