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

export const LocalBusinessSchema = ({ name, image, priceRange, address, rating, reviewCount }) => (
  <SchemaMarkup 
    type="LocalBusiness"
    data={{
      name,
      image,
      priceRange: priceRange || '$$',
      address: {
        '@type': 'PostalAddress',
        streetAddress: address || '',
        addressLocality: 'San Francisco', // Default for demo
        addressRegion: 'CA',
        addressCountry: 'US'
      },
      aggregateRating: rating ? {
        '@type': 'AggregateRating',
        ratingValue: rating,
        reviewCount: reviewCount || 0
      } : undefined
    }}
  />
);

export const ServiceSchema = ({ name, description, provider, areaServed }) => (
  <SchemaMarkup 
    type="Service"
    data={{
      name,
      description,
      provider: {
        '@type': 'LocalBusiness',
        name: provider
      },
      areaServed: {
        '@type': 'City',
        name: areaServed || 'San Francisco'
      }
    }}
  />
);