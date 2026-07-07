import { prisma } from '../db/prisma';

const PLACEHOLDER_COMPANY_DESCRIPTION = 'Complete your company profile to start hiring.';

export async function getSellerProfileForUser(userId: string) {
    return prisma.seller_profiles.findUnique({ where: { user_id: userId } });
}

export async function updateSellerProfileForUser(
    userId: string,
    data: { display_name?: string },
) {
    const displayName = data.display_name?.trim();
    if (!displayName || displayName.length < 2) {
        throw new Error('Store name must be at least 2 characters');
    }

    const existing = await getSellerProfileForUser(userId);
    if (existing) {
        return prisma.seller_profiles.update({
            where: { user_id: userId },
            data: { display_name: displayName },
        });
    }

    return prisma.seller_profiles.create({
        data: {
            id: crypto.randomUUID(),
            user_id: userId,
            display_name: displayName,
            seller_type: 'vendor',
        },
    });
}

export async function getCompanyProfileForUser(userId: string) {
    const account = await prisma.company_accounts.findUnique({
        where: { user_id: userId },
        include: { company: true },
    });
    if (!account) return null;
    return {
        company_id: account.company_id,
        ...account.company,
    };
}

export async function updateCompanyProfileForUser(
    userId: string,
    data: {
        name?: string;
        description?: string;
        website?: string;
        logo_url?: string;
        location?: string;
    },
) {
    const account = await prisma.company_accounts.findUnique({
        where: { user_id: userId },
    });
    if (!account) {
        throw new Error('Company account not found');
    }

    const name = data.name?.trim();
    const description = data.description?.trim();
    if (!name || name.length < 2) {
        throw new Error('Company name must be at least 2 characters');
    }
    if (!description || description.length < 20) {
        throw new Error('Company description must be at least 20 characters');
    }

    return prisma.companies.update({
        where: { id: account.company_id },
        data: {
            name,
            description,
            website: data.website?.trim() || null,
            logo_url: data.logo_url?.trim() || null,
            location: data.location?.trim() || null,
        },
    });
}

export async function getAuthorProfileForUser(userId: string) {
    return prisma.author_profiles.findUnique({ where: { user_id: userId } });
}

export async function updateAuthorProfileForUser(
    userId: string,
    data: { pen_name?: string; bio?: string },
) {
    const penName = data.pen_name?.trim();
    const bio = data.bio?.trim();
    if (!penName || penName.length < 2) {
        throw new Error('Pen name must be at least 2 characters');
    }
    if (!bio || bio.length < 20) {
        throw new Error('Bio must be at least 20 characters');
    }

    const existing = await getAuthorProfileForUser(userId);
    if (existing) {
        return prisma.author_profiles.update({
            where: { user_id: userId },
            data: { pen_name: penName, bio },
        });
    }

    return prisma.author_profiles.create({
        data: {
            id: crypto.randomUUID(),
            user_id: userId,
            pen_name: penName,
            bio,
        },
    });
}

export function isPlaceholderCompanyDescription(value?: string | null): boolean {
    if (!value?.trim()) return true;
    return value.trim() === PLACEHOLDER_COMPANY_DESCRIPTION;
}
