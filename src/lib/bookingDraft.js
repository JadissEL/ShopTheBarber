/** Session key for in-progress booking wizard state (survives auth redirect). */
export const BOOKING_DRAFT_KEY = 'stb_booking_draft';
export const BOOKING_DRAFT_VERSION = 1;
/** Discard stale drafts after 24h. */
export const BOOKING_DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * @param {number} stepIndex
 * @param {boolean} hasBarber
 * @returns {string}
 */
export function stepToSlug(stepIndex, hasBarber) {
  if (hasBarber) {
    if (stepIndex === 1) return 'datetime';
    if (stepIndex === 2) return 'confirm';
    return 'services';
  }
  if (stepIndex === 1) return 'datetime';
  if (stepIndex === 2) return 'preferences';
  if (stepIndex === 3) return 'results';
  return 'services';
}

/**
 * @param {string | null | undefined} slug
 * @param {boolean} hasBarber
 * @returns {number}
 */
export function slugToStep(slug, hasBarber) {
  if (!slug) return 0;
  const s = slug.toLowerCase();
  if (s === 'datetime' || s === '1') return 1;
  if (s === 'preferences' || s === '2') return hasBarber ? 1 : 2;
  if (s === 'results') return hasBarber ? 2 : 3;
  if (s === 'confirm' || s === 'confirmation' || s === '3') return hasBarber ? 2 : 3;
  return 0;
}

/**
 * @param {URLSearchParams | string} searchOrParams
 * @param {boolean} hasBarber
 * @returns {number}
 */
export function resolveStepFromSearch(searchOrParams, hasBarber) {
  const params =
    typeof searchOrParams === 'string'
      ? new URLSearchParams(searchOrParams.startsWith('?') ? searchOrParams.slice(1) : searchOrParams)
      : searchOrParams;
  return slugToStep(params.get('step'), hasBarber);
}

/**
 * @param {Record<string, unknown>} draft
 * @returns {string} query string without leading `?`
 */
export function buildBookingSearchParams(draft) {
  const params = new URLSearchParams();

  if (draft.barberId) params.set('barberId', String(draft.barberId));
  if (draft.shopId) params.set('shopId', String(draft.shopId));
  if (draft.context === 'independent') params.set('context', 'independent');
  if (draft.groupMode) params.set('group', '1');

  if (draft.locationType === 'mobile') params.set('location', 'mobile');
  else if (draft.locationType === 'shop') params.set('location', 'shop');

  if (draft.selectedCategory) params.set('category', String(draft.selectedCategory));

  const services = Array.isArray(draft.selectedServices) ? draft.selectedServices : [];
  if (services.length === 1) params.set('serviceId', String(services[0]));
  else if (services.length > 1) params.set('serviceIds', services.map(String).join(','));

  const hasBarber = draft.isSpecificBarber ?? !!draft.barberId;
  const stepIndex = typeof draft.currentStep === 'number' ? draft.currentStep : 0;
  const slug = stepToSlug(stepIndex, hasBarber);
  if (slug && slug !== 'services') params.set('step', slug);

  if (draft.selectedDate) {
    const iso =
      typeof draft.selectedDate === 'string'
        ? draft.selectedDate
        : draft.selectedDate instanceof Date
          ? draft.selectedDate.toISOString()
          : null;
    if (iso) params.set('date', iso.slice(0, 10));
  }
  if (draft.selectedTime) params.set('time', String(draft.selectedTime));

  return params.toString();
}

/**
 * @param {Record<string, unknown>} draft
 * @param {(page: string) => string} [createPageUrl]
 * @returns {string}
 */
export function buildBookingReturnPath(draft, createPageUrl = (page) => `/${page.replace(/ /g, '-')}`) {
  const qs = buildBookingSearchParams(draft);
  const base = createPageUrl('BookingFlow');
  return qs ? `${base}?${qs}` : base;
}

/**
 * @param {Record<string, unknown>} draft
 */
export function saveBookingDraft(draft) {
  if (typeof window === 'undefined') return;
  const payload = {
    ...draft,
    version: BOOKING_DRAFT_VERSION,
    savedAt: Date.now(),
  };
  try {
    sessionStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota / private mode
  }
}

/** @returns {Record<string, unknown> | null} */
export function loadBookingDraft() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(BOOKING_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.savedAt && Date.now() - parsed.savedAt > BOOKING_DRAFT_TTL_MS) {
      clearBookingDraft();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearBookingDraft() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(BOOKING_DRAFT_KEY);
}

/**
 * @param {Record<string, unknown> | null | undefined} draft
 * @param {{ barberId?: string | null, shopId?: string | null }} ctx
 */
export function draftMatchesContext(draft, ctx) {
  if (!draft) return false;
  if (draft.barberId && ctx.barberId && String(draft.barberId) !== String(ctx.barberId)) return false;
  if (draft.shopId && ctx.shopId && String(draft.shopId) !== String(ctx.shopId)) return false;
  return true;
}

/**
 * Merge URL date/time params into draft restoration hints.
 * @param {URLSearchParams} params
 */
export function parseDateTimeFromSearch(params) {
  const dateStr = params.get('date');
  const timeStr = params.get('time') || '';
  if (!dateStr) return { date: null, time: timeStr };
  const date = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(date.getTime())) return { date: null, time: timeStr };
  return { date, time: timeStr };
}
