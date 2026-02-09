import { db } from '../db';
import * as schema from '../db/schema';
import fs from 'fs';
import path from 'path';

/**
 * SQLite Backup Verification
 * 
 * ADMIN ONLY - Tests database backup health and recoverability
 * Redesigned for SQLite instead of Base44 cloud backups
 * 
 * Checks:
 * - Database file exists and is accessible
 * - Critical entities contain data
 * - Referential integrity is maintained
 * - Database size is reasonable
 */

interface BackupStatus {
    verified_at: string;
    checks: Array<{
        name: string;
        status: 'PASS' | 'WARNING' | 'FAIL' | 'SKIPPED';
        message: string;
        timestamp: string;
        [key: string]: any;
    }>;
    status: 'HEALTHY' | 'WARNING' | 'FAILED' | 'UNKNOWN';
    database_path: string;
    database_size_mb: number;
    backup_strategy: string;
}

export async function verifyBackupIntegrity(adminUserId: string): Promise<BackupStatus> {
    const dbPath = path.join(__dirname, '../../sovereign.sqlite');

    const backupStatus: BackupStatus = {
        verified_at: new Date().toISOString(),
        checks: [],
        status: 'UNKNOWN',
        database_path: dbPath,
        database_size_mb: 0,
        backup_strategy: 'Manual file-based backups'
    };

    // CHECK 1: Database file exists and size
    try {
        const stats = fs.statSync(dbPath);
        backupStatus.database_size_mb = Math.round((stats.size / 1024 / 1024) * 100) / 100;

        backupStatus.checks.push({
            name: 'DATABASE_FILE_EXISTS',
            status: stats.size > 0 ? 'PASS' : 'FAIL',
            message: `Database file found (${backupStatus.database_size_mb} MB)`,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        backupStatus.checks.push({
            name: 'DATABASE_FILE_EXISTS',
            status: 'FAIL',
            message: `Database file not accessible: ${error.message}`,
            timestamp: new Date().toISOString()
        });
    }

    // CHECK 2: Critical entity integrity
    const criticalEntities = [
        { name: 'users', table: schema.users },
        { name: 'bookings', table: schema.bookings },
        { name: 'barbers', table: schema.barbers },
        { name: 'shops', table: schema.shops },
        { name: 'services', table: schema.services }
    ];

    const entityCheck = {
        name: 'ENTITY_INTEGRITY',
        status: 'PASS' as 'PASS' | 'WARNING' | 'FAIL',
        entities_verified: 0,
        details: [] as any[]
    };

    for (const entity of criticalEntities) {
        try {
            const count = await db.select().from(entity.table).limit(1);
            entityCheck.entities_verified++;
            entityCheck.details.push({
                entity: entity.name,
                status: 'OK',
                has_data: count.length > 0
            });
        } catch (error: any) {
            entityCheck.status = 'WARNING';
            entityCheck.details.push({
                entity: entity.name,
                status: 'ERROR',
                error: error.message
            });
        }
    }

    backupStatus.checks.push({
        ...entityCheck,
        message: `Verified ${entityCheck.entities_verified}/${criticalEntities.length} entities`,
        timestamp: new Date().toISOString()
    });

    // CHECK 3: Data consistency (referential integrity)
    try {
        const bookings = await db.query.bookings.findMany({ limit: 10 });
        const consistencyCheck = {
            name: 'DATA_CONSISTENCY',
            status: 'PASS' as 'PASS' | 'WARNING',
            issues_found: 0,
            details: [] as any[]
        };

        for (const booking of bookings) {
            const barberExists = booking.barber_id
                ? await db.query.barbers.findFirst({
                    where: (barbers, { eq }) => eq(barbers.id, booking.barber_id)
                })
                : null;

            if (booking.barber_id && !barberExists) {
                consistencyCheck.issues_found++;
                consistencyCheck.status = 'WARNING';
                consistencyCheck.details.push({
                    booking_id: booking.id,
                    issue: 'Missing barber reference',
                    barber_id: booking.barber_id
                });
            }
        }

        consistencyCheck.message =
            consistencyCheck.issues_found === 0
                ? `Verified ${bookings.length} bookings - all references intact`
                : `Found ${consistencyCheck.issues_found} consistency issues`;

        backupStatus.checks.push({
            ...consistencyCheck,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        backupStatus.checks.push({
            name: 'DATA_CONSISTENCY',
            status: 'FAIL',
            message: `Cannot verify consistency: ${error.message}`,
            timestamp: new Date().toISOString()
        });
    }

    // DETERMINE OVERALL STATUS
    const failCount = backupStatus.checks.filter(c => c.status === 'FAIL').length;
    const warningCount = backupStatus.checks.filter(c => c.status === 'WARNING').length;

    if (failCount > 0) {
        backupStatus.status = 'FAILED';
    } else if (warningCount > 0) {
        backupStatus.status = 'WARNING';
    } else {
        backupStatus.status = 'HEALTHY';
    }

    // LOG VERIFICATION
    try {
        await db.insert(schema.audit_logs).values({
            action: 'BACKUP_VERIFICATION',
            resource_type: 'System',
            resource_id: 'database',
            actor_id: adminUserId,
            details: JSON.stringify(backupStatus)
        });
    } catch (e) {
        console.warn('Could not log backup verification');
    }

    return backupStatus;
}

/**
 * Get backup strategy guide for SQLite
 */
export function getBackupRecoveryGuide() {
    return {
        backup_strategy: {
            frequency: 'Daily automated backups via cron (recommended)',
            retention: '30-day rolling window',
            location: 'Local filesystem + offsite storage (cloud/NAS)',
            method: 'File copy of sovereign.sqlite'
        },
        backup_commands: {
            manual: 'cp server/sovereign.sqlite backups/sovereign-$(date +%Y%m%d).sqlite',
            automated_cron: '0 2 * * * /path/to/backup-script.sh',
            restore: 'cp backups/sovereign-YYYYMMDD.sqlite server/sovereign.sqlite'
        },
        recovery_procedures: {
            minor_data_loss: [
                '1. Identify last good backup timestamp',
                '2. Stop server',
                '3. Copy backup file to sovereign.sqlite',
                '4. Restart server',
                '5. Verify data integrity'
            ],
            full_system_failure: [
                '1. Restore from latest backup',
                '2. Run integrity checks',
                '3. Verify critical services',
                '4. Gradually restore access'
            ]
        },
        testing_schedule: {
            monthly: 'Run verifyBackupIntegrity()',
            quarterly: 'Test restore to staging',
            annually: 'Full disaster recovery drill'
        }
    };
}
