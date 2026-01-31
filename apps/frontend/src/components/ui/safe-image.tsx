'use client';

import Image, { type ImageProps } from 'next/image';
import { useMemo, useState } from 'react';

type SafeImageProps = Omit<ImageProps, 'src'> & {
  src: string;
  /** Fallback if the image fails to load after retries. */
  fallbackSrc?: string;
  /** How many retries before falling back. Default: 2 */
  maxRetries?: number;
};

function isVercelBlobUrl(url: string) {
  // Examples:
  //  - https://xxxx.public.blob.vercel-storage.com/...
  //  - https://xxxx.blob.vercel-storage.com/...
  return /\.blob\.vercel-storage\.com\//i.test(url);
}

function withCacheBust(url: string) {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}v=${Date.now()}`;
}

/**
 * A resilient wrapper around next/image to avoid intermittent image failures in production.
 *
 * Why:
 * - Vercel Blob URLs are already CDN-served and immutable; Next's optimizer can occasionally
 *   timeout or fail under load, causing broken images until refresh.
 *
 * What this does:
 * - For Vercel Blob URLs, it bypasses Next optimization (unoptimized) to hit the CDN directly.
 * - Adds a small retry with cache-busting query param.
 */
export function SafeImage({
  src,
  fallbackSrc = '/placeholder-car.png',
  maxRetries = 2,
  onError,
  unoptimized,
  ...props
}: SafeImageProps) {
  const normalizedSrc = (src || '').trim() || fallbackSrc;
  const [currentSrc, setCurrentSrc] = useState(normalizedSrc);
  const [attempt, setAttempt] = useState(0);

  const shouldBypassOptimizer = useMemo(() => {
    if (!currentSrc) return false;
    if (unoptimized) return true;
    return isVercelBlobUrl(currentSrc);
  }, [currentSrc, unoptimized]);

  return (
    <Image
      {...props}
      src={currentSrc}
      unoptimized={shouldBypassOptimizer}
      onError={(e) => {
        onError?.(e);
        // Retry a couple of times (helps with transient CDN/optimizer hiccups)
        if (attempt < maxRetries) {
          setAttempt((a) => a + 1);
          setCurrentSrc((prev) => withCacheBust(prev));
          return;
        }
        // Fallback
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
}
