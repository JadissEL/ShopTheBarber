import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { MetaTags } from '@/components/seo/MetaTags';
import { SchemaMarkup } from '@/components/seo/SchemaMarkup';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, ArrowRight, Loader2 } from 'lucide-react';

export default function CitiesDirectory() {
    const { data, isLoading } = useQuery({
        queryKey: ['cities-directory'],
        queryFn: () => sovereign.seo.listCities(),
    });

    const cities = data?.cities ?? [];

    return (
        <div className="min-h-screen py-12 bg-background">
            <MetaTags
                title="Find barbers by city"
                description="Browse ShopTheBarber local pages, book top-rated barbers in Paris, London, Brussels, Athens, and more."
                canonicalUrl={typeof window !== 'undefined' ? `${window.location.origin}/cities` : undefined}
            />
            <SchemaMarkup
                type="CollectionPage"
                data={{
                    name: 'Barbers by city',
                    description: 'Local barber booking pages across major cities.',
                    url: typeof window !== 'undefined' ? `${window.location.origin}/cities` : '',
                }}
            />

            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                <h1 className="text-4xl font-display font-bold mb-3">Find barbers near you</h1>
                <p className="text-lg text-muted-foreground mb-10">
                    Local landing pages with top-rated pros, shop listings, and at-home options.
                </p>

                {isLoading ? (
                    <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                        {cities.map((city) => (
                            <Link key={city.slug} to={`/barbers-in/${city.slug}`}>
                                <Card className="h-full hover:border-primary/50 transition-colors">
                                    <CardContent className="p-6 flex items-start justify-between gap-4">
                                        <div>
                                            <h2 className="text-xl font-bold">{city.name}</h2>
                                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                                <MapPin className="w-3.5 h-3.5" />
                                                {city.region}, {city.country_name}
                                            </p>
                                            <p className="text-sm mt-3 text-muted-foreground">{city.headline}</p>
                                            <p className="text-xs mt-2 text-primary font-medium">{city.barber_count} barbers</p>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
