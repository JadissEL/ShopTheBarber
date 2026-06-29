import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { sovereign } from '@/api/apiClient';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Trash2, Save, Pencil, ExternalLink, X } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import ShowcaseCompletenessCard from '@/components/providerShowcase/ShowcaseCompletenessCard';

const EMPTY_ENTRY = {
    scope: 'barber',
    entry_type: 'employment',
    title: '',
    organization: '',
    location: '',
    description: '',
    started_at: '',
    ended_at: '',
    is_current: false,
};

const EMPTY_PORTFOLIO = {
    title: '',
    video_url: '',
    thumbnail_url: '',
};

function parseSkills(raw) {
    if (!raw) return [];
    try {
        if (raw.startsWith('[')) return JSON.parse(raw);
        return raw.split(',').map((s) => s.trim()).filter(Boolean);
    } catch {
        return [];
    }
}

function invalidatePublicShowcase(queryClient, barberId, shopId) {
    queryClient.invalidateQueries({ queryKey: ['provider-showcase'] });
    if (barberId) queryClient.invalidateQueries({ queryKey: ['barber-showcase', barberId] });
    if (shopId) queryClient.invalidateQueries({ queryKey: ['shop-showcase', shopId] });
}

export default function ProviderShowcaseEditor() {
    const queryClient = useQueryClient();
    const [newEntry, setNewEntry] = useState(EMPTY_ENTRY);
    const [editingEntryId, setEditingEntryId] = useState(null);
    const [newPortfolio, setNewPortfolio] = useState(EMPTY_PORTFOLIO);
    const [barberHighlights, setBarberHighlights] = useState([]);
    const [shopHighlights, setShopHighlights] = useState([]);

    const { data: config } = useQuery({
        queryKey: ['showcase-config'],
        queryFn: () => sovereign.showcase.getConfig(),
    });

    const { data, isLoading } = useQuery({
        queryKey: ['provider-showcase'],
        queryFn: () => sovereign.showcase.getMy(),
    });

    const barber = data?.barber;
    const shop = data?.shop;

    const [barberForm, setBarberForm] = useState(null);
    const [shopForm, setShopForm] = useState(null);

    useEffect(() => {
        if (!barber) {
            setBarberForm(null);
            return;
        }
        setBarberForm({
            name: barber.name || '',
            title: barber.title || '',
            bio: barber.bio || '',
            years_experience: barber.years_experience ?? '',
            career_started_year: barber.career_started_year ?? '',
            mobile_service_started_year: barber.mobile_service_started_year ?? '',
            instagram_handle: barber.instagram_handle || '',
            tiktok_handle: barber.tiktok_handle || '',
            website_url: barber.website_url || '',
            skillsText: parseSkills(barber.skills).join(', '),
        });
        setBarberHighlights(barber.profile_highlights || []);
    }, [barber]);

    useEffect(() => {
        if (!shop) {
            setShopForm(null);
            return;
        }
        setShopForm({
            description: shop.description || '',
            founded_year: shop.founded_year ?? '',
            phone: shop.phone || '',
            website_url: shop.website_url || '',
            instagram_handle: shop.instagram_handle || '',
        });
        setShopHighlights(shop.profile_highlights || []);
    }, [shop]);

    const saveBarberMutation = useMutation({
        mutationFn: (payload) => sovereign.showcase.updateBarber(payload),
        onSuccess: () => {
            invalidatePublicShowcase(queryClient, barber?.id, shop?.id);
            toast.success('Professional profile saved');
        },
        onError: (e) => toast.error(e.message || 'Failed to save'),
    });

    const saveShopMutation = useMutation({
        mutationFn: (payload) => sovereign.showcase.updateShop(payload),
        onSuccess: () => {
            invalidatePublicShowcase(queryClient, barber?.id, shop?.id);
            toast.success('Shop story saved');
        },
        onError: (e) => toast.error(e.message || 'Failed to save shop'),
    });

    const createEntryMutation = useMutation({
        mutationFn: (payload) => sovereign.showcase.createCareerEntry(payload),
        onSuccess: () => {
            invalidatePublicShowcase(queryClient, barber?.id, shop?.id);
            setNewEntry(EMPTY_ENTRY);
            setEditingEntryId(null);
            toast.success('Timeline entry added');
        },
        onError: (e) => toast.error(e.message || 'Failed to add entry'),
    });

    const updateEntryMutation = useMutation({
        mutationFn: ({ id, payload }) => sovereign.showcase.updateCareerEntry(id, payload),
        onSuccess: () => {
            invalidatePublicShowcase(queryClient, barber?.id, shop?.id);
            setNewEntry(EMPTY_ENTRY);
            setEditingEntryId(null);
            toast.success('Timeline entry updated');
        },
        onError: (e) => toast.error(e.message || 'Failed to update entry'),
    });

    const deleteEntryMutation = useMutation({
        mutationFn: (id) => sovereign.showcase.deleteCareerEntry(id),
        onSuccess: () => {
            invalidatePublicShowcase(queryClient, barber?.id, shop?.id);
            toast.success('Entry removed');
        },
    });

    const createPortfolioMutation = useMutation({
        mutationFn: (payload) => sovereign.showcase.createPortfolioItem(payload),
        onSuccess: () => {
            invalidatePublicShowcase(queryClient, barber?.id, shop?.id);
            setNewPortfolio(EMPTY_PORTFOLIO);
            toast.success('Portfolio item added');
        },
        onError: (e) => toast.error(e.message || 'Failed to add portfolio item'),
    });

    const deletePortfolioMutation = useMutation({
        mutationFn: (id) => sovereign.showcase.deletePortfolioItem(id),
        onSuccess: () => {
            invalidatePublicShowcase(queryClient, barber?.id, shop?.id);
            toast.success('Portfolio item removed');
        },
    });

    const handleSaveBarber = () => {
        if (!barberForm) return;
        saveBarberMutation.mutate({
            name: barberForm.name,
            title: barberForm.title,
            bio: barberForm.bio,
            years_experience: barberForm.years_experience === '' ? null : Number(barberForm.years_experience),
            career_started_year:
                barberForm.career_started_year === '' ? null : Number(barberForm.career_started_year),
            mobile_service_started_year:
                barberForm.mobile_service_started_year === ''
                    ? null
                    : Number(barberForm.mobile_service_started_year),
            instagram_handle: barberForm.instagram_handle || null,
            tiktok_handle: barberForm.tiktok_handle || null,
            website_url: barberForm.website_url || null,
            skills: barberForm.skillsText
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            profile_highlights: barberHighlights,
        });
    };

    const handleSaveShop = () => {
        if (!shopForm) return;
        saveShopMutation.mutate({
            description: shopForm.description,
            founded_year: shopForm.founded_year === '' ? null : Number(shopForm.founded_year),
            phone: shopForm.phone || null,
            website_url: shopForm.website_url || null,
            instagram_handle: shopForm.instagram_handle || null,
            profile_highlights: shopHighlights,
        });
    };

    const submitCareerEntry = () => {
        if (!newEntry.title.trim()) {
            toast.error('Title is required');
            return;
        }
        const payload = {
            scope: newEntry.scope,
            entry_type: newEntry.entry_type,
            title: newEntry.title,
            organization: newEntry.organization || undefined,
            location: newEntry.location || undefined,
            description: newEntry.description || undefined,
            started_at: newEntry.started_at || undefined,
            ended_at: newEntry.ended_at || undefined,
            is_current: newEntry.is_current,
        };
        if (editingEntryId) {
            updateEntryMutation.mutate({ id: editingEntryId, payload });
        } else {
            createEntryMutation.mutate(payload);
        }
    };

    const startEditEntry = (entry) => {
        setEditingEntryId(entry.id);
        setNewEntry({
            scope: entry.scope,
            entry_type: entry.entry_type,
            title: entry.title,
            organization: entry.organization || '',
            location: entry.location || '',
            description: entry.description || '',
            started_at: entry.started_at || '',
            ended_at: entry.ended_at || '',
            is_current: entry.is_current,
        });
    };

    const cancelEditEntry = () => {
        setEditingEntryId(null);
        setNewEntry(EMPTY_ENTRY);
    };

    if (isLoading) {
        return <p className="text-muted-foreground text-sm py-8">Loading profile story...</p>;
    }

    if (!barber && !shop) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-muted-foreground text-sm">
                    Complete your barber or shop setup first to build your public showcase profile.
                </CardContent>
            </Card>
        );
    }

    const entryTypes = config?.career_entry_types ?? [];
    const suggested = config?.suggested_highlights ?? [];
    const allEntries = [
        ...(barber?.career_entries ?? []).map((e) => ({ ...e, scope: 'barber' })),
        ...(shop?.career_entries ?? []).map((e) => ({ ...e, scope: 'shop' })),
    ].sort((a, b) => a.sort_order - b.sort_order);
    const portfolioItems = barber?.portfolio ?? [];

    return (
        <div className="space-y-6">
            <ShowcaseCompletenessCard barber={barber} shop={shop} />

            <Card className="border-slate-200 shadow-sm rounded-3xl bg-card">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div>
                        <CardTitle>Your professional story</CardTitle>
                        <CardDescription>
                            Clients see this on your public profile, education, work history, shop opening
                            year, mobile service, portfolio, and more.
                        </CardDescription>
                    </div>
                    {barber?.id && (
                        <Button variant="outline" size="sm" asChild className="shrink-0">
                            <Link
                                to={createPageUrl(`BarberProfile?id=${barber.id}`)}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Preview profile
                            </Link>
                        </Button>
                    )}
                </CardHeader>
            </Card>

            {barberForm && (
                <Card className="border-slate-200 shadow-sm rounded-3xl bg-card">
                    <CardHeader>
                        <CardTitle className="text-lg">Barber profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-8 pt-0">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <Label>Display name</Label>
                                <Input
                                    value={barberForm.name}
                                    onChange={(e) => setBarberForm({ ...barberForm, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Headline / title</Label>
                                <Input
                                    placeholder="Master barber, Fade specialist"
                                    value={barberForm.title}
                                    onChange={(e) => setBarberForm({ ...barberForm, title: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Bio</Label>
                            <Textarea
                                rows={4}
                                placeholder="Your story, style, and what makes you different..."
                                value={barberForm.bio}
                                onChange={(e) => setBarberForm({ ...barberForm, bio: e.target.value })}
                            />
                        </div>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div>
                                <Label>Years of experience</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    max={70}
                                    value={barberForm.years_experience}
                                    onChange={(e) =>
                                        setBarberForm({ ...barberForm, years_experience: e.target.value })
                                    }
                                />
                            </div>
                            <div>
                                <Label>Career started (year)</Label>
                                <Input
                                    type="number"
                                    placeholder="2015"
                                    value={barberForm.career_started_year}
                                    onChange={(e) =>
                                        setBarberForm({ ...barberForm, career_started_year: e.target.value })
                                    }
                                />
                            </div>
                            <div>
                                <Label>Mobile / van started (year)</Label>
                                <Input
                                    type="number"
                                    placeholder="2020"
                                    value={barberForm.mobile_service_started_year}
                                    onChange={(e) =>
                                        setBarberForm({
                                            ...barberForm,
                                            mobile_service_started_year: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Specialties (comma-separated)</Label>
                            <Input
                                placeholder="Fades, Beard, Hot towel shave"
                                value={barberForm.skillsText}
                                onChange={(e) =>
                                    setBarberForm({ ...barberForm, skillsText: e.target.value })
                                }
                            />
                        </div>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div>
                                <Label>Instagram</Label>
                                <Input
                                    placeholder="@handle"
                                    value={barberForm.instagram_handle}
                                    onChange={(e) =>
                                        setBarberForm({ ...barberForm, instagram_handle: e.target.value })
                                    }
                                />
                            </div>
                            <div>
                                <Label>TikTok</Label>
                                <Input
                                    placeholder="@handle"
                                    value={barberForm.tiktok_handle}
                                    onChange={(e) =>
                                        setBarberForm({ ...barberForm, tiktok_handle: e.target.value })
                                    }
                                />
                            </div>
                            <div>
                                <Label>Website</Label>
                                <Input
                                    placeholder="https://..."
                                    value={barberForm.website_url}
                                    onChange={(e) =>
                                        setBarberForm({ ...barberForm, website_url: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                        <HighlightEditor
                            label="Profile highlights"
                            highlights={barberHighlights}
                            suggested={suggested}
                            onAdd={(text) =>
                                setBarberHighlights((h) => [...new Set([...h, text.trim()])])
                            }
                            onRemove={(tag) => setBarberHighlights((h) => h.filter((x) => x !== tag))}
                        />
                        <Button onClick={handleSaveBarber} disabled={saveBarberMutation.isPending}>
                            <Save className="w-4 h-4 mr-2" />
                            Save barber profile
                        </Button>
                    </CardContent>
                </Card>
            )}

            {shopForm && (
                <Card className="border-slate-200 shadow-sm rounded-3xl bg-card">
                    <CardHeader>
                        <CardTitle className="text-lg">Shop story</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-8 pt-0">
                        <div>
                            <Label>About the shop</Label>
                            <Textarea
                                rows={4}
                                value={shopForm.description}
                                onChange={(e) =>
                                    setShopForm({ ...shopForm, description: e.target.value })
                                }
                            />
                        </div>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div>
                                <Label>Year shop opened</Label>
                                <Input
                                    type="number"
                                    placeholder="2019"
                                    value={shopForm.founded_year}
                                    onChange={(e) =>
                                        setShopForm({ ...shopForm, founded_year: e.target.value })
                                    }
                                />
                            </div>
                            <div>
                                <Label>Shop phone</Label>
                                <Input
                                    value={shopForm.phone}
                                    onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Shop Instagram</Label>
                                <Input
                                    value={shopForm.instagram_handle}
                                    onChange={(e) =>
                                        setShopForm({ ...shopForm, instagram_handle: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                        <HighlightEditor
                            label="Shop highlights"
                            highlights={shopHighlights}
                            suggested={suggested}
                            onAdd={(text) =>
                                setShopHighlights((h) => [...new Set([...h, text.trim()])])
                            }
                            onRemove={(tag) => setShopHighlights((h) => h.filter((x) => x !== tag))}
                        />
                        <Button onClick={handleSaveShop} disabled={saveShopMutation.isPending}>
                            <Save className="w-4 h-4 mr-2" />
                            Save shop story
                        </Button>
                    </CardContent>
                </Card>
            )}

            {barber && (
                <Card className="border-slate-200 shadow-sm rounded-3xl bg-card">
                    <CardHeader>
                        <CardTitle className="text-lg">Portfolio</CardTitle>
                        <CardDescription>
                            Add photos or video links of your best work. Active items appear on your public
                            profile Portfolio tab.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 p-8 pt-0">
                        {portfolioItems.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {portfolioItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="relative aspect-square rounded-2xl overflow-hidden border border-border group"
                                    >
                                        <OptimizedImage
                                            src={
                                                item.thumbnail_url ||
                                                item.video_url ||
                                                'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&fit=crop'
                                            }
                                            alt={item.title}
                                            fill
                                            imgClassName="object-cover"
                                        />
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                                            <p className="text-white text-xs font-semibold line-clamp-2">
                                                {item.title}
                                            </p>
                                        </div>
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => deletePortfolioMutation.mutate(item.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="rounded-xl border border-dashed border-border p-4 space-y-3">
                            <p className="text-sm font-semibold">Add portfolio item</p>
                            <Input
                                placeholder="Title, e.g. Skin fade transformation"
                                value={newPortfolio.title}
                                onChange={(e) =>
                                    setNewPortfolio({ ...newPortfolio, title: e.target.value })
                                }
                            />
                            <Input
                                placeholder="Media URL (image or video link)"
                                value={newPortfolio.video_url}
                                onChange={(e) =>
                                    setNewPortfolio({ ...newPortfolio, video_url: e.target.value })
                                }
                            />
                            <Input
                                placeholder="Thumbnail URL (optional)"
                                value={newPortfolio.thumbnail_url}
                                onChange={(e) =>
                                    setNewPortfolio({ ...newPortfolio, thumbnail_url: e.target.value })
                                }
                            />
                            <Button
                                onClick={() => {
                                    if (!newPortfolio.title.trim() || !newPortfolio.video_url.trim()) {
                                        toast.error('Title and media URL are required');
                                        return;
                                    }
                                    createPortfolioMutation.mutate({
                                        title: newPortfolio.title,
                                        video_url: newPortfolio.video_url,
                                        thumbnail_url: newPortfolio.thumbnail_url || null,
                                    });
                                }}
                                disabled={createPortfolioMutation.isPending}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add to portfolio
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="border-slate-200 shadow-sm rounded-3xl bg-card">
                <CardHeader>
                    <CardTitle className="text-lg">Career timeline</CardTitle>
                    <CardDescription>
                        Add education, past jobs, licenses, awards, or milestones like opening your shop.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-8 pt-0">
                    {allEntries.length > 0 && (
                        <div className="space-y-3">
                            {allEntries.map((entry) => (
                                <div
                                    key={entry.id}
                                    className="flex items-start justify-between gap-4 rounded-xl border border-border p-4"
                                >
                                    <div>
                                        <p className="font-semibold text-sm">{entry.title}</p>
                                        <p className="text-xs text-muted-foreground capitalize">
                                            {entry.scope}, {entry.entry_type}
                                            {entry.organization ? `, ${entry.organization}` : ''}
                                        </p>
                                        {(entry.started_at || entry.ended_at) && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {entry.started_at}
                                                {entry.ended_at
                                                    ? ` - ${entry.ended_at}`
                                                    : entry.is_current
                                                      ? ' - Present'
                                                      : ''}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => startEditEntry(entry)}
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => deleteEntryMutation.mutate(entry.id)}
                                        >
                                            <Trash2 className="w-4 h-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="rounded-xl border border-dashed border-border p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold">
                                {editingEntryId ? 'Edit timeline entry' : 'Add timeline entry'}
                            </p>
                            {editingEntryId && (
                                <Button variant="ghost" size="sm" onClick={cancelEditEntry}>
                                    <X className="w-4 h-4 mr-1" />
                                    Cancel
                                </Button>
                            )}
                        </div>
                        <div className="grid md:grid-cols-2 gap-3">
                            <div>
                                <Label>Applies to</Label>
                                <select
                                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                    value={newEntry.scope}
                                    onChange={(e) => setNewEntry({ ...newEntry, scope: e.target.value })}
                                >
                                    {barber && <option value="barber">My barber profile</option>}
                                    {shop && <option value="shop">My shop</option>}
                                </select>
                            </div>
                            <div>
                                <Label>Type</Label>
                                <select
                                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                    value={newEntry.entry_type}
                                    onChange={(e) =>
                                        setNewEntry({ ...newEntry, entry_type: e.target.value })
                                    }
                                >
                                    {entryTypes.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <Input
                            placeholder="Title, e.g. Master Barber License"
                            value={newEntry.title}
                            onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                        />
                        <div className="grid md:grid-cols-2 gap-3">
                            <Input
                                placeholder="School / employer / issuer"
                                value={newEntry.organization}
                                onChange={(e) =>
                                    setNewEntry({ ...newEntry, organization: e.target.value })
                                }
                            />
                            <Input
                                placeholder="City or location"
                                value={newEntry.location}
                                onChange={(e) => setNewEntry({ ...newEntry, location: e.target.value })}
                            />
                        </div>
                        <div className="grid md:grid-cols-2 gap-3">
                            <Input
                                placeholder="Start year (e.g. 2018)"
                                value={newEntry.started_at}
                                onChange={(e) =>
                                    setNewEntry({ ...newEntry, started_at: e.target.value })
                                }
                            />
                            <Input
                                placeholder="End year (leave blank if current)"
                                value={newEntry.ended_at}
                                onChange={(e) => setNewEntry({ ...newEntry, ended_at: e.target.value })}
                            />
                        </div>
                        <Textarea
                            rows={2}
                            placeholder="Optional details clients should know"
                            value={newEntry.description}
                            onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                        />
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={newEntry.is_current}
                                onChange={(e) =>
                                    setNewEntry({ ...newEntry, is_current: e.target.checked })
                                }
                            />
                            Currently here / still active
                        </label>
                        <Button
                            onClick={submitCareerEntry}
                            disabled={createEntryMutation.isPending || updateEntryMutation.isPending}
                        >
                            {editingEntryId ? (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Update entry
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add to timeline
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function HighlightEditor({ label, highlights, suggested, onAdd, onRemove }) {
    const [input, setInput] = useState('');

    const handleAdd = () => {
        const text = input.trim();
        if (!text) return;
        onAdd(text);
        setInput('');
    };

    return (
        <div>
            <Label>{label}</Label>
            <div className="flex gap-2 mt-1 mb-2">
                <Input
                    placeholder="Add a highlight tag"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
                />
                <Button type="button" variant="outline" onClick={handleAdd}>
                    Add
                </Button>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
                {highlights.map((tag) => (
                    <button
                        key={tag}
                        type="button"
                        onClick={() => onRemove(tag)}
                        className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary hover:bg-destructive/10 hover:text-destructive"
                    >
                        {tag} ×
                    </button>
                ))}
            </div>
            {suggested.length > 0 && (
                <p className="text-xs text-muted-foreground">
                    Suggestions:{' '}
                    {suggested.slice(0, 5).map((s) => (
                        <button
                            key={s}
                            type="button"
                            className="underline mr-2"
                            onClick={() => setInput(s)}
                        >
                            {s}
                        </button>
                    ))}
                </p>
            )}
        </div>
    );
}
