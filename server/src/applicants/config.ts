export const CREDENTIAL_TYPES = ['cv', 'certificate', 'portfolio'] as const;

export const ALLOWED_MIME_TYPES = new Set([
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
]);

export const MAX_CREDENTIAL_BYTES = 5 * 1024 * 1024; // 5 MB

export const PREFERRED_JOB_TYPES = [
    { id: 'full_time', label: 'Full-time' },
    { id: 'part_time', label: 'Part-time' },
    { id: 'contract', label: 'Contract' },
    { id: 'freelance', label: 'Freelance' },
] as const;

export const AVAILABILITY_OPTIONS = [
    { id: 'immediate', label: 'Available immediately' },
    { id: 'two_weeks', label: 'Within 2 weeks' },
    { id: 'one_month', label: 'Within 1 month' },
    { id: 'flexible', label: 'Flexible / open to discuss' },
] as const;

export const STYLING_SKILLS_SUGGESTIONS = [
    'Hair cutting',
    'Fades',
    'Beard grooming',
    'Color / highlights',
    'Styling',
    'Hot towel shave',
    'Scissor work',
    'Client consultation',
    'Shop management',
    'Hygiene & safety',
] as const;
