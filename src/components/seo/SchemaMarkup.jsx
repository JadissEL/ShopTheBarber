import { Helmet } from 'react-helmet-async';

export const SchemaMarkup = ({ type = 'WebSite', data }) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

export function parseAddressFromLocation(location, city, country) {
  const locality = (city || location || '').split(',')[0]?.trim() || 'Unknown';
  const parts = (location || '').split(',').map((p) => p.trim()).filter(Boolean);
  const streetAddress = parts.length > 1 ? parts.slice(1).join(', ') : (location || '');
  const region = parts.length > 1 ? parts[1] : undefined;
  return {
    '@type': 'PostalAddress',
    streetAddress: streetAddress || undefined,
    addressLocality: locality,
    addressRegion: region,
    addressCountry: country || 'US',
  };
}

export const HairSalonSchema = ({ name, image, priceRange, location, city, country, rating, reviewCount, url }) => (
  <SchemaMarkup
    type="HairSalon"
    data={{
      '@id': url,
      name,
      image,
      url,
      priceRange: priceRange || '$$',
      address: parseAddressFromLocation(location, city, country),
      aggregateRating: rating ? {
        '@type': 'AggregateRating',
        ratingValue: rating,
        reviewCount: reviewCount || 0,
      } : undefined,
    }}
  />
);

export const BarberPersonSchema = ({ name, image, jobTitle, location, city, country, rating, reviewCount, url, shopName }) => (
  <SchemaMarkup
    type="Person"
    data={{
      '@id': url,
      name,
      image,
      url,
      jobTitle: jobTitle || 'Barber',
      worksFor: shopName ? { '@type': 'HairSalon', name: shopName } : undefined,
      address: parseAddressFromLocation(location, city, country),
      aggregateRating: rating ? {
        '@type': 'AggregateRating',
        ratingValue: rating,
        reviewCount: reviewCount || 0,
      } : undefined,
    }}
  />
);

/** @deprecated use HairSalonSchema or BarberPersonSchema */
export const LocalBusinessSchema = ({ name, image, priceRange, address, city, country, rating, reviewCount, url }) => (
  <HairSalonSchema
    name={name}
    image={image}
    priceRange={priceRange}
    location={address}
    city={city}
    country={country}
    rating={rating}
    reviewCount={reviewCount}
    url={url}
  />
);

export const ServiceSchema = ({ name, description, provider, areaServed }) => (
  <SchemaMarkup
    type="Service"
    data={{
      name,
      description,
      provider: {
        '@type': 'HairSalon',
        name: provider,
      },
      areaServed: {
        '@type': 'City',
        name: areaServed || 'Unknown',
      },
    }}
  />
);
