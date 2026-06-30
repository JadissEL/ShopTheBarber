import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomeLocalCities() {
    const { data } = useQuery({
        queryKey: ['home-cities'],
        queryFn: () => sovereign.seo.listCities(),
        staleTime: 1000 * 60 * 30,
    });

    const cities = (data?.cities ?? []).slice(0, 6);
    if (!cities.length) return null;

    return (
        <section className="py-16 bg-muted/30 border-y border-border">
            <div className="container mx-auto px-6 max-w-6xl">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                    <div>
                        <p className="text-primary text-sm font-semibold uppercase tracking-wide mb-2">Local pages</p>
                        <h2 className="text-3xl font-bold text-foreground">Book barbers in your city</h2>
                        <p className="text-muted-foreground mt-2">SEO-friendly local guides with top pros, shops, and mobile options.</p>
                    </div>
                    <Button asChild variant="outline" className=" shrink-0">
                        <Link to="/cities">All cities <ArrowRight className="w-4 h-4 ml-2" /></Link>
                    </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {cities.map((city) => (
                        <Link
                            key={city.slug}
                            to={`/barbers-in/${city.slug}`}
                            className="flex items-center gap-2 p-4 rounded-lg bg-card border hover:border-primary/40 transition-colors"
                        >
                            <MapPin className="w-4 h-4 text-primary shrink-0" />
                            <span className="font-medium text-sm">{city.name}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
