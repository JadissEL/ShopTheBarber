import { prisma } from '../db/prisma';

export type TaxReportRow = {
    date: string;
    type: string;
    description: string;
    amount_eur: number;
    vat_eur: number;
    net_eur: number;
};

const DEFAULT_VAT = 0.24;

export async function buildProviderTaxReport(params: {
    userId: string;
    shopId?: string | null;
    from: string;
    to: string;
}): Promise<{ rows: TaxReportRow[]; summary: { gross: number; vat: number; net: number } }> {
    const barber = await prisma.barbers.findFirst({
        where: params.shopId ? { shop_id: params.shopId, user_id: params.userId } : { user_id: params.userId },
        select: { id: true },
    });

    const bookingWhere = {
        ...(barber ? { barber_id: barber.id } : {}),
        ...(params.shopId ? { shop_id: params.shopId } : {}),
        status: 'completed' as const,
        updated_at: { gte: params.from, lte: params.to },
    };

    const bookings = await prisma.bookings.findMany({
        where: bookingWhere,
        select: { updated_at: true, price_at_booking: true, service_name: true, id: true },
    });

    const fees = await prisma.provider_fee_transactions.findMany({
        where: {
            user_id: params.userId,
            type: { in: ['platform_fee', 'top_up', 'fee_refund'] },
            created_at: { gte: params.from, lte: params.to },
        },
        select: { created_at: true, amount: true, type: true, description: true },
    });

    const rows: TaxReportRow[] = [];

    for (const b of bookings) {
        const gross = b.price_at_booking ?? 0;
        const net = gross / (1 + DEFAULT_VAT);
        const vat = gross - net;
        rows.push({
            date: b.updated_at ?? params.from,
            type: 'service_revenue',
            description: b.service_name ?? `Booking ${b.id.slice(0, 8)}`,
            amount_eur: Math.round(gross * 100) / 100,
            vat_eur: Math.round(vat * 100) / 100,
            net_eur: Math.round(net * 100) / 100,
        });
    }

    for (const f of fees) {
        const gross = Math.abs(f.amount ?? 0);
        rows.push({
            date: f.created_at ?? params.from,
            type: f.type,
            description: f.description ?? f.type,
            amount_eur: Math.round(gross * 100) / 100,
            vat_eur: 0,
            net_eur: Math.round(gross * 100) / 100,
        });
    }

    rows.sort((a, b) => a.date.localeCompare(b.date));

    const gross = rows.reduce((s, r) => s + r.amount_eur, 0);
    const vat = rows.reduce((s, r) => s + r.vat_eur, 0);
    const net = rows.reduce((s, r) => s + r.net_eur, 0);

    return {
        rows,
        summary: {
            gross: Math.round(gross * 100) / 100,
            vat: Math.round(vat * 100) / 100,
            net: Math.round(net * 100) / 100,
        },
    };
}

export function taxReportToCsv(rows: TaxReportRow[]): string {
    const header = 'date,type,description,amount_eur,vat_eur,net_eur';
    const lines = rows.map(
        (r) =>
            `${r.date},${r.type},"${r.description.replace(/"/g, '""')}",${r.amount_eur},${r.vat_eur},${r.net_eur}`
    );
    return [header, ...lines].join('\n');
}
