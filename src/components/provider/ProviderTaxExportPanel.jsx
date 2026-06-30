import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { subMonths, format } from 'date-fns';

function defaultFrom() {
    return format(subMonths(new Date(), 3), 'yyyy-MM-dd');
}

function defaultTo() {
    return format(new Date(), 'yyyy-MM-dd');
}

export default function ProviderTaxExportPanel({ shopId }) {
    const [from, setFrom] = useState(defaultFrom);
    const [to, setTo] = useState(defaultTo);
    const [downloading, setDownloading] = useState(false);

    const { data: preview, isFetching } = useQuery({
        queryKey: ['tax-report-preview', shopId, from, to],
        queryFn: () =>
            sovereign.providerFinancials.getTaxReport({
                from: new Date(from).toISOString(),
                to: new Date(`${to}T23:59:59`).toISOString(),
                shop_id: shopId || undefined,
            }),
        enabled: !!from && !!to,
    });

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const csv = await sovereign.providerFinancials.downloadTaxCsv({
                from: new Date(from).toISOString(),
                to: new Date(`${to}T23:59:59`).toISOString(),
                shop_id: shopId || undefined,
            });
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tax-report-${from}-${to}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Tax report downloaded');
        } catch (e) {
            toast.error(e.message || 'Export failed');
        } finally {
            setDownloading(false);
        }
    };

    return (
        <Card className="">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <FileSpreadsheet className="w-5 h-5 text-primary" />
                    Tax export (CSV)
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    Export completed service revenue and platform fees for your accountant. VAT estimate uses Greece 24% on services.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="tax-from">From</Label>
                        <Input id="tax-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tax-to">To</Label>
                        <Input id="tax-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                    </div>
                </div>
                {preview?.summary && (
                    <div className="grid grid-cols-3 gap-3 text-sm rounded-lg bg-muted/40 p-4">
                        <div>
                            <p className="text-muted-foreground text-xs">Gross</p>
                            <p className="font-semibold tabular-nums">€{preview.summary.gross.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs">VAT (est.)</p>
                            <p className="font-semibold tabular-nums">€{preview.summary.vat.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs">Net</p>
                            <p className="font-semibold tabular-nums">€{preview.summary.net.toFixed(2)}</p>
                        </div>
                    </div>
                )}
                <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                    disabled={downloading || isFetching}
                    onClick={handleDownload}
                >
                    {downloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-2" />}
                    Download CSV
                </Button>
            </CardContent>
        </Card>
    );
}
