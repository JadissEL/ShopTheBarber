import { useState, useEffect, useRef } from 'react';
import { cn } from '@/components/utils';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Helper to generate optimized Unsplash URLs
 */
export const getOptimizedUnsplashUrl = (url, width, quality = 80, format = 'auto') => {
  if (!url || typeof url !== 'string' || !url.includes('images.unsplash.com')) {
    return url;
  }

  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set('w', width);
    urlObj.searchParams.set('q', quality);
    urlObj.searchParams.set('auto', 'format,compress');
    if (format && format !== 'auto') {
      urlObj.searchParams.set('fmt', format);
    }
    return urlObj.toString();
  } catch {
    return url;
  }
};

/**
 * @param {Object} props
 * @param {string} props.src
 * @param {string} [props.alt]
 * @param {string} [props.className]
 * @param {number} [props.width]
 * @param {number} [props.height]
 * @param {boolean} [props.fill]
 * @param {string} [props.aspectRatio]
 * @param {boolean} [props.priority]
 * @param {number} [props.quality]
 * @param {string} [props.fallbackSrc]
 * @param {string} [props.fit]
 * @param {string} [props.imgClassName]
 */
export const OptimizedImage = ({
  src,
  alt = "",
  className = "",
  width = 800,
  height,
  fill = false,
  aspectRatio,
  priority = false,
  quality = 80,
  fallbackSrc,
  fit = 'cover',
  imgClassName = "",
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(!priority);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState('');
  const imgRef = useRef(null);

  // Generate optimized source; avoid empty or invalid URLs (e.g. data:;base64,=)
  const rawSrc = typeof src === 'string' && src.trim() && !src.startsWith('data:;') ? src : null;
  const optimizedSrc = rawSrc ? getOptimizedUnsplashUrl(rawSrc, width, quality) : null;

  // Generate srcset for responsiveness if it's an Unsplash image
  const generateSrcSet = () => {
    if (!rawSrc || !rawSrc.includes('images.unsplash.com')) return undefined;

    const widths = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];
    return widths
      .map(w => `${getOptimizedUnsplashUrl(rawSrc, w, quality)} ${w}w`)
      .join(', ');
  };

  useEffect(() => {
    if (priority) {
      setCurrentSrc(optimizedSrc);
      setIsLoading(false);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setCurrentSrc(optimizedSrc);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '200px', // Start loading when image is 200px away from viewport
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (observer) observer.disconnect();
    };
  }, [rawSrc, optimizedSrc, priority]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setError(true);
  };

  const wrapperClasses = cn(
    "relative overflow-hidden bg-muted",
    fill ? "absolute inset-0 h-full w-full" : "",
    aspectRatio ? `aspect-[${aspectRatio}]` : "",
    className
  );

  const imgClasses = cn(
    "transition-opacity duration-500 ease-in-out",
    fill ? "absolute inset-0 h-full w-full" : "w-full h-auto",
    fit === 'cover' ? 'object-cover' : fit === 'contain' ? 'object-contain' : 'object-fill',
    isLoading ? "opacity-0" : "opacity-100",
    imgClassName
  );

  if (error) {
    return (
      <div className={cn(wrapperClasses, "flex items-center justify-center text-muted-foreground bg-slate-100")}>
        {fallbackSrc ? (
          <img
            src={fallbackSrc}
            alt={alt || "Fallback"}
            className={imgClasses}
          />
        ) : (
          <img
            src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80"
            alt={alt || "Placeholder"}
            className={imgClasses}
          />
        )}
      </div>
    );
  }

  return (
    <div ref={imgRef} className={wrapperClasses} style={aspectRatio && !fill ? { aspectRatio } : undefined}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton className="w-full h-full" />
        </div>
      )}

      {currentSrc && (
        <img
          src={currentSrc}
          alt={alt || ""}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          srcSet={generateSrcSet()}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onLoad={handleLoad}
          onError={handleError}
          className={imgClasses}
          {...props}
        />
      )}
    </div>
  );
};