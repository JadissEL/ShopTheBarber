import { z } from 'zod';

/**
 * CLIENT DOMAIN - Booking & Profile Forms
 */

export const bookingServiceSchema = z.object({
    serviceIds: z.array(z.string()).min(1, 'Select at least one service'),
    category: z.string().optional()
});

export const bookingDateTimeSchema = z.object({
    date: z.date({ invalid_type_error: 'Please select a valid date' }).refine(d => d > new Date(), 'Cannot book in the past'),
    time: z.string().min(1, 'Please select a time').regex(/^\d{1,2}:\d{2}\s(AM|PM)$/, 'Invalid time format')
});

export const bookingPreferencesSchema = z.object({
    address: z.string().max(255, 'Address too long').optional().or(z.literal('')),
    minRating: z.number().min(0).max(5).optional(),
    locationType: z.enum(['any', 'shop', 'mobile']).optional(),
    providerType: z.enum(['all', 'freelancer', 'shop']).optional(),
    acceptanceType: z.enum(['all', 'auto', 'manual']).optional(),
    sortBy: z.enum(['global_score', 'price', 'distance', 'rating']).optional()
});

export const bookingConfirmationSchema = z.object({
    customerNotes: z.string().max(500, 'Notes must be under 500 characters').optional().or(z.literal('')),
    promoCode: z.string().max(50, 'Invalid promo code format').optional().or(z.literal(''))
});

export const clientProfileSchema = z.object({
    full_name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
    email: z.string().email('Invalid email address'),
    phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits').optional().or(z.literal('')),
    address: z.string().max(255, 'Address too long').optional().or(z.literal(''))
});

/**
 * PROVIDER DOMAIN - Shop & Service Management Forms
 */

export const shopDetailsSchema = z.object({
    name: z.string().min(2, 'Shop name must be at least 2 characters').max(100, 'Shop name too long'),
    location: z.string().min(5, 'Location is required').max(255, 'Location too long'),
    description: z.string().max(1000, 'Description too long').optional().or(z.literal('')),
    phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits').optional().or(z.literal('')),
    website: z.string().url('Invalid URL').optional().or(z.literal('')),
    amenities: z.array(z.string()).optional()
});

export const serviceSchema = z.object({
    name: z.string().min(2, 'Service name required').max(100, 'Service name too long'),
    description: z.string().max(500, 'Description too long').optional().or(z.literal('')),
    price: z.number().min(0, 'Price must be positive').max(9999, 'Price too high'),
    duration_min: z.number().min(5, 'Duration must be at least 5 minutes').max(480, 'Duration max 8 hours'),
    category: z.enum(['Hair', 'Beard', 'Shave', 'Styling', 'Kids', 'Packages'], { errorMap: () => ({ message: 'Select a valid category' }) }),
    image_url: z.string().url('Invalid image URL').optional().or(z.literal(''))
});

export const promotionSchema = z.object({
    title: z.string().min(2, 'Title required').max(100, 'Title too long'),
    description: z.string().max(500, 'Description too long').optional().or(z.literal('')),
    code: z.string().min(2, 'Code required').max(20, 'Code too long').regex(/^[A-Z0-9-]+$/, 'Code must be uppercase alphanumeric'),
    discount_text: z.string().min(1, 'Discount required').max(50, 'Invalid discount format'),
    expiry_date: z.date().refine(d => d > new Date(), 'Expiry date must be in future'),
    type: z.enum(['barber', 'shop', 'platform_targeted', 'general']).optional()
});

export const shiftsSchema = z.object({
    day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
    start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format HH:MM'),
    end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format HH:MM')
}).refine(data => data.start_time < data.end_time, {
    message: 'End time must be after start time',
    path: ['end_time']
});

export const timeBlockSchema = z.object({
    start_datetime: z.date(),
    end_datetime: z.date(),
    reason: z.enum(['personal', 'vacation', 'sick', 'maintenance', 'shop_closed', 'other']),
    note: z.string().max(200, 'Note too long').optional().or(z.literal('')),
    is_paid_leave: z.boolean().optional()
}).refine(data => data.end_datetime > data.start_datetime, {
    message: 'End date must be after start date',
    path: ['end_datetime']
});

export const barberProfileSchema = z.object({
    name: z.string().min(2, 'Name required').max(100, 'Name too long'),
    title: z.string().max(50, 'Title too long').optional().or(z.literal('')),
    bio: z.string().max(500, 'Bio too long').optional().or(z.literal('')),
    years_experience: z.number().min(0).max(70).optional(),
    instagram_handle: z.string().max(30, 'Instagram handle too long').optional().or(z.literal('')),
    image_url: z.string().url('Invalid image URL').optional().or(z.literal('')),
    offers_mobile_service: z.boolean().optional()
});

/**
 * ADMIN DOMAIN - Platform Management Forms
 */

export const pricingRuleSchema = z.object({
    name: z.string().min(2, 'Name required').max(100, 'Name too long'),
    commission_freelancer: z.number().min(0).max(1, 'Commission must be 0-100%'),
    commission_shop: z.number().min(0).max(1, 'Commission must be 0-100%'),
    payout_frequency: z.enum(['weekly', 'biweekly', 'monthly']).optional(),
    is_active: z.boolean().optional()
});

export const disputeSchema = z.object({
    reason: z.string().min(10, 'Reason must be at least 10 characters').max(500, 'Reason too long'),
    amount: z.number().min(0, 'Amount must be positive'),
    status: z.enum(['Open', 'In Review', 'Resolved']).optional()
});

/**
 * SHARED - Authentication & Support
 */

export const emailSchema = z.string().email('Invalid email address');

export const passwordSchema = z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain special character');

export const contactFormSchema = z.object({
    name: z.string().min(2, 'Name required').max(100, 'Name too long'),
    email: emailSchema,
    subject: z.string().min(5, 'Subject required').max(100, 'Subject too long'),
    message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message too long')
});

export const messageSchema = z.object({
    content: z.string().min(1, 'Message cannot be empty').max(1000, 'Message too long'),
    receiver_email: emailSchema
});

/**
 * TYPE EXPORTS - Use for form props
 */
export type BookingServiceInput = z.infer<typeof bookingServiceSchema>;
export type BookingDateTimeInput = z.infer<typeof bookingDateTimeSchema>;
export type BookingPreferencesInput = z.infer<typeof bookingPreferencesSchema>;
export type BookingConfirmationInput = z.infer<typeof bookingConfirmationSchema>;
export type ClientProfileInput = z.infer<typeof clientProfileSchema>;
export type ShopDetailsInput = z.infer<typeof shopDetailsSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type PromotionInput = z.infer<typeof promotionSchema>;
export type ShiftsInput = z.infer<typeof shiftsSchema>;
export type TimeBlockInput = z.infer<typeof timeBlockSchema>;
export type BarberProfileInput = z.infer<typeof barberProfileSchema>;
export type PricingRuleInput = z.infer<typeof pricingRuleSchema>;
export type DisputeInput = z.infer<typeof disputeSchema>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
