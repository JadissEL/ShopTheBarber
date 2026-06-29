export const CHILDREN_FRIENDLY_LABEL = 'Kids welcome';

export function parseChildrenFriendly(value) {
    return value === true;
}

export function effectiveChildrenFriendly(barberFlag, shopFlag) {
    return parseChildrenFriendly(barberFlag) || parseChildrenFriendly(shopFlag);
}

export function matchesChildrenFriendlyFilter(barberFlag, shopFlag, filterActive) {
    if (!filterActive) return true;
    return effectiveChildrenFriendly(barberFlag, shopFlag);
}
