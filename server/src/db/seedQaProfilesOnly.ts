import '../loadEnv';
import { seedQaProfiles } from './qaProfiles';
import { prisma } from './prisma';

seedQaProfiles()
    .catch((err) => {
        console.error('QA profile seed failed:', err);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
