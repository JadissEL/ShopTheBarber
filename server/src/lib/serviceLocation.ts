export type ServiceLocationBarber = {
    offers_shop_service?: boolean | null;
    offers_mobile_service?: boolean | null;
};

/** In-shop / chair service (defaults true when column unset). */
export function offersShopService(barber: ServiceLocationBarber): boolean {
    return barber.offers_shop_service !== false;
}

/** At-home / mobile visits. */
export function offersMobileService(barber: ServiceLocationBarber): boolean {
    return barber.offers_mobile_service === true;
}

export type ServiceLocationModes = {
    shop: boolean;
    mobile: boolean;
    shop_only: boolean;
    mobile_only: boolean;
    both: boolean;
};

export function getServiceLocationModes(barber: ServiceLocationBarber): ServiceLocationModes {
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

export function assertAtLeastOneServiceLocation(shop: boolean, mobile: boolean): void {
    if (!shop && !mobile) {
        throw new Error('Enable at least one service location: in-shop or at-home');
    }
}

export function resolveVisitTypeForBarber(
    barber: ServiceLocationBarber,
    requested: 'shop' | 'mobile' | undefined
): 'shop' | 'mobile' {
    const modes = getServiceLocationModes(barber);
    if (requested === 'mobile' && !modes.mobile) {
        throw new Error('This barber does not offer at-home visits');
    }
    if (requested === 'shop' && !modes.shop) {
        throw new Error('This barber only offers at-home visits, please book at your location');
    }
    if (modes.mobile_only) return 'mobile';
    if (modes.shop_only) return 'shop';
    if (requested === 'mobile' && modes.mobile) return 'mobile';
    if (requested === 'shop' && modes.shop) return 'shop';
    return modes.shop ? 'shop' : 'mobile';
}

/** Effective modes when booking through a shop (intersection of shop policy and barber capability). */
export function getShopBookingLocationModes(
    barber: ServiceLocationBarber,
    shop: ServiceLocationBarber
): ServiceLocationModes {
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

export function resolveVisitTypeForBooking(
    barber: ServiceLocationBarber,
    shop: ServiceLocationBarber | null | undefined,
    requested: 'shop' | 'mobile' | undefined,
    inShopContext: boolean
): 'shop' | 'mobile' {
    if (inShopContext && shop) {
        const modes = getShopBookingLocationModes(barber, shop);
        if (requested === 'mobile' && !modes.mobile) {
            throw new Error('This shop does not offer at-home visits, please book in-shop');
        }
        if (requested === 'shop' && !modes.shop) {
            throw new Error('This shop only offers at-home visits');
        }
        if (modes.mobile_only) return 'mobile';
        if (modes.shop_only) return 'shop';
        if (requested === 'mobile' && modes.mobile) return 'mobile';
        if (requested === 'shop' && modes.shop) return 'shop';
        return modes.shop ? 'shop' : 'mobile';
    }
    return resolveVisitTypeForBarber(barber, requested);
}

export function assertVisitTypeAllowedForModes(
    modes: ServiceLocationModes,
    visitType: 'shop' | 'mobile',
    locationText: string | null | undefined,
    contextLabel: 'barber' | 'shop' = 'barber'
): void {
    if (visitType === 'mobile') {
        if (!modes.mobile) {
            throw new Error(
                contextLabel === 'shop'
                    ? 'This shop does not offer at-home visits, please book in-shop'
                    : 'This barber does not offer at-home visits'
            );
        }
        if (!locationText?.trim()) {
            throw new Error('Please enter your address for at-home service');
        }
        return;
    }

    if (!modes.shop) {
        throw new Error(
            contextLabel === 'shop'
                ? 'This shop only offers at-home visits'
                : 'This barber only offers at-home visits, please book at your location'
        );
    }
}
