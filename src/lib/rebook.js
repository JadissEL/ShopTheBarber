/** Session key for BookingFlow prefill after one-click rebook. */
export const REBOOK_PREFILL_KEY = 'stb_rebook_prefill';

/**
 * @param {Record<string, unknown>} booking
 * @returns {string[]}
 */
export function extractServiceIdsFromBooking(booking) {
  if (!booking) return [];
  if (Array.isArray(booking.rebook_service_ids) && booking.rebook_service_ids.length > 0) {
    return booking.rebook_service_ids.map(String);
  }
  if (Array.isArray(booking.service_ids) && booking.service_ids.length > 0) {
    return booking.service_ids.map(String);
  }
  const raw = booking.service_ids;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      // ignore
    }
  }
  const snap = booking.service_snapshot;
  if (snap) {
    try {
      const parsed = typeof snap === 'string' ? JSON.parse(snap) : snap;
      if (Array.isArray(parsed?.services)) {
        return parsed.services
          .map((s) => s?.service_id || s?.id)
          .filter(Boolean)
          .map(String);
      }
    } catch {
      // ignore
    }
  }
  return [];
}

/**
 * Shop staff, independent barber, at-home mobile, or group.
 * @param {Record<string, unknown>} booking
 */
export function resolveRebookContext(booking) {
  const shopId = booking?.shop_id ? String(booking.shop_id) : null;
  const visitType =
    booking?.visit_type === 'mobile' || booking?.is_at_home ? 'mobile' : 'shop';
  const isGroup = booking?.is_group === true || booking?.booking_type === 'group';
  return {
    shopId,
    context: shopId ? 'shop' : 'independent',
    visitType,
    isGroup,
  };
}

/** @param {Record<string, unknown>} booking */
export function canRebookBooking(booking) {
  return !!(booking?.barber_id);
}

/**
 * Build BookingFlow query params from a past booking (all provider types).
 * @param {Record<string, unknown>} booking
 */
export function buildRebookSearchParams(booking) {
  const params = new URLSearchParams();
  if (booking?.barber_id) params.set('barberId', String(booking.barber_id));

  const { shopId, context, visitType, isGroup } = resolveRebookContext(booking);
  if (shopId) params.set('shopId', shopId);
  if (context === 'independent') params.set('context', 'independent');
  if (visitType === 'mobile') params.set('location', 'mobile');
  if (isGroup) params.set('group', '1');

  const serviceIds = extractServiceIdsFromBooking(booking);
  if (serviceIds.length === 1) {
    params.set('serviceId', serviceIds[0]);
  } else if (serviceIds.length > 1) {
    params.set('serviceIds', serviceIds.join(','));
  }

  params.set('rebook', '1');
  if (booking?.id) params.set('fromBooking', String(booking.id));

  return params;
}

/**
 * Persist address / group hints for BookingFlow (not in URL).
 * @param {Record<string, unknown>} booking
 */
export function saveRebookPrefill(booking) {
  if (typeof window === 'undefined') return;
  const payload = {
    fromBookingId: booking?.id ?? null,
    address: booking?.location_text || booking?.location || '',
    client_latitude: booking?.client_latitude ?? null,
    client_longitude: booking?.client_longitude ?? null,
    is_group: booking?.is_group === true || booking?.booking_type === 'group',
    party_size: booking?.party_size ?? null,
    group_event_label: booking?.group_event_label ?? '',
    payment_method: booking?.payment_method ?? 'online',
    barber_name: booking?.barber_name ?? null,
  };
  sessionStorage.setItem(REBOOK_PREFILL_KEY, JSON.stringify(payload));
}

/** @returns {Record<string, unknown> | null} */
export function loadRebookPrefill() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(REBOOK_PREFILL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearRebookPrefill() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(REBOOK_PREFILL_KEY);
}

/**
 * @param {Record<string, unknown>} booking
 * @param {(path: string) => string} createPageUrl
 */
export function buildRebookPath(booking, createPageUrl) {
  const qs = buildRebookSearchParams(booking);
  return `${createPageUrl('BookingFlow')}?${qs.toString()}`;
}

/**
 * Merge API rebook payload onto list booking row.
 * @param {Record<string, unknown>} booking
 * @param {Record<string, unknown>} payload
 */
export function mergeRebookPayload(booking, payload) {
  return {
    ...booking,
    ...payload,
    barber_id: payload.barber_id ?? booking.barber_id,
    shop_id: payload.shop_id ?? booking.shop_id,
    rebook_service_ids: payload.service_ids ?? payload.rebook_service_ids ?? booking.rebook_service_ids,
  };
}
