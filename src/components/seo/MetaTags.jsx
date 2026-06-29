import { Helmet } from 'react-helmet-async';

const SITE_ORIGIN = typeof window !== 'undefined' ? window.location.origin : 'https://shop-the-barber.vercel.app';

export const MetaTags = ({
  title,
  description = "Premium grooming services at your fingertips. Book appointments with top barbers near you.",
  image = "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200&auto=format&fit=crop",
  type = "website",
  canonicalUrl = '',
  keywords = '',
  noindex = false,
  locale = 'en_US',
}) => {
  const siteTitle = "ShopTheBarber";
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const url = canonicalUrl || currentUrl;

  return (
    <Helmet>
      <html lang="en" />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords ? <meta name="keywords" content={keywords} /> : null}
      <link rel="canonical" href={url} />
      {noindex ? <meta name="robots" content="noindex, nofollow" /> : <meta name="robots" content="index, follow" />}

      <meta property="og:locale" content={locale} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={siteTitle} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      <meta name="application-name" content={siteTitle} />
      <link rel="alternate" hrefLang="en" href={url} />
      <link rel="alternate" hrefLang="x-default" href={url.startsWith('http') ? url : `${SITE_ORIGIN}${url}`} />
    </Helmet>
  );
};