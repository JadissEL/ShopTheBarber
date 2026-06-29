import { getActivePricingPolicy, validatePromoValues, validateServicePrice } from './logic';

export async function enforceServicePriceOnWrite(data: Record<string, unknown>): Promise<void> {
    if (data.price === undefined) return;
    const price = Number(data.price);
    const policy = await getActivePricingPolicy();
    validateServicePrice(price, policy);
}

export async function enforcePromoOnWrite(data: Record<string, unknown>): Promise<void> {
    if (data.discount_type === undefined && data.discount_value === undefined) return;
    const discount_type = String(data.discount_type ?? '');
    const discount_value = Number(data.discount_value);
    const policy = await getActivePricingPolicy();
    validatePromoValues(discount_type, discount_value, policy);
}
