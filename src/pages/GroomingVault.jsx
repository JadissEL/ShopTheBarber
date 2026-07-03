import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Settings, Filter } from 'lucide-react';
import { PageLoading } from '@/components/ui/page-loading';
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
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
function statusBadge(fulfillment_status) {
  const s = (fulfillment_status || '').toLowerCase();
  if (s === 'delivered') return { label: 'DELIVERED', className: 'text-primary bg-primary/10', icon: '✔' };
  if (s === 'in_transit') return { label: 'REFILL READY', className: 'text-primary bg-primary/10', icon: '♻' };
  return { label: 'IN VAULT', className: 'text-muted-foreground bg-muted', icon: '📦' };
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
  const { isAuthenticated, isLoadingAuth, isSignedIn, syncStatus } = useAuth();
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

  // Redirect if not authenticated (useEffect to avoid render-phase side effects)
  useEffect(() => {
    if (isLoadingAuth) return;
    if (isSignedIn && !isAuthenticated) {
      if (syncStatus === 'error') {
        navigate(createPageUrl('SetupGuide'), { replace: true });
      }
      return;
    }
    if (!isAuthenticated) {
      navigate(`${createPageUrl('SignIn')  }?return=${  encodeURIComponent('/GroomingVault')}`, { replace: true });
    }
  }, [isAuthenticated, isLoadingAuth, isSignedIn, syncStatus, navigate]);

  // Show loading while checking auth
  if (isLoadingAuth || (isSignedIn && !isAuthenticated && syncStatus !== 'error')) {
    return <PageLoading message="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className={`${stb.page  } lg:pb-8`}>
      <MetaTags
        title="Grooming Vault - Shop The Barber"
        description="Your past luxury acquisitions and quick replenish."
      />

      <PageHeader
        label="Marketplace"
        title="Grooming Vault"
        subtitle="Your past acquisitions and quick replenish"
        compact
        variant="light"
        tier="app"
      >
        <Link to={createPageUrl('AccountSettings')} className="p-2 rounded-full text-muted-foreground hover:bg-muted" aria-label="Settings">
          <Settings className="w-5 h-5" />
        </Link>
      </PageHeader>

      <PageContent narrow>
        {isLoading ? (
          <PageLoading message="Loading your vault..." />
        ) : !summary ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Unable to load your vault.</p>
            <Button variant="outline" className="" onClick={() => navigate(-1)}>Go back</Button>
          </div>
        ) : (
          <>
            <section className=" bg-primary text-primary-foreground p-5 mb-8 shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/80 mb-1">Vault Net Worth</p>
              <p className="text-3xl font-bold">${Number(summary.total_investment || 0).toFixed(2)}</p>
              <p className="text-sm text-primary/80 mt-2">📈 +{Number(summary.points_earned || 0)} points earned</p>
            </section>

            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className={stb.uiSubheading}>Quick Replenish</h2>
                <Link to={createPageUrl('Marketplace')} className="text-sm font-medium text-primary hover:underline">View All</Link>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 scrollbar-hide">
                {(summary.quick_replenish || []).map((p) => (
                  <Link
                    key={p.product_id}
                    to={`${createPageUrl('ProductDetail')  }?id=${  encodeURIComponent(p.product_id)}`}
                    className="shrink-0 w-[140px] rounded-lg border border-border bg-card overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-square bg-muted">
                      <OptimizedImage src={p.product_image_url || ''} alt={p.product_name} className="w-full h-full object-cover" width={140} />
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-foreground text-sm line-clamp-2">{p.product_name}</p>
                      <p className="text-xs text-primary font-medium mt-0.5">{p.replenish_frequency}</p>
                    </div>
                  </Link>
                ))}
                {(!summary.quick_replenish || summary.quick_replenish.length === 0) && (
                  <p className="text-muted-foreground text-sm py-4">Order more to see quick replenish suggestions.</p>
                )}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className={stb.uiSubheading}>Vault History</h2>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className="p-2 rounded-full text-muted-foreground hover:bg-muted" aria-label="Filter history">
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
                    <li key={item.id} className={cn(stb.panel, 'p-4 flex gap-4')}>
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                        <OptimizedImage src={item.product_image_url || ''} alt={item.product_name} className="w-full h-full object-cover" width={80} />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col">
                        <p className="font-semibold text-foreground">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">Ordered: {formatOrderDate(item.order_date)}</p>
                        <span className={`inline-flex items-center gap-1 mt-2 text-xs font-semibold px-2 py-1 rounded w-fit ${badge.className}`}>
                          {badge.icon} {badge.label}
                        </span>
                        <Button
                          size="sm"
                          className="mt-3 w-fit rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-medium"
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
                <div className=" border border-border bg-muted/50 py-12 text-center">
                  <p className="text-muted-foreground font-medium mb-2">
                    {(summary.vault_history?.length ?? 0) > 0 ? 'No items match this filter' : 'No vault history yet'}
                  </p>
                  <p className="text-muted-foreground text-sm mb-4">
                    {(summary.vault_history?.length ?? 0) > 0 ? 'Try another filter.' : 'Paid marketplace orders will appear here.'}
                  </p>
                  {(summary.vault_history?.length ?? 0) === 0 && (
                    <Link to={createPageUrl('Marketplace')}>
                      <Button className=" bg-primary text-primary-foreground hover:opacity-95">Shop Marketplace</Button>
                    </Link>
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </PageContent>
    </div>
  );
}
