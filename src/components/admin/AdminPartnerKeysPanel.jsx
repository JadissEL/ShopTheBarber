import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Key, Copy, Ban, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

const SCOPE_OPTIONS = [
    { id: 'bookings:read', label: 'Read bookings' },
    { id: '*', label: 'Full access' },
];

function formatWhen(iso) {
    if (!iso) return 'Never';
    try {
        return format(parseISO(iso), 'MMM d, yyyy HH:mm');
    } catch {
        return iso;
    }
}

export default function AdminPartnerKeysPanel() {
    const queryClient = useQueryClient();
    const [name, setName] = useState('');
    const [shopId, setShopId] = useState('');
    const [scopes, setScopes] = useState(['bookings:read']);
    const [createdKey, setCreatedKey] = useState(null);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['admin-partner-keys'],
        queryFn: () => sovereign.admin.listPartnerKeys(),
    });

    const createMutation = useMutation({
        mutationFn: () => sovereign.admin.createPartnerKey({
            name: name.trim(),
            scopes,
            shop_id: shopId.trim() || undefined,
        }),
        onSuccess: (res) => {
            setCreatedKey(res);
            setName('');
            queryClient.invalidateQueries({ queryKey: ['admin-partner-keys'] });
            toast.success('Partner API key created — copy it now, it will not be shown again');
        },
        onError: (e) => toast.error(e.message),
    });

    const revokeMutation = useMutation({
        mutationFn: (id) => sovereign.admin.revokePartnerKey(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-partner-keys'] });
            toast.success('API key revoked');
        },
        onError: (e) => toast.error(e.message),
    });

    const keys = data?.keys ?? [];

    const toggleScope = (scopeId) => {
        if (scopeId === '*') {
            setScopes(['*']);
            return;
        }
        setScopes((prev) => {
            const withoutWildcard = prev.filter((s) => s !== '*');
            if (withoutWildcard.includes(scopeId)) {
                const next = withoutWildcard.filter((s) => s !== scopeId);
                return next.length ? next : ['bookings:read'];
            }
            return [...withoutWildcard, scopeId];
        });
    };

    const copyKey = async (key) => {
        try {
            await navigator.clipboard.writeText(key);
            toast.success('Copied to clipboard');
        } catch {
            toast.error('Could not copy');
        }
    };

    return (
        <div className="space-y-6">
            <Card className="rounded-2xl border-border max-w-xl">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        Create partner API key
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="partner-name">Partner name</Label>
                        <Input
                            id="partner-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Acme Salon Network"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="partner-shop-id">Shop scope (optional UUID)</Label>
                        <Input
                            id="partner-shop-id"
                            value={shopId}
                            onChange={(e) => setShopId(e.target.value)}
                            placeholder="Limit bookings to one shop"
                            className="font-mono text-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Scopes</Label>
                        <div className="flex flex-wrap gap-2">
                            {SCOPE_OPTIONS.map((opt) => (
                                <Button
                                    key={opt.id}
                                    type="button"
                                    size="sm"
                                    variant={scopes.includes(opt.id) ? 'default' : 'outline'}
                                    onClick={() => toggleScope(opt.id)}
                                >
                                    {opt.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                    <Button
                        disabled={createMutation.isPending || !name.trim()}
                        onClick={() => createMutation.mutate()}
                    >
                        {createMutation.isPending ? 'Creating…' : 'Generate API key'}
                    </Button>

                    {createdKey?.api_key && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 p-4 space-y-2">
                            <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
                                Save this key — it won&apos;t be shown again
                            </p>
                            <code className="block text-xs font-mono break-all bg-background/80 p-2 rounded-lg">
                                {createdKey.api_key}
                            </code>
                            <Button size="sm" variant="outline" onClick={() => copyKey(createdKey.api_key)}>
                                <Copy className="w-4 h-4 mr-2" />
                                Copy key
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="rounded-2xl border-border">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Key className="w-5 h-5" />
                        Partner keys
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
                    {isError && <p className="text-sm text-destructive">Failed to load keys.</p>}
                    {!isLoading && keys.length === 0 && (
                        <p className="text-sm text-muted-foreground">No partner keys yet.</p>
                    )}
                    {keys.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-muted-foreground">
                                        <th className="pb-2 pr-4 font-medium">Name</th>
                                        <th className="pb-2 pr-4 font-medium">Scopes</th>
                                        <th className="pb-2 pr-4 font-medium">Status</th>
                                        <th className="pb-2 pr-4 font-medium">Last used</th>
                                        <th className="pb-2 font-medium" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {keys.map((key) => (
                                        <tr key={key.id}>
                                            <td className="py-3 pr-4 font-medium">{key.name}</td>
                                            <td className="py-3 pr-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {(key.scopes ?? []).map((s) => (
                                                        <Badge key={s} variant="outline" className="text-xs font-mono">
                                                            {s}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="py-3 pr-4">
                                                <Badge variant={key.is_active ? 'secondary' : 'destructive'}>
                                                    {key.is_active ? 'Active' : 'Revoked'}
                                                </Badge>
                                            </td>
                                            <td className="py-3 pr-4 text-muted-foreground text-xs">
                                                {formatWhen(key.last_used_at)}
                                            </td>
                                            <td className="py-3 text-right">
                                                {key.is_active && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-destructive"
                                                        disabled={revokeMutation.isPending}
                                                        onClick={() => revokeMutation.mutate(key.id)}
                                                    >
                                                        <Ban className="w-4 h-4 mr-1" />
                                                        Revoke
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-4">
                        Partner endpoint: <code className="font-mono">GET /api/v1/partner/bookings</code> with header{' '}
                        <code className="font-mono">x-api-key</code>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
