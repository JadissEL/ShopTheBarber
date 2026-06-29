import { randomUUID } from 'crypto';
import { prisma } from '../db/prisma';
import { getSellerProfiles } from '../marketplace/logic';

export const FULFILLMENT_STATUSES = ['confirmed', 'preparing', 'in_transit', 'delivered'] as const;
export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number];

export const PLATFORM_FREE_SHIPPING_MIN = 50;
export const PLATFORM_FLAT_SHIPPING = 5.99;

export type AddressInput = {
    label?: string;
    full_name: string;
    street: string;
    city: string;
    state?: string;
    zip: string;
    country?: string;
    phone?: string;
    is_default?: boolean;
};

function trim(s: string | undefined | null): string {
    return (s ?? '').trim();
}

export async function listSavedAddresses(userId: string) {
    return prisma.saved_addresses.findMany({
        where: { user_id: userId },
        orderBy: [{ is_default: 'desc' }, { created_at: 'desc' }],
    });
}

export async function getDefaultAddress(userId: string) {
    return prisma.saved_addresses.findFirst({
        where: { user_id: userId, is_default: true },
    });
}

export async function createSavedAddress(userId: string, input: AddressInput) {
    if (!trim(input.full_name) || !trim(input.street) || !trim(input.city) || !trim(input.zip)) {
        throw new Error('Full name, street, city, and zip are required');
    }
    const isDefault = input.is_default === true;
    if (isDefault) {
        await prisma.saved_addresses.updateMany({
            where: { user_id: userId },
            data: { is_default: false },
        });
    }
    const count = await prisma.saved_addresses.count({ where: { user_id: userId } });
    return prisma.saved_addresses.create({
        data: {
            id: randomUUID(),
            user_id: userId,
            label: trim(input.label) || 'Home',
            full_name: trim(input.full_name),
            street: trim(input.street),
            city: trim(input.city),
            state: trim(input.state) || null,
            zip: trim(input.zip),
            country: trim(input.country) || 'US',
            phone: trim(input.phone) || null,
            is_default: isDefault || count === 0,
        },
    });
}

export async function updateSavedAddress(userId: string, addressId: string, input: Partial<AddressInput>) {
    const existing = await prisma.saved_addresses.findFirst({
        where: { id: addressId, user_id: userId },
    });
    if (!existing) throw new Error('Address not found');

    if (input.is_default === true) {
        await prisma.saved_addresses.updateMany({
            where: { user_id: userId },
            data: { is_default: false },
        });
    }

    return prisma.saved_addresses.update({
        where: { id: addressId },
        data: {
            label: input.label !== undefined ? trim(input.label) || 'Home' : undefined,
            full_name: input.full_name !== undefined ? trim(input.full_name) : undefined,
            street: input.street !== undefined ? trim(input.street) : undefined,
            city: input.city !== undefined ? trim(input.city) : undefined,
            state: input.state !== undefined ? trim(input.state) || null : undefined,
            zip: input.zip !== undefined ? trim(input.zip) : undefined,
            country: input.country !== undefined ? trim(input.country) || 'US' : undefined,
            phone: input.phone !== undefined ? trim(input.phone) || null : undefined,
            is_default: input.is_default,
            updated_at: new Date().toISOString(),
        },
    });
}

export async function deleteSavedAddress(userId: string, addressId: string) {
    const existing = await prisma.saved_addresses.findFirst({
        where: { id: addressId, user_id: userId },
    });
    if (!existing) throw new Error('Address not found');
    await prisma.saved_addresses.delete({ where: { id: addressId } });
    if (existing.is_default) {
        const next = await prisma.saved_addresses.findFirst({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
        });
        if (next) {
            await prisma.saved_addresses.update({
                where: { id: next.id },
                data: { is_default: true },
            });
        }
    }
    return { deleted: true };
}

export async function setDefaultAddress(userId: string, addressId: string) {
    const existing = await prisma.saved_addresses.findFirst({
        where: { id: addressId, user_id: userId },
    });
    if (!existing) throw new Error('Address not found');
    await prisma.saved_addresses.updateMany({
        where: { user_id: userId },
        data: { is_default: false },
    });
    return prisma.saved_addresses.update({
        where: { id: addressId },
        data: { is_default: true, updated_at: new Date().toISOString() },
    });
}

export async function resolveAddressForCheckout(
    userId: string,
    opts: {
        saved_address_id?: string;
        shipping_full_name?: string;
        shipping_street?: string;
        shipping_city?: string;
        shipping_state?: string;
        shipping_zip?: string;
        shipping_country?: string;
        shipping_phone?: string;
        save_address?: boolean;
    }
) {
    if (opts.saved_address_id) {
        const saved = await prisma.saved_addresses.findFirst({
            where: { id: opts.saved_address_id, user_id: userId },
        });
        if (!saved) throw new Error('Saved address not found');
        return {
            saved_address_id: saved.id,
            shipping_full_name: saved.full_name,
            shipping_street: saved.street,
            shipping_city: saved.city,
            shipping_state: saved.state,
            shipping_zip: saved.zip,
            shipping_country: saved.country ?? 'US',
            shipping_phone: saved.phone,
        };
    }

    const fullName = trim(opts.shipping_full_name);
    const street = trim(opts.shipping_street);
    const city = trim(opts.shipping_city);
    const zip = trim(opts.shipping_zip);
    if (!fullName || !street || !city || !zip) {
        throw new Error('Shipping address is incomplete');
    }

    const resolved = {
        saved_address_id: null as string | null,
        shipping_full_name: fullName,
        shipping_street: street,
        shipping_city: city,
        shipping_state: trim(opts.shipping_state) || null,
        shipping_zip: zip,
        shipping_country: trim(opts.shipping_country) || 'US',
        shipping_phone: trim(opts.shipping_phone) || null,
    };

    if (opts.save_address) {
        const created = await createSavedAddress(userId, {
            full_name: fullName,
            street,
            city,
            state: resolved.shipping_state ?? undefined,
            zip,
            country: resolved.shipping_country,
            phone: resolved.shipping_phone ?? undefined,
        });
        resolved.saved_address_id = created.id;
    }

    return resolved;
}

export async function userCanManageSellerProfile(
    userId: string,
    role: string | undefined,
    barberId?: string | null,
    shopId?: string | null
): Promise<boolean> {
    if (role === 'admin') return true;
    const profiles = await getSellerProfiles(userId);
    if (barberId && profiles.barberIds.includes(barberId)) return true;
    if (shopId && profiles.shopIds.includes(shopId)) return true;
    if (barberId) {
        const member = await prisma.shop_members.findFirst({
            where: { barber_id: barberId, role: { in: ['owner', 'manager'] } },
        });
        if (member?.shop_id && profiles.shopIds.includes(member.shop_id)) return true;
    }
    return false;
}

export type SellerProfileInput = {
    owner_type: 'barber' | 'shop';
    barber_id?: string;
    shop_id?: string;
    ship_from_name: string;
    ship_from_street: string;
    ship_from_city: string;
    ship_from_state?: string;
    ship_from_zip: string;
    ship_from_country?: string;
    ship_from_phone?: string;
    processing_days?: number;
    free_shipping_min?: number | null;
    flat_shipping_rate?: number | null;
    return_policy?: string;
};

export async function upsertSellerShippingProfile(
    userId: string,
    role: string | undefined,
    input: SellerProfileInput
) {
    const barberId = input.owner_type === 'barber' ? input.barber_id ?? null : null;
    const shopId = input.owner_type === 'shop' ? input.shop_id ?? null : null;
    if (!barberId && !shopId) throw new Error('barber_id or shop_id is required');

    const allowed = await userCanManageSellerProfile(userId, role, barberId, shopId);
    if (!allowed) throw new Error('Unauthorized to manage this shipping profile');

    if (!trim(input.ship_from_name) || !trim(input.ship_from_street) || !trim(input.ship_from_city) || !trim(input.ship_from_zip)) {
        throw new Error('Ship-from name, street, city, and zip are required');
    }

    const data = {
        owner_type: input.owner_type,
        barber_id: barberId,
        shop_id: shopId,
        ship_from_name: trim(input.ship_from_name),
        ship_from_street: trim(input.ship_from_street),
        ship_from_city: trim(input.ship_from_city),
        ship_from_state: trim(input.ship_from_state) || null,
        ship_from_zip: trim(input.ship_from_zip),
        ship_from_country: trim(input.ship_from_country) || 'US',
        ship_from_phone: trim(input.ship_from_phone) || null,
        processing_days: Math.min(Math.max(Math.floor(input.processing_days ?? 2), 1), 14),
        free_shipping_min: input.free_shipping_min ?? null,
        flat_shipping_rate: input.flat_shipping_rate ?? 0,
        return_policy: trim(input.return_policy) || null,
        updated_at: new Date().toISOString(),
    };

    if (barberId) {
        const existing = await prisma.seller_shipping_profiles.findFirst({ where: { barber_id: barberId } });
        if (existing) {
            return prisma.seller_shipping_profiles.update({ where: { id: existing.id }, data });
        }
        return prisma.seller_shipping_profiles.create({ data: { id: randomUUID(), ...data } });
    }

    const existing = await prisma.seller_shipping_profiles.findFirst({ where: { shop_id: shopId! } });
    if (existing) {
        return prisma.seller_shipping_profiles.update({ where: { id: existing.id }, data });
    }
    return prisma.seller_shipping_profiles.create({ data: { id: randomUUID(), ...data } });
}

export async function getSellerShippingProfile(userId: string, role: string | undefined, barberId?: string, shopId?: string) {
    if (barberId) {
        const allowed = await userCanManageSellerProfile(userId, role, barberId, null);
        if (!allowed) throw new Error('Unauthorized');
        return prisma.seller_shipping_profiles.findFirst({ where: { barber_id: barberId } });
    }
    if (shopId) {
        const allowed = await userCanManageSellerProfile(userId, role, null, shopId);
        if (!allowed) throw new Error('Unauthorized');
        return prisma.seller_shipping_profiles.findFirst({ where: { shop_id: shopId } });
    }
    return null;
}

export async function createFulfillmentsForOrder(orderId: string) {
    const existing = await prisma.order_fulfillments.count({ where: { order_id: orderId } });
    if (existing > 0) return;

    const items = await prisma.order_items.findMany({
        where: { order_id: orderId },
        include: { product: true },
    });

    type GroupKey = string;
    const groups = new Map<
        GroupKey,
        { seller_type: string; barber_id: string | null; shop_id: string | null }
    >();

    for (const item of items) {
        const barberId = item.barber_id ?? item.product?.barber_id ?? null;
        const shopId = item.shop_id ?? item.product?.shop_id ?? null;
        let sellerType = item.seller_type ?? item.product?.seller_type ?? 'platform';
        let key: GroupKey;
        if (barberId) {
            sellerType = 'barber';
            key = `barber:${barberId}`;
        } else if (shopId) {
            sellerType = 'shop';
            key = `shop:${shopId}`;
        } else {
            key = 'platform';
            sellerType = 'platform';
        }
        if (!groups.has(key)) {
            groups.set(key, { seller_type: sellerType, barber_id: barberId, shop_id: shopId });
        }
    }

    const now = new Date().toISOString();
    for (const g of groups.values()) {
        await prisma.order_fulfillments.create({
            data: {
                id: randomUUID(),
                order_id: orderId,
                seller_type: g.seller_type,
                barber_id: g.barber_id,
                shop_id: g.shop_id,
                fulfillment_status: 'confirmed',
                created_at: now,
                updated_at: now,
            },
        });
    }
}

async function syncOrderAggregateStatus(orderId: string) {
    const fulfillments = await prisma.order_fulfillments.findMany({ where: { order_id: orderId } });
    if (fulfillments.length === 0) return;

    const statusRank: Record<string, number> = {
        confirmed: 0,
        preparing: 1,
        in_transit: 2,
        delivered: 3,
    };
    let minRank = 3;
    let aggregateStatus: FulfillmentStatus = 'delivered';
    let latestShippedAt: string | null = null;
    let primaryTracking: string | null = null;
    let primaryCarrier: string | null = null;

    for (const f of fulfillments) {
        const s = (f.fulfillment_status ?? 'confirmed') as FulfillmentStatus;
        const rank = statusRank[s] ?? 0;
        if (rank < minRank) {
            minRank = rank;
            aggregateStatus = s;
        }
        if (f.shipped_at && (!latestShippedAt || f.shipped_at > latestShippedAt)) {
            latestShippedAt = f.shipped_at;
            primaryTracking = f.tracking_number;
            primaryCarrier = f.carrier;
        }
    }

    await prisma.orders.update({
        where: { id: orderId },
        data: {
            fulfillment_status: aggregateStatus,
            tracking_number: primaryTracking,
            carrier: primaryCarrier,
            shipped_at: latestShippedAt,
        },
    });
}

export async function listSellerOrders(userId: string, role: string | undefined) {
    const profiles = await getSellerProfiles(userId);
    const barberIds = profiles.barberIds;
    const shopIds = profiles.shopIds;

    if (barberIds.length === 0 && shopIds.length === 0 && role !== 'admin') {
        return [];
    }

    const fulfillmentWhere =
        role === 'admin'
            ? {}
            : {
                  OR: [
                      ...(barberIds.length ? [{ barber_id: { in: barberIds } }] : []),
                      ...(shopIds.length ? [{ shop_id: { in: shopIds } }] : []),
                  ],
              };

    const fulfillments = await prisma.order_fulfillments.findMany({
        where: fulfillmentWhere,
        orderBy: { created_at: 'desc' },
        take: 100,
    });

    const orderIds = [...new Set(fulfillments.map((f) => f.order_id))];
    if (orderIds.length === 0) return [];

    const [orders, allItems] = await Promise.all([
        prisma.orders.findMany({ where: { id: { in: orderIds } } }),
        prisma.order_items.findMany({ where: { order_id: { in: orderIds } } }),
    ]);

    const orderMap = Object.fromEntries(orders.map((o) => [o.id, o]));

    return fulfillments
        .filter((f) => orderMap[f.order_id]?.payment_status === 'paid')
        .map((f) => {
            const order = orderMap[f.order_id];
            const items = allItems.filter((i) => {
                if (i.order_id !== f.order_id) return false;
                if (f.barber_id) return i.barber_id === f.barber_id;
                if (f.shop_id) return i.shop_id === f.shop_id;
                return !i.barber_id && !i.shop_id;
            });
            return {
                fulfillment: f,
                order: {
                    id: order.id,
                    order_number: order.order_number || `EMG-${  order.id.slice(-6).toUpperCase()}`,
                    created_at: order.created_at,
                    total: order.total,
                    payment_status: order.payment_status,
                    shipping_full_name: order.shipping_full_name,
                    shipping_street: order.shipping_street,
                    shipping_city: order.shipping_city,
                    shipping_state: order.shipping_state,
                    shipping_zip: order.shipping_zip,
                    shipping_country: order.shipping_country,
                    shipping_phone: order.shipping_phone,
                },
                items,
            };
        });
}

export async function updateFulfillment(
    userId: string,
    role: string | undefined,
    fulfillmentId: string,
    updates: {
        fulfillment_status?: FulfillmentStatus;
        tracking_number?: string;
        carrier?: string;
        estimated_delivery_at?: string;
    }
) {
    const fulfillment = await prisma.order_fulfillments.findUnique({ where: { id: fulfillmentId } });
    if (!fulfillment) throw new Error('Fulfillment not found');

    const allowed = await userCanManageSellerProfile(
        userId,
        role,
        fulfillment.barber_id,
        fulfillment.shop_id
    );
    if (!allowed && role !== 'admin') throw new Error('Unauthorized to update this shipment');

    const data: Record<string, unknown> = {
        updated_by_user_id: userId,
        updated_at: new Date().toISOString(),
    };

    if (updates.fulfillment_status) {
        if (!FULFILLMENT_STATUSES.includes(updates.fulfillment_status)) {
            throw new Error('Invalid fulfillment status');
        }
        data.fulfillment_status = updates.fulfillment_status;
        if (updates.fulfillment_status === 'in_transit' || updates.fulfillment_status === 'delivered') {
            data.shipped_at = new Date().toISOString();
        }
    }
    if (updates.tracking_number !== undefined) {
        data.tracking_number = trim(updates.tracking_number) || null;
    }
    if (updates.carrier !== undefined) {
        data.carrier = trim(updates.carrier) || null;
    }
    if (updates.estimated_delivery_at !== undefined) {
        data.estimated_delivery_at = trim(updates.estimated_delivery_at) || null;
    }

    const updated = await prisma.order_fulfillments.update({
        where: { id: fulfillmentId },
        data,
    });

    await syncOrderAggregateStatus(fulfillment.order_id);
    return updated;
}

export async function updateBuyerOrderShipping(
    userId: string,
    orderId: string,
    shipping: {
        shipping_full_name?: string;
        shipping_street?: string;
        shipping_city?: string;
        shipping_state?: string;
        shipping_zip?: string;
        shipping_country?: string;
        shipping_phone?: string;
        saved_address_id?: string;
    }
) {
    const order = await prisma.orders.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('Order not found');
    if (order.user_id !== userId) throw new Error('Unauthorized');

    const fulfillments = await prisma.order_fulfillments.findMany({ where: { order_id: orderId } });
    const blocked = fulfillments.some((f) =>
        ['in_transit', 'delivered'].includes(f.fulfillment_status ?? '')
    );
    if (blocked) throw new Error('Shipping address cannot be changed after items have shipped');

    if (shipping.saved_address_id) {
        const resolved = await resolveAddressForCheckout(userId, {
            saved_address_id: shipping.saved_address_id,
        });
        return prisma.orders.update({
            where: { id: orderId },
            data: resolved,
        });
    }

    return prisma.orders.update({
        where: { id: orderId },
        data: {
            shipping_full_name: shipping.shipping_full_name ? trim(shipping.shipping_full_name) : undefined,
            shipping_street: shipping.shipping_street ? trim(shipping.shipping_street) : undefined,
            shipping_city: shipping.shipping_city ? trim(shipping.shipping_city) : undefined,
            shipping_state: shipping.shipping_state !== undefined ? trim(shipping.shipping_state) || null : undefined,
            shipping_zip: shipping.shipping_zip ? trim(shipping.shipping_zip) : undefined,
            shipping_country: shipping.shipping_country ? trim(shipping.shipping_country) : undefined,
            shipping_phone: shipping.shipping_phone !== undefined ? trim(shipping.shipping_phone) || null : undefined,
            saved_address_id: null,
        },
    });
}

export function computeShippingAmount(subtotal: number): number {
    return subtotal >= PLATFORM_FREE_SHIPPING_MIN ? 0 : PLATFORM_FLAT_SHIPPING;
}
