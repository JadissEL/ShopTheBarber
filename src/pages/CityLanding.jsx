import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { MetaTags } from '@/components/seo/MetaTags';
import { SchemaMarkup } from '@/components/seo/SchemaMarkup';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ServiceLocationBadges from '@/components/serviceLocation/ServiceLocationBadges';
import { MapPin, Star, Scissors, Loader2, ArrowRight, Home as HomeIcon } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import ReferralLoopBanner from '@/components/referral/ReferralLoopBanner';
import { barberProfileUrl } from '@/lib/seoUtils';

export default function CityLanding({ citySlug }) {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['city-landing', citySlug],
        queryFn: () => sovereign.seo.getCity(citySlug),
        enabled: !!citySlug,
    });

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isError || !data?.city) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center gap-4">
                <MetaTags title="City not found" noindex />
                <h1 className="text-2xl font-bold">City page not found</h1>
                <p className="text-muted-foreground">Browse all cities or explore barbers near you.</p>
                <div className="flex gap-3">
                    <Button asChild variant="outline"><Link to="/cities">All cities</Link></Button>
                    <Button asChild><Link to="/Explore">Explore barbers</Link></Button>
                </div>
            </div>
        );
    }

    const { city, barbers, shops, stats } = data;
    const canonical = city.url || `${window.location.origin}/barbers-in/${city.slug}`;
    const exploreUrl = `/Explore?city=${encodeURIComponent(city.name)}`;

    return (
        <div className="pb-16">
            <MetaTags
                title={`Barbers in ${city.name}`}
                description={city.description}
                canonicalUrl={canonical}
                keywords={city.keywords?.join(', ')}
            />
            <SchemaMarkup
                type="WebPage"
                data={{
                    name: city.headline,
                    description: city.description,
                    url: canonical,
                    isPartOf: { '@type': 'WebSite', name: 'ShopTheBarber', url: window.location.origin },
                }}
            />
            <SchemaMarkup
                type="ItemList"
                data={{
                    name: `Barbers in ${city.name}`,
                    itemListElement: (barbers || []).slice(0, 8).map((b, i) => ({
                        '@type': 'ListItem',
                        position: i + 1,
                        url: `${barberProfileUrl(b.id)}`,
                        name: b.name,
                    })),
                }}
            />

            <section className="relative overflow-hidden bg-gradient-to-br from-charcoal via-charcoal to-primary/30 text-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
                    <Badge className="mb-4 bg-white/10 text-white border-white/20">{city.region}, {city.country_name}</Badge>
                    <h1 className="text-4xl sm:text-5xl font-display font-bold mb-4">{city.headline}</h1>
                    <p className="text-lg text-white/85 max-w-2xl mb-8">{city.description}</p>
                    <div className="flex flex-wrap gap-3 text-sm text-white/80 mb-8">
                        <span>{stats?.barber_count ?? barbers?.length ?? 0} barbers listed</span>
                        {(stats?.mobile_barber_count ?? 0) > 0 && (
                            <span>, {stats.mobile_barber_count} offer at-home service</span>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button asChild size="lg" className="rounded-xl bg-card text-charcoal hover:bg-white/90">
                            <Link to={exploreUrl}>Browse in {city.name} <ArrowRight className="w-4 h-4 ml-2" /></Link>
                        </Button>
                        <Button asChild size="lg" variant="outline" className="rounded-xl border-white/40 text-white hover:bg-white/10">
                            <Link to="/cities">Other cities</Link>
                        </Button>
                    </div>
                </div>
            </section>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-8">
                <ReferralLoopBanner compact className="mb-10" />
            </div>

            <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
                <h2 className="text-2xl font-bold mb-6">Top barbers in {city.name}</h2>
                {barbers?.length ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {barbers.map((barber) => (
                            <Card key={barber.id} className="overflow-hidden border-none shadow-soft hover:shadow-lg transition-shadow">
                                <div className="relative h-44 bg-muted">
                                    <OptimizedImage
                                        src={barber.image_url || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop'}
                                        alt={barber.name}
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute top-3 left-3">
                                        <ServiceLocationBadges barber={barber} size="xs" />
                                    </div>
                                </div>
                                <CardContent className="p-5">
                                    <h3 className="font-bold text-lg">{barber.name}</h3>
                                    <p className="text-sm text-muted-foreground mb-2">{barber.title}</p>
                                    <div className="flex items-center gap-3 text-sm mb-4">
                                        <span className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-500 fill-amber-500" />{barber.rating?.toFixed(1) ?? '-'}</span>
                                        <span className="text-muted-foreground">({barber.review_count ?? 0} reviews)</span>
                                    </div>
                                    {barber.location && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-4"><MapPin className="w-3 h-3" />{barber.location}</p>
                                    )}
                                    <Button asChild className="w-full rounded-xl">
                                        <Link to={`/BarberProfile?id=${barber.id}`}>View profile</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="border-dashed">
                        <CardContent className="py-12 text-center">
                            <Scissors className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                            <p className="text-muted-foreground mb-4">We&apos;re growing in {city.name}. Be the first pro listed, or explore nearby cities.</p>
                            <Button asChild><Link to="/Explore">Explore all barbers</Link></Button>
                        </CardContent>
                    </Card>
                )}
            </section>

            {shops?.length > 0 && (
                <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
                    <h2 className="text-2xl font-bold mb-6">Barbershops in {city.name}</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {shops.map((shop) => (
                            <Link key={shop.id} to={`/ShopProfile?id=${shop.id}`} className="block p-4 rounded-xl border bg-card hover:border-primary/40 transition-colors">
                                <p className="font-semibold">{shop.name}</p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{shop.location}</p>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
                <Card className="bg-muted/40 border-none">
                    <CardContent className="p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-xl font-bold flex items-center gap-2"><HomeIcon className="w-5 h-5" /> At-home grooming in {city.name}</h3>
                            <p className="text-muted-foreground mt-1">Filter Explore for mobile barbers who come to you.</p>
                        </div>
                        <Button asChild className="rounded-xl shrink-0">
                            <Link to={`/Explore?mobile=1&city=${encodeURIComponent(city.name)}`}>Mobile barbers</Link>
                        </Button>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
