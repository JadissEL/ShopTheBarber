import { describe, expect, it } from 'vitest';
import { Prisma } from '@prisma/client';
import { isFinancialTrustSchemaError } from '../schemaGuard';

describe('isFinancialTrustSchemaError', () => {
    it('detects missing table/column Prisma errors', () => {
        const err = new Prisma.PrismaClientKnownRequestError('column does not exist', {
            code: 'P2022',
            clientVersion: 'test',
        });
        expect(isFinancialTrustSchemaError(err)).toBe(true);
    });

    it('detects Prisma validation errors for unmigrated schema', () => {
        const err = new Prisma.PrismaClientValidationError('Unknown argument `promotional_expires_at`', {
            clientVersion: 'test',
        });
        expect(isFinancialTrustSchemaError(err)).toBe(true);
    });
});
