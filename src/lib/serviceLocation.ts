export const SHOP_SERVICE_LABEL = 'In-shop visits';
export const MOBILE_SERVICE_LABEL = 'At-home visits';

export function offersShopService(barber: { offers_shop_service?: boolean | null } | null | undefined): boolean {
    if (!barber) return true;
    return barber.offers_shop_service !== false;
}

export function offersMobileService(barber: { offers_mobile_service?: boolean | null } | null | undefined): boolean {
    return barber?.offers_mobile_service === true;
}

export function getServiceLocationModes(barber: {
    offers_shop_service?: boolean | null;
    offers_mobile_service?: boolean | null;
} | null | undefined) {
    const shop = offersShopService(barber);
    const mobile = offersMobileService(barber);
    return {
        shop,
        mobile,
        shop_only: shop && !mobile,
        mobile_only: mobile && !shop,
        both: shop && mobile,
    };
}

export function matchesMobileServiceFilter(
    offersMobile: boolean | null | undefined,
    mobileOnly: boolean
): boolean {
    if (!mobileOnly) return true;
    return offersMobile === true;
}

export function matchesShopServiceFilter(
    offersShop: boolean | null | undefined,
    shopOnly: boolean
): boolean {
    if (!shopOnly) return true;
    return offersShop !== false;
}

export function resolveClientLocationType(
    barber: { offers_shop_service?: boolean | null; offers_mobile_service?: boolean | null } | null | undefined,
    requested: 'any' | 'shop' | 'mobile'
): 'shop' | 'mobile' {
    const modes = getServiceLocationModes(barber);
    if (modes.mobile_only) return 'mobile';
    if (modes.shop_only) return 'shop';
    if (requested === 'mobile' && modes.mobile) return 'mobile';
    if (requested === 'shop' && modes.shop) return 'shop';
    return modes.shop ? 'shop' : 'mobile';
}

/** Human-readable mode for admin cards and profile copy. */
export function getServiceLocationLabel(
    barber: { offers_shop_service?: boolean | null; offers_mobile_service?: boolean | null } | null | undefined
): string {
    const modes = getServiceLocationModes(barber);
    if (modes.mobile_only) return 'At-home only';
    if (modes.shop_only) return 'In-shop only';
    if (modes.both) return 'Shop & at-home';
    return 'Not configured';
}

export function getShopBookingLocationModes(
    barber: { offers_shop_service?: boolean | null; offers_mobile_service?: boolean | null },
    shop: { offers_shop_service?: boolean | null; offers_mobile_service?: boolean | null }
) {
    const b = getServiceLocationModes(barber);
    const s = getServiceLocationModes(shop);
    const shopVisit = b.shop && s.shop;
    const mobileVisit = b.mobile && s.mobile;
    return {
        shop: shopVisit,
        mobile: mobileVisit,
        shop_only: shopVisit && !mobileVisit,
        mobile_only: mobileVisit && !shopVisit,
        both: shopVisit && mobileVisit,
    };
}

export function isShopBookingContext(
    shopId: string | null | undefined,
    context: string | null | undefined
): boolean {
    return !!shopId && context !== 'independent';
}
