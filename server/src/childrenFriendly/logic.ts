import { CHILDREN_FRIENDLY_DESCRIPTION, CHILDREN_FRIENDLY_LABEL } from './config';

export function parseChildrenFriendly(value: boolean | null | undefined): boolean {
    return value === true;
}

/** Effective flag: barber OR shop welcomes children */
export function effectiveChildrenFriendly(
    barberFlag: boolean | null | undefined,
    shopFlag: boolean | null | undefined
): boolean {
    return parseChildrenFriendly(barberFlag) || parseChildrenFriendly(shopFlag);
}

export function getChildrenFriendlyConfig() {
    return {
        label: CHILDREN_FRIENDLY_LABEL,
        description: CHILDREN_FRIENDLY_DESCRIPTION,
    };
}

export function serializeChildrenFriendlySettings(row: {
    id: string;
    name?: string;
    children_friendly?: boolean | null;
}) {
    return {
        id: row.id,
        name: row.name,
        children_friendly: parseChildrenFriendly(row.children_friendly),
    };
}

export function serializeEffectiveChildrenFriendly(
    barber: { children_friendly?: boolean | null } | null,
    shop: { children_friendly?: boolean | null; name?: string | null } | null
) {
    const barber_friendly = parseChildrenFriendly(barber?.children_friendly);
    const shop_friendly = parseChildrenFriendly(shop?.children_friendly);
    return {
        barber_friendly,
        shop_friendly,
        children_friendly: effectiveChildrenFriendly(barber?.children_friendly, shop?.children_friendly),
        shop_name: shop?.name ?? null,
    };
}
