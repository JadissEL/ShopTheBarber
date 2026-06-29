/** Curated local SEO landing pages, slug is used in /barbers-in/:slug URLs. */
export type SeoCity = {
    slug: string;
    name: string;
    region: string;
    country: string;
    country_name: string;
    headline: string;
    description: string;
    keywords: string[];
};

export const SEO_CITIES: SeoCity[] = [
    {
        slug: 'paris',
        name: 'Paris',
        region: 'Île-de-France',
        country: 'FR',
        country_name: 'France',
        headline: 'Top barbers in Paris',
        description:
            'Book fades, beard trims, and premium grooming with verified barbers across Paris, shop visits or at-home service.',
        keywords: ['barber Paris', 'coiffeur homme Paris', 'barbershop Paris', 'coupe homme Paris'],
    },
    {
        slug: 'lyon',
        name: 'Lyon',
        region: 'Auvergne-Rhône-Alpes',
        country: 'FR',
        country_name: 'France',
        headline: 'Best barbers in Lyon',
        description:
            'Discover rated barbers in Lyon. Book online, compare reviews, and get groomed at the shop or at your door.',
        keywords: ['barber Lyon', 'barbershop Lyon', 'coupe barbe Lyon'],
    },
    {
        slug: 'marseille',
        name: 'Marseille',
        region: "Provence-Alpes-Côte d'Azur",
        country: 'FR',
        country_name: 'France',
        headline: 'Barbers in Marseille',
        description:
            'Find trusted barbers in Marseille for haircuts, skin fades, and beard styling, book in minutes on ShopTheBarber.',
        keywords: ['barber Marseille', 'coiffeur Marseille', 'barbershop Marseille'],
    },
    {
        slug: 'brussels',
        name: 'Brussels',
        region: 'Brussels-Capital',
        country: 'BE',
        country_name: 'Belgium',
        headline: 'Barbers in Brussels',
        description:
            'Book top-rated barbers in Brussels. Compare shops, read reviews, and schedule your next cut online.',
        keywords: ['barber Brussels', 'barbershop Brussels', 'kapper Brussel'],
    },
    {
        slug: 'london',
        name: 'London',
        region: 'Greater London',
        country: 'GB',
        country_name: 'United Kingdom',
        headline: 'Barbers in London',
        description:
            'London’s best barbers, skin fades, classic cuts, and beard grooming. Book verified pros near you.',
        keywords: ['barber London', 'barbershop London', 'mens haircut London'],
    },
    {
        slug: 'athens',
        name: 'Athens',
        region: 'Attica',
        country: 'GR',
        country_name: 'Greece',
        headline: 'Barbers in Athens',
        description:
            'Find skilled barbers in Athens. Book appointments, explore deals, and get groomed at the shop or at home.',
        keywords: ['barber Athens', 'κουρείο Αθήνα', 'barbershop Athens'],
    },
    {
        slug: 'montreal',
        name: 'Montreal',
        region: 'Quebec',
        country: 'CA',
        country_name: 'Canada',
        headline: 'Barbers in Montreal',
        description:
            'Book Montreal barbers for sharp cuts and beard work. Compare ratings and reserve your slot online.',
        keywords: ['barber Montreal', 'barbershop Montreal', 'coupe homme Montréal'],
    },
    {
        slug: 'new-york',
        name: 'New York',
        region: 'New York',
        country: 'US',
        country_name: 'United States',
        headline: 'Barbers in New York City',
        description:
            'NYC barbers for fades, tapers, and beard trims. Book trusted pros across Manhattan and boroughs.',
        keywords: ['barber NYC', 'barbershop New York', 'mens haircut NYC'],
    },
];

export function getCityBySlug(slug: string): SeoCity | undefined {
    const normalized = slug.trim().toLowerCase();
    return SEO_CITIES.find((c) => c.slug === normalized);
}
