import { Helmet } from 'react-helmet-async';

export const MetaTags = ({
  title,
  description = "Premium grooming services at your fingertips. Book appointments with top barbers near you.",
  image = "https://images.unsplash.com/photo-1503951914290-93d32b06769c?w=1200&auto=format&fit=crop",
  type = "website",
  canonicalUrl = '' // Optional - falls back to current URL
}) => {
  const siteTitle = "ShopTheBarber";
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const url = canonicalUrl || currentUrl;

  return (
    <Helmet>
      {/* Standard Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={siteTitle} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};