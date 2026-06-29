/**
 * Idempotent: ensure mobile barbers have at-home service areas + default travel zones.
 */
import '../src/loadEnv';
import { prisma } from '../src/db/prisma';
import { coordsForLocationText } from '../src/lib/geocoding/locationCoords';

const DEFAULT_ZONES = [
    { label: '0–5 km', min_distance_km: 0, max_distance_km: 5, fee_amount: 0, sort_order: 0 },
    { label: '5–15 km', min_distance_km: 5, max_distance_km: 15, fee_amount: 10, sort_order: 1 },
    { label: '15–25 km', min_distance_km: 15, max_distance_km: 25, fee_amount: 20, sort_order: 2 },
];

const MOBILE_BARBER_LOCATIONS: Array<{ id: string; location: string }> = [
    { id: 'gb1', location: 'Athens, Syntagma' },
    { id: 'gb4', location: 'Athens, Exarcheia' },
    { id: 'b1', location: 'New York, Manhattan' },
    { id: 'intl-london-1', location: 'London, Shoreditch' },
];

async function main() {
    let created = 0;
    let skipped = 0;

    for (const entry of MOBILE_BARBER_LOCATIONS) {
        const barber = await prisma.barbers.findUnique({
            where: { id: entry.id },
            select: { id: true, location: true },
        });
        if (!barber) {
            skipped += 1;
            continue;
        }

        const existing = await prisma.at_home_service_areas.findUnique({
            where: { barber_id: entry.id },
        });
        if (existing) {
            skipped += 1;
            continue;
        }

        const location = barber.location?.trim() || entry.location;
        const coords = coordsForLocationText(location, entry.id);
        if (!coords) {
            skipped += 1;
            continue;
        }

        const areaId = `aha-${entry.id}`;
        await prisma.at_home_service_areas.create({
            data: {
                id: areaId,
                barber_id: entry.id,
                base_address: location,
                base_latitude: coords.latitude,
                base_longitude: coords.longitude,
                service_radius_km: 25,
                travel_fees_enabled: true,
            },
        });

        await prisma.at_home_travel_zones.createMany({
            data: DEFAULT_ZONES.map((z, index) => ({
                id: `${areaId}-z${index}`,
                area_id: areaId,
                ...z,
            })),
        });

        created += 1;
    }

    console.log(`[backfill-at-home-areas] created=${created} skipped=${skipped}`);
}

main()
    .catch((e) => {
        console.error('[backfill-at-home-areas] failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
