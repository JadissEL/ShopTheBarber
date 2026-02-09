import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Settings, Filter } from 'lucide-react';
import { MetaTags } from '@/components/seo/MetaTags';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { sovereign } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { useCart } from '@/components/context/CartContext';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import ClientBottomNav from '@/components/dashboard/ClientBottomNav';

function statusBadge(fulfillment_status) {
  const s = (fulfillment_status || '').toLowerCase();
  if (s === 'delivered') return { label: 'DELIVERED', className: 'text-primary bg-primary/10', icon: '✔' };
  if (s === 'in_transit') return { label: 'REFILL READY', className: 'text-sky-600 bg-sky-50', icon: '♻' };
  return { label: 'IN VAULT', className: 'text-slate-600 bg-slate-100', icon: '📦' };
}

function formatOrderDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const VAULT_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'refill_ready', label: 'Refill ready' },
  { value: 'in_vault', label: 'In vault' },
];

export default function GroomingVault() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const [historyFilter, setHistoryFilter] = useState('all');

  const { data: summary, isLoading } = useQuery({
    queryKey: ['vault-summary'],
    queryFn: () => sovereign.vault.getSummary(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });

  const filteredHistory = useMemo(() => {
    const list = summary?.vault_history || [];
    if (historyFilter === 'all') return list;
    if (historyFilter === 'delivered') return list.filter((i) => (i.fulfillment_status || '').toLowerCase() === 'delivered');
    if (historyFilter === 'refill_ready') return list.filter((i) => (i.fulfillment_status || '').toLowerCase() === 'in_transit');
    if (historyFilter === 'in_vault') return list.filter((i) => !['delivered', 'in_transit'].includes((i.fulfillment_status || '').toLowerCase()));
    return list;
  }, [summary?.vault_history, historyFilter]);

  const handleReorder = (item) => {
    addItem(item.product_id, item.quantity || 1, {
      name: item.product_name,
      price: item.price,
      image_url: item.product_image_url,
      vendor_name: 'Elite Grooming',
    }).then(() => {
      toast.success(`${item.product_name} added to bag`);
      navigate(createPageUrl('ShoppingBag'));
    }).catch((e) => toast.error(e.message || 'Could not add to bag'));
  };

  if (!isAuthenticated) {
    navigate(createPageUrl('SignIn') + '?return=' + encodeURIComponent('/GroomingVault'));
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      <MetaTags
        title="Grooming Vault – Shop The Barber"
        description="Your past luxury acquisitions and quick replenish."
      />

      <header className="sticky top-0 z-40 bg-white border-b border-slate-100">
        <div className="w-full max-w-2xl mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full text-slate-600 hover:bg-slate-100" aria-label="Back">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Grooming Vault</h1>
          <Link to={createPageUrl('AccountSettings')} className="p-2 rounded-full text-slate-600 hover:bg-slate-100" aria-label="Settings">
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <main className="w-full max-w-2xl mx-auto px-4 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-700 rounded-full animate-spin" />
          </div>
        ) : !summary ? (
          <div className="text-center py-12">
            <p className="text-slate-600 mb-4">Unable to load your vault.</p>
            <Button variant="outline" className="rounded-xl" onClick={() => navigate(-1)}>Go back</Button>
          </div>
        ) : (
          <>
            <section className="rounded-2xl bg-primary text-primary-foreground p-5 mb-8 shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/80 mb-1">Vault Net Worth</p>
              <p className="text-3xl font-bold">${Number(summary.total_investment || 0).toFixed(2)}</p>
              <p className="text-sm text-sky-200 mt-2">📈 +{Number(summary.points_earned || 0)} points earned</p>
            </section>

            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Quick Replenish</h2>
                <Link to={createPageUrl('Marketplace')} className="text-sm font-medium text-sky-600 hover:underline">View All</Link>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 scrollbar-hide">
                {(summary.quick_replenish || []).map((p) => (
                  <Link
                    key={p.product_id}
                    to={createPageUrl('ProductDetail') + '?id=' + encodeURIComponent(p.product_id)}
                    className="shrink-0 w-[140px] rounded-xl border border-slate-200 bg-white overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-square bg-slate-100">
                      <OptimizedImage src={p.product_image_url || ''} alt={p.product_name} className="w-full h-full object-cover" width={140} />
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-foreground text-sm line-clamp-2">{p.product_name}</p>
                      <p className="text-xs text-sky-600 font-medium mt-0.5">{p.replenish_frequency}</p>
                    </div>
                  </Link>
                ))}
                {(!summary.quick_replenish || summary.quick_replenish.length === 0) && (
                  <p className="text-slate-500 text-sm py-4">Order more to see quick replenish suggestions.</p>
                )}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Vault History</h2>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className="p-2 rounded-full text-slate-500 hover:bg-slate-100" aria-label="Filter history">
                      <Filter className="w-5 h-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    {VAULT_FILTERS.map((f) => (
                      <DropdownMenuItem key={f.value} onClick={() => setHistoryFilter(f.value)}>
                        {historyFilter === f.value ? '✓ ' : ''}{f.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <ul className="space-y-4">
                {filteredHistory.map((item) => {
                  const badge = statusBadge(item.fulfillment_status);
                  return (
                    <li key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 flex gap-4 shadow-sm">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                        <OptimizedImage src={item.product_image_url || ''} alt={item.product_name} className="w-full h-full object-cover" width={80} />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col">
                        <p className="font-semibold text-foreground">{item.product_name}</p>
                        <p className="text-sm text-slate-500 mt-0.5">Ordered: {formatOrderDate(item.order_date)}</p>
                        <span className={`inline-flex items-center gap-1 mt-2 text-xs font-semibold px-2 py-1 rounded w-fit ${badge.className}`}>
                          {badge.icon} {badge.label}
                        </span>
                        <Button
                          size="sm"
                          className="mt-3 w-fit rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium"
                          onClick={() => handleReorder(item)}
                        >
                          {item.fulfillment_status === 'delivered' ? 'Buy Again' : 'Reorder'}
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
              {filteredHistory.length === 0 && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 py-12 text-center">
                  <p className="text-slate-600 font-medium mb-2">
                    {(summary.vault_history?.length ?? 0) > 0 ? 'No items match this filter' : 'No vault history yet'}
                  </p>
                  <p className="text-slate-500 text-sm mb-4">
                    {(summary.vault_history?.length ?? 0) > 0 ? 'Try another filter.' : 'Paid marketplace orders will appear here.'}
                  </p>
                  {(summary.vault_history?.length ?? 0) === 0 && (
                    <Link to={createPageUrl('Marketplace')}>
                      <Button className="rounded-xl bg-primary text-primary-foreground hover:opacity-95">Shop Marketplace</Button>
                    </Link>
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <ClientBottomNav />
    </div>
  );
}
