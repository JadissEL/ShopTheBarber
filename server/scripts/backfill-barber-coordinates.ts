/**
 * Idempotent: set barbers.latitude/longitude from location when missing.
 * Uses Mapbox/Google when configured; falls back to static city lookup.
 */
import '../src/loadEnv';
import { prisma } from '../src/db/prisma';
import { resolveBarberCoordinates } from '../src/lib/geocoding/barberLocation';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
    const barbers = await prisma.barbers.findMany({
        where: {
            location: { not: null },
            OR: [{ latitude: null }, { longitude: null }],
        },
        select: { id: true, location: true, latitude: true, longitude: true },
    });

    let updated = 0;
    let skipped = 0;

    for (const barber of barbers) {
        const location = barber.location?.trim();
        if (!location) {
            skipped += 1;
            continue;
        }

        const coords = await resolveBarberCoordinates(location, barber.id);
        if (!coords) {
            skipped += 1;
            continue;
        }

        if (
            barber.latitude != null &&
            barber.longitude != null &&
            Math.abs(barber.latitude - coords.latitude) < 0.0001 &&
            Math.abs(barber.longitude - coords.longitude) < 0.0001
        ) {
            skipped += 1;
            continue;
        }

        await prisma.barbers.update({
            where: { id: barber.id },
            data: { latitude: coords.latitude, longitude: coords.longitude },
        });
        updated += 1;

        // Respect external geocoder rate limits when API is used
        await sleep(150);
    }

    console.log(
        `[backfill-barber-coordinates] scanned=${barbers.length} updated=${updated} skipped=${skipped}`
    );
}

main()
    .catch((e) => {
        console.error('[backfill-barber-coordinates] failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
