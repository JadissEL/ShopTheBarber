const GUEST_CONTACT_KEY = 'stb_guest_booking_contact';
const GUEST_TOKEN_PREFIX = 'stb_guest_booking_token_';
const GUEST_CLAIM_TOKENS_KEY = 'stb_guest_booking_claim_tokens';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeGuestContact(input = {}) {
  const guest_name = (input.name ?? input.guest_name ?? '').trim();
  const guest_phone = (input.phone ?? input.guest_phone ?? '').trim().replace(/\s+/g, ' ');
  const emailRaw = (input.email ?? input.guest_email ?? '').trim().toLowerCase();
  const guest_email = emailRaw.length > 0 ? emailRaw : '';
  return { guest_name, guest_phone, guest_email };
}

export function validateGuestContact(input = {}) {
  const { guest_name, guest_phone, guest_email } = normalizeGuestContact(input);

  if (guest_name.length < 2) {
    return 'Please enter your name (at least 2 characters)';
  }
  if (guest_name.length > 120) {
    return 'Name is too long';
  }

  const phoneDigits = guest_phone.replace(/\D/g, '');
  if (phoneDigits.length < 8) {
    return 'Please enter a valid phone number';
  }
  if (guest_phone.length > 40) {
    return 'Phone number is too long';
  }

  if (guest_email && !EMAIL_RE.test(guest_email)) {
    return 'Please enter a valid email address';
  }

  return null;
}

export function loadGuestContact() {
  if (typeof window === 'undefined') return { guest_name: '', guest_phone: '', guest_email: '' };
  try {
    const raw = sessionStorage.getItem(GUEST_CONTACT_KEY);
    if (!raw) return { guest_name: '', guest_phone: '', guest_email: '' };
    const parsed = JSON.parse(raw);
    return normalizeGuestContact(parsed);
  } catch {
    return { guest_name: '', guest_phone: '', guest_email: '' };
  }
}

export function saveGuestContact(contact) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(GUEST_CONTACT_KEY, JSON.stringify(normalizeGuestContact(contact)));
  } catch {
    /* ignore quota errors */
  }
}

export function saveGuestBookingToken(bookingId, token) {
  if (typeof window === 'undefined' || !bookingId || !token) return;
  try {
    sessionStorage.setItem(`${GUEST_TOKEN_PREFIX}${bookingId}`, token);
    addGuestClaimToken(token);
  } catch {
    /* ignore */
  }
}

export function addGuestClaimToken(token) {
  if (typeof window === 'undefined' || !token) return;
  try {
    const existing = getPendingGuestClaimTokens();
    if (!existing.includes(token)) {
      existing.push(token);
      sessionStorage.setItem(GUEST_CLAIM_TOKENS_KEY, JSON.stringify(existing.slice(-10)));
    }
  } catch {
    /* ignore */
  }
}

export function getPendingGuestClaimTokens() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(GUEST_CLAIM_TOKENS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((t) => typeof t === 'string' && t.length >= 20) : [];
  } catch {
    return [];
  }
}

export function clearPendingGuestClaimTokens() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(GUEST_CLAIM_TOKENS_KEY);
  } catch {
    /* ignore */
  }
}

export async function claimPendingGuestBookings() {
  const tokens = getPendingGuestClaimTokens();
  const { sovereign } = await import('@/api/apiClient');
  const result = await sovereign.bookings.claimGuestBookings(tokens);
  if (result?.linked_count > 0) {
    clearPendingGuestClaimTokens();
  }
  return result;
}

export function getGuestManagePath(token) {
  if (!token) return null;
  return `/GuestBooking?token=${encodeURIComponent(token)}`;
}

export function isGuestBookingBlocked(paymentProtectionPreview, cashAvailability, paymentMethod, isAuthenticated = false) {
  if (isAuthenticated) {
    return { blocked: false, reason: null };
  }

  if (!cashAvailability?.accepts_cash) {
    return {
      blocked: true,
      reason: 'This barber requires online payment. Sign in for a free account to book with card.',
    };
  }

  const step = paymentProtectionPreview?.next_step;
  if (
    step &&
    step !== 'none' &&
    step !== 'full_payment' &&
    paymentMethod !== 'cash_at_store'
  ) {
    return {
      blocked: true,
      reason: 'Card protection requires an account. Sign in or choose pay-at-shop if available.',
    };
  }

  if (step === 'save_card' || step === 'deposit' || step === 'auth_hold') {
    return {
      blocked: true,
      reason: 'This barber requires a card on file. Sign in for a free account to complete booking.',
    };
  }

  return { blocked: false, reason: null };
}
