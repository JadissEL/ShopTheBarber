/**
 * Idempotent: set barbers.city from location when city is empty or improvable.
 * Safe to run after every deploy (build-database hook).
 */
import '../src/loadEnv';
import { prisma } from '../src/db/prisma';
import { primaryCityFromLocation } from '../src/seo/cityFromLocation';

async function main() {
    const barbers = await prisma.barbers.findMany({
        select: { id: true, location: true, city: true },
    });

    let updated = 0;
    for (const barber of barbers) {
        const next = primaryCityFromLocation(barber.location, barber.city);
        if (!next || next === barber.city) continue;
        await prisma.barbers.update({
            where: { id: barber.id },
            data: { city: next },
        });
        updated += 1;
    }

    console.log(`[backfill-barber-cities] scanned=${barbers.length} updated=${updated}`);
}

main()
    .catch((e) => {
        console.error('[backfill-barber-cities] failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
