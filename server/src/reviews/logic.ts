import { prisma } from '../db/prisma';

export type ReviewTargetType = 'barber' | 'shop';

export type SubmitReviewInput = {
    booking_id: string;
    reviewer_id: string;
    target_type: ReviewTargetType;
    rating: number;
    content?: string | null;
};

export type SubmitGuestReviewInput = {
    token: string;
    target_type: ReviewTargetType;
    rating: number;
    content?: string | null;
};

export type PublicReview = {
    id: string;
    rating: number;
    content: string | null;
    created_at: string | null;
    target_type: string;
    author_name: string;
    author_avatar: string | null;
};

function normalizeTargetType(value: string | undefined): ReviewTargetType {
    if (value === 'shop') return 'shop';
    return 'barber';
}

function validateRating(rating: number): void {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        throw new Error('Rating must be an integer from 1 to 5');
    }
}

async function updateBarberRating(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0], barberId: string, rating: number) {
    await tx.$executeRaw`
        UPDATE barbers
        SET rating = ROUND(
                ((COALESCE(rating, 0) * COALESCE(review_count, 0)) + ${rating})::numeric
                / (COALESCE(review_count, 0) + 1)::numeric,
                1
            ),
            review_count = COALESCE(review_count, 0) + 1
        WHERE id = ${barberId}
    `;
}

async function updateShopRating(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0], shopId: string, rating: number) {
    await tx.$executeRaw`
        UPDATE shops
        SET rating = ROUND(
                ((COALESCE(rating, 0) * COALESCE(review_count, 0)) + ${rating})::numeric
                / (COALESCE(review_count, 0) + 1)::numeric,
                1
            ),
            review_count = COALESCE(review_count, 0) + 1
        WHERE id = ${shopId}
    `;
}

export async function submitReview(input: SubmitReviewInput) {
    const targetType = normalizeTargetType(input.target_type);
    validateRating(input.rating);

    if (!input.booking_id || !input.reviewer_id) {
        throw new Error('Missing required fields for review');
    }

    const content = input.content?.trim() || null;
    if (content && content.length > 2000) {
        throw new Error('Review must be 2000 characters or less');
    }

    return await prisma.$transaction(async (tx) => {
        const booking = await tx.bookings.findUnique({ where: { id: input.booking_id } });
        if (!booking) throw new Error('Booking not found');
        if (booking.status !== 'completed') {
            throw new Error('Only completed bookings can be reviewed');
        }
        if (booking.client_id !== input.reviewer_id) {
            throw new Error('You can only review your own bookings');
        }

        return insertReviewForBooking(
            tx,
            booking,
            targetType,
            input.rating,
            content,
            input.reviewer_id
        );
    });
}

export async function getBookingReviewStatus(bookingId: string, userId: string) {
    const booking = await prisma.bookings.findUnique({ where: { id: bookingId } });
    if (!booking) throw new Error('Booking not found');
    if (booking.client_id !== userId) {
        throw new Error('Unauthorized');
    }

    const reviews = await prisma.reviews.findMany({
        where: { booking_id: bookingId },
        select: { id: true, target_type: true, rating: true, created_at: true },
    });

    const barberReview = reviews.find((r) => r.target_type === 'barber') ?? null;
    const shopReview = reviews.find((r) => r.target_type === 'shop') ?? null;

    return {
        booking_id: bookingId,
        can_review: booking.status === 'completed',
        shop_available: !!booking.shop_id,
        barber: {
            submitted: !!barberReview,
            review: barberReview,
        },
        shop: {
            submitted: !!shopReview,
            review: shopReview,
            available: !!booking.shop_id,
        },
        all_done: !!barberReview && (!booking.shop_id || !!shopReview),
    };
}

async function insertReviewForBooking(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    booking: { id: string; barber_id: string; shop_id: string | null; client_id: string | null },
    targetType: ReviewTargetType,
    rating: number,
    content: string | null,
    reviewerId: string | null
) {
    let targetId: string;
    if (targetType === 'barber') {
        targetId = booking.barber_id;
    } else {
        if (!booking.shop_id) {
            throw new Error('This booking has no shop to review');
        }
        targetId = booking.shop_id;
    }

    const existing = await tx.reviews.findFirst({
        where: {
            booking_id: booking.id,
            target_type: targetType,
        },
    });
    if (existing) {
        throw new Error(`A ${targetType} review was already submitted for this booking`);
    }

    const newReview = await tx.reviews.create({
        data: {
            booking_id: booking.id,
            reviewer_id: reviewerId,
            target_type: targetType,
            target_id: targetId,
            rating,
            content,
            created_at: new Date().toISOString(),
        },
    });

    if (targetType === 'barber') {
        await updateBarberRating(tx, targetId, rating);
    } else {
        await updateShopRating(tx, targetId, rating);
    }

    await tx.audit_logs.create({
        data: {
            action: 'REVIEW_SUBMITTED',
            resource_type: targetType === 'barber' ? 'Barber' : 'Shop',
            resource_id: targetId,
            actor_id: reviewerId ?? 'guest',
            details: JSON.stringify({
                review_id: newReview.id,
                rating,
                booking_id: booking.id,
                target_type: targetType,
                guest: !reviewerId,
            }),
        },
    });

    return newReview;
}

export async function submitReviewByToken(input: SubmitGuestReviewInput) {
    const targetType = normalizeTargetType(input.target_type);
    validateRating(input.rating);

    if (!input.token || input.token.length < 20) {
        throw new Error('Invalid review link');
    }

    const content = input.content?.trim() || null;
    if (content && content.length > 2000) {
        throw new Error('Review must be 2000 characters or less');
    }

    return await prisma.$transaction(async (tx) => {
        const booking = await tx.bookings.findFirst({
            where: { review_request_token: input.token, status: 'completed' },
        });
        if (!booking) throw new Error('Review link not found or expired');

        if (booking.client_id) {
            throw new Error('Sign in to leave a review for this booking');
        }

        return insertReviewForBooking(tx, booking, targetType, input.rating, content, null);
    });
}

export type FeaturedHomeReview = PublicReview & {
    target_id: string;
    target_name: string;
    profile_path: string | null;
};

/** Top-rated reviews with text for homepage social proof */
export async function listFeaturedHomeReviews(limit = 6): Promise<FeaturedHomeReview[]> {
    const take = Math.min(Math.max(limit, 1), 12);
    const rows = await prisma.reviews.findMany({
        where: {
            rating: { gte: 4 },
            content: { not: null },
        },
        orderBy: [{ rating: 'desc' }, { created_at: 'desc' }],
        take: take * 2,
    });

    const withText = rows.filter((r) => (r.content?.trim().length ?? 0) >= 12).slice(0, take);
    if (withText.length === 0) return [];

    const reviewerIds = [...new Set(withText.map((r) => r.reviewer_id).filter(Boolean))] as string[];
    const barberIds = withText.filter((r) => r.target_type === 'barber').map((r) => r.target_id);
    const shopIds = withText.filter((r) => r.target_type === 'shop').map((r) => r.target_id);

    const [users, barbers, shops] = await Promise.all([
        reviewerIds.length
            ? prisma.users.findMany({
                  where: { id: { in: reviewerIds } },
                  select: { id: true, full_name: true, avatar_url: true },
              })
            : [],
        barberIds.length
            ? prisma.barbers.findMany({
                  where: { id: { in: barberIds } },
                  select: { id: true, name: true, image_url: true },
              })
            : [],
        shopIds.length
            ? prisma.shops.findMany({
                  where: { id: { in: shopIds } },
                  select: { id: true, name: true, image_url: true },
              })
            : [],
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));
    const barberMap = new Map(barbers.map((b) => [b.id, b]));
    const shopMap = new Map(shops.map((s) => [s.id, s]));

    return withText.map((row) => {
        const reviewer = row.reviewer_id ? userMap.get(row.reviewer_id) : undefined;
        const barber = row.target_type === 'barber' ? barberMap.get(row.target_id) : undefined;
        const shop = row.target_type === 'shop' ? shopMap.get(row.target_id) : undefined;
        const targetName = barber?.name ?? shop?.name ?? 'Your barber';
        const profilePath =
            row.target_type === 'barber'
                ? `BarberProfile?id=${row.target_id}`
                : row.target_type === 'shop'
                  ? `ShopProfile?id=${row.target_id}`
                  : null;

        return {
            id: row.id,
            rating: row.rating ?? 5,
            content: row.content,
            created_at: row.created_at,
            target_type: row.target_type,
            author_name: reviewer?.full_name ?? 'Verified Client',
            author_avatar: reviewer?.avatar_url ?? barber?.image_url ?? shop?.image_url ?? null,
            target_id: row.target_id,
            target_name: targetName,
            profile_path: profilePath,
        };
    });
}

export async function listPublicReviews(options: {
    target_type: ReviewTargetType;
    target_id: string;
    limit?: number;
    offset?: number;
    min_rating?: number;
}): Promise<PublicReview[]> {
    const take = Math.min(Math.max(options.limit ?? 20, 1), 100);
    const skip = Math.max(options.offset ?? 0, 0);

    const rows = await prisma.reviews.findMany({
        where: {
            target_type: options.target_type,
            target_id: options.target_id,
            ...(options.min_rating != null ? { rating: { gte: options.min_rating } } : {}),
        },
        orderBy: { created_at: 'desc' },
        take,
        skip,
    });

    const reviewerIds = [...new Set(rows.map((r) => r.reviewer_id).filter(Boolean))] as string[];
    const users =
        reviewerIds.length > 0
            ? await prisma.users.findMany({
                  where: { id: { in: reviewerIds } },
                  select: { id: true, full_name: true, avatar_url: true },
              })
            : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    return rows.map((row) => {
        const reviewer = row.reviewer_id ? userMap.get(row.reviewer_id) : undefined;
        return {
            id: row.id,
            rating: row.rating ?? 5,
            content: row.content,
            created_at: row.created_at,
            target_type: row.target_type,
            author_name: reviewer?.full_name ?? 'Verified Client',
            author_avatar: reviewer?.avatar_url ?? null,
        };
    });
}

/** Reviews for provider dashboard: shop reviews + reviews for barbers at that shop */
export async function listProviderReviews(options: {
    shop_id?: string | null;
    barber_id?: string | null;
    min_rating?: number;
    limit?: number;
    offset?: number;
}): Promise<PublicReview[]> {
    const take = Math.min(Math.max(options.limit ?? 20, 1), 100);
    const skip = Math.max(options.offset ?? 0, 0);

    const or: Array<{ target_type: string; target_id: string }> = [];

    if (options.shop_id) {
        or.push({ target_type: 'shop', target_id: options.shop_id });
        const barbers = await prisma.barbers.findMany({
            where: { shop_id: options.shop_id },
            select: { id: true },
        });
        for (const b of barbers) {
            or.push({ target_type: 'barber', target_id: b.id });
        }
    } else if (options.barber_id) {
        or.push({ target_type: 'barber', target_id: options.barber_id });
    }

    if (or.length === 0) return [];

    const rows = await prisma.reviews.findMany({
        where: {
            OR: or,
            ...(options.min_rating != null ? { rating: { gte: options.min_rating } } : {}),
        },
        orderBy: { created_at: 'desc' },
        take,
        skip,
    });

    const reviewerIds = [...new Set(rows.map((r) => r.reviewer_id).filter(Boolean))] as string[];
    const users =
        reviewerIds.length > 0
            ? await prisma.users.findMany({
                  where: { id: { in: reviewerIds } },
                  select: { id: true, full_name: true, avatar_url: true },
              })
            : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    return rows.map((row) => {
        const reviewer = row.reviewer_id ? userMap.get(row.reviewer_id) : undefined;
        return {
            id: row.id,
            rating: row.rating ?? 5,
            content: row.content,
            created_at: row.created_at,
            target_type: row.target_type,
            author_name: reviewer?.full_name ?? 'Verified Client',
            author_avatar: reviewer?.avatar_url ?? null,
        };
    });
}
