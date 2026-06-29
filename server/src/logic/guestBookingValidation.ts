export type GuestContactInput = {
    guest_name?: string;
    guest_phone?: string;
    guest_email?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeGuestContact(input: GuestContactInput): {
    guest_name: string;
    guest_phone: string;
    guest_email: string | null;
} {
    const guest_name = (input.guest_name ?? '').trim();
    const guest_phone = (input.guest_phone ?? '').trim().replace(/\s+/g, ' ');
    const guest_email_raw = (input.guest_email ?? '').trim().toLowerCase();
    const guest_email = guest_email_raw.length > 0 ? guest_email_raw : null;
    return { guest_name, guest_phone, guest_email };
}

export function validateGuestContact(input: GuestContactInput): string | null {
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
