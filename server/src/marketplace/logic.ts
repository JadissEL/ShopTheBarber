import type { products } from '@prisma/client';
import { prisma } from '../db/prisma';

export const PRODUCT_STATUSES = ['draft', 'pending_review', 'published', 'rejected'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const PRODUCT_CATEGORIES = ['hair', 'skincare', 'beard', 'tools', 'fragrance', 'styling'] as const;

export const SELLER_TYPES = ['barber', 'shop', 'platform', 'vendor'] as const;
export type SellerType = (typeof SELLER_TYPES)[number];

export const PRODUCT_SELLER_ROLES = ['barber', 'shop_owner', 'admin'] as const;

export type AuthUser = { id: string; email?: string; role?: string };

export function canListProducts(role?: string | null): boolean {
    return role === 'barber' || role === 'shop_owner' || role === 'admin';
}

export function isAdmin(role?: string | null): boolean {
    return role === 'admin';
}

export function authorCanEdit(status?: string | null): boolean {
    return status === 'draft' || status === 'rejected';
}

export function authorCanDelete(status?: string | null): boolean {
    return status === 'draft' || status === 'rejected';
}

export function authorCanSubmit(status?: string | null): boolean {
    return status === 'draft' || status === 'rejected';
}

export function serializeProduct(row: products & { vendor_name?: string | null }) {
    return row;
}

export async function getSellerProfiles(userId: string): Promise<{ barberIds: string[]; shopIds: string[] }> {
    const [barberRows, shopRows] = await Promise.all([
        prisma.barbers.findMany({ where: { user_id: userId }, select: { id: true } }),
        prisma.shops.findMany({ where: { owner_id: userId }, select: { id: true } }),
    ]);
    return {
        barberIds: barberRows.map((r) => r.id),
        shopIds: shopRows.map((r) => r.id),
    };
}

export type ProductWriteInput = {
    name?: string;
    description?: string;
    price?: number;
    category?: string;
    image_url?: string;
    stock?: number;
    seller_type?: string;
    barber_id?: string;
    shop_id?: string;
    vendor_name?: string;
    brand_id?: string;
};

const NAME_MIN = 2;
const NAME_MAX = 120;
const DESC_MIN_SUBMIT = 20;
const DESC_MAX = 5000;
const PRICE_MAX = 100000;

export function normalizeCategory(category?: string | null): string | null {
    if (category == null || category === '') return null;
    const c = category.toLowerCase().trim();
    if (!(PRODUCT_CATEGORIES as readonly string[]).includes(c)) {
        throw new Error(`Invalid category. Allowed: ${PRODUCT_CATEGORIES.join(', ')}`);
    }
    return c;
}

export function validateDraftPayload(input: ProductWriteInput): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    if (input.name !== undefined) {
        const n = String(input.name).trim();
        if (n.length < NAME_MIN || n.length > NAME_MAX) {
            throw new Error(`Name must be between ${NAME_MIN} and ${NAME_MAX} characters`);
        }
        data.name = n;
    }
    if (input.description !== undefined) {
        const d = String(input.description).trim();
        if (d.length > DESC_MAX) throw new Error(`Description must be at most ${DESC_MAX} characters`);
        data.description = d || null;
    }
    if (input.price !== undefined) {
        const p = Number(input.price);
        if (!Number.isFinite(p) || p <= 0 || p > PRICE_MAX) {
            throw new Error(`Price must be between 0.01 and ${PRICE_MAX}`);
        }
        data.price = Math.round(p * 100) / 100;
    }
    if (input.category !== undefined) {
        data.category = normalizeCategory(input.category);
    }
    if (input.image_url !== undefined) {
        data.image_url = String(input.image_url).trim() || null;
    }
    if (input.stock !== undefined) {
        const s = Math.floor(Number(input.stock));
        if (!Number.isFinite(s) || s < 0 || s > 99999) {
            throw new Error('Stock must be between 0 and 99999');
        }
        data.stock = s;
    }
    return data;
}

export function validateSubmitReady(product: Pick<products, 'name' | 'description' | 'price' | 'category' | 'stock'>): void {
    const name = (product.name || '').trim();
    const description = (product.description || '').trim();
    if (name.length < NAME_MIN) throw new Error('Product name is required before submitting');
    if (description.length < DESC_MIN_SUBMIT) {
        throw new Error(`Description must be at least ${DESC_MIN_SUBMIT} characters before submitting`);
    }
    if (!product.price || product.price <= 0) throw new Error('Valid price is required before submitting');
    normalizeCategory(product.category);
    if (!product.category) throw new Error('Category is required before submitting');
    if ((product.stock ?? 0) < 1) throw new Error('Stock must be at least 1 before submitting');
}

export async function resolveSellerFields(
    user: AuthUser,
    input: ProductWriteInput
): Promise<{
    seller_type: SellerType;
    barber_id: string | null;
    shop_id: string | null;
    vendor_name: string | null;
    brand_id: string | null;
}> {
    const profiles = await getSellerProfiles(user.id);

    if (isAdmin(user.role)) {
        const st = (input.seller_type || 'platform') as SellerType;
        if (!(SELLER_TYPES as readonly string[]).includes(st)) {
            throw new Error(`Invalid seller_type. Allowed: ${SELLER_TYPES.join(', ')}`);
        }
        if (st === 'barber') {
            if (!input.barber_id) throw new Error('barber_id is required for barber listings');
            return {
                seller_type: st,
                barber_id: input.barber_id,
                shop_id: null,
                vendor_name: null,
                brand_id: input.brand_id ?? null,
            };
        }
        if (st === 'shop') {
            if (!input.shop_id) throw new Error('shop_id is required for shop listings');
            return {
                seller_type: st,
                barber_id: null,
                shop_id: input.shop_id,
                vendor_name: null,
                brand_id: input.brand_id ?? null,
            };
        }
        if (st === 'vendor') {
            if (!input.vendor_name?.trim()) throw new Error('vendor_name is required for vendor listings');
            return {
                seller_type: st,
                barber_id: null,
                shop_id: null,
                vendor_name: input.vendor_name.trim(),
                brand_id: input.brand_id ?? null,
            };
        }
        return {
            seller_type: 'platform',
            barber_id: null,
            shop_id: null,
            vendor_name: null,
            brand_id: null,
        };
    }

    if (user.role === 'barber') {
        const barberId = input.barber_id || profiles.barberIds[0];
        if (!barberId || !profiles.barberIds.includes(barberId)) {
            throw new Error('You must list products under your barber profile');
        }
        return {
            seller_type: 'barber',
            barber_id: barberId,
            shop_id: null,
            vendor_name: null,
            brand_id: null,
        };
    }

    if (user.role === 'shop_owner') {
        const shopId = input.shop_id || profiles.shopIds[0];
        if (!shopId || !profiles.shopIds.includes(shopId)) {
            throw new Error('You must list products under a shop you own');
        }
        return {
            seller_type: 'shop',
            barber_id: null,
            shop_id: shopId,
            vendor_name: null,
            brand_id: null,
        };
    }

    throw new Error('Only barbers, shop owners, and admins can list marketplace products');
}

export async function userOwnsProduct(user: AuthUser, row: products): Promise<boolean> {
    if (isAdmin(user.role)) return true;
    if (row.created_by === user.id) return true;
    const profiles = await getSellerProfiles(user.id);
    if (row.barber_id && profiles.barberIds.includes(row.barber_id)) return true;
    if (row.shop_id && profiles.shopIds.includes(row.shop_id)) return true;
    return false;
}

export async function getProductForUser(id: string, user: AuthUser | null): Promise<products | null> {
    const row = await prisma.products.findUnique({ where: { id } });
    if (!row) return null;
    if (row.status === 'published' && row.published === true) return row;
    if (!user) return null;
    if (await userOwnsProduct(user, row)) return row;
    return null;
}

export function stripPrivilegedFields(data: Record<string, unknown>): Record<string, unknown> {
    const blocked = new Set([
        'id',
        'status',
        'published',
        'featured',
        'rejection_reason',
        'submitted_at',
        'reviewed_at',
        'reviewed_by',
        'created_by',
        'created_at',
        'updated_at',
        'seller_type',
        'barber_id',
        'shop_id',
        'vendor_name',
        'brand_id',
    ]);
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
        if (!blocked.has(k)) out[k] = v;
    }
    return out;
}

export async function enrichProducts(rows: products[]) {
    const barberIds = [...new Set(rows.map((r) => r.barber_id).filter(Boolean))] as string[];
    const shopIds = [...new Set(rows.map((r) => r.shop_id).filter(Boolean))] as string[];
    const brandIds = [...new Set(rows.map((r) => r.brand_id).filter(Boolean))] as string[];

    const [barbers, shops, brands] = await Promise.all([
        barberIds.length ? prisma.barbers.findMany({ where: { id: { in: barberIds } }, select: { id: true, name: true } }) : [],
        shopIds.length ? prisma.shops.findMany({ where: { id: { in: shopIds } }, select: { id: true, name: true } }) : [],
        brandIds.length ? prisma.brands.findMany({ where: { id: { in: brandIds } }, select: { id: true, name: true } }) : [],
    ]);

    const barberMap = Object.fromEntries(barbers.map((b) => [b.id, b.name]));
    const shopMap = Object.fromEntries(shops.map((s) => [s.id, s.name]));
    const brandMap = Object.fromEntries(brands.map((b) => [b.id, b.name]));

    return rows.map((row) => {
        const displayVendor =
            row.vendor_name ||
            (row.shop_id ? shopMap[row.shop_id] : null) ||
            (row.barber_id ? barberMap[row.barber_id] : null) ||
            (row.brand_id ? brandMap[row.brand_id] : null) ||
            (row.seller_type === 'platform' ? 'ShopTheBarber' : null);
        return {
            ...row,
            vendor_name: displayVendor,
        };
    });
}
