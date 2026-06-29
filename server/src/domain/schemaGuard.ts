import { Prisma } from '@prisma/client';

export function isFinancialTrustSchemaError(err: unknown): boolean {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return err.code === 'P2022' || err.code === 'P2021';
    }
    if (err instanceof Prisma.PrismaClientValidationError) {
        return /Unknown argument|Invalid .* invocation/i.test(err.message);
    }
    if (err instanceof Error && /does not exist|column .* not found|Unknown argument/i.test(err.message)) {
        return true;
    }
    return false;
}
