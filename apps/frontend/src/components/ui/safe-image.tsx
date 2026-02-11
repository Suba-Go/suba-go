'use client';

import * as React from 'react';

type NativeImgProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src?: string | null;
  fallbackSrc?: string;
};

/**
 * Props de compatibilidad (estilo next/image) que a veces quedan en componentes.
 * No se pasan al DOM, pero permiten que TS no marque error y que el comportamiento sea razonable.
 */
type NextImageCompatProps = {
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  // Estas existen en <img> (sizes) o son comunes en next/image y queremos tolerarlas.
  // No hacemos nada especial con ellas salvo evitar que rompan el tipado o el DOM.
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  loader?: unknown;
  unoptimized?: boolean;
};

export type SafeImageProps = NativeImgProps & NextImageCompatProps;

function normalizeSrc(src?: string | null): string | undefined {
  if (!src) return undefined;

  const trimmed = String(src).trim();
  if (!trimmed) return undefined;

  // data: / blob: deben pasar tal cual
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;

  // URL absoluta
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  // URL con esquema omitido 
  if (trimmed.startsWith('//')) return `https:${trimmed}`;

  // URL sin esquema pero con dominio 
  // si el primer segmento contiene un punto, asumimos que es un host.
  const firstSegment = trimmed.split('/')[0] ?? '';
  if (firstSegment.includes('.')) return `https://${trimmed}`;

  // Si viene tipo "uploads/xxx.png", lo hacemos absoluto para evitar rutas relativas rotas
  if (!trimmed.startsWith('/')) return `/${trimmed}`;

  return trimmed;
}

export function SafeImage(props: SafeImageProps) {
  const {
    src,
    alt,
    fallbackSrc = '/placeholder-car.png',

    // Compat props (NO van al DOM)
    fill,
    priority,
    quality,
    placeholder,
    blurDataURL,
    loader,
    unoptimized,

    // Props nativas
    className,
    style,
    onError,
    loading,
    decoding,
    fetchPriority,

    ...rest
  } = props;

  const initial = normalizeSrc(src) ?? fallbackSrc;
  const [currentSrc, setCurrentSrc] = React.useState<string>(initial);
  const hasErroredRef = React.useRef(false);
  const retryRef = React.useRef(0);

  // Si cambia src externo, reseteamos
  React.useEffect(() => {
    const next = normalizeSrc(src) ?? fallbackSrc;
    hasErroredRef.current = false;
    retryRef.current = 0;
    setCurrentSrc(next);
  }, [src, fallbackSrc]);

  const handleError: React.ReactEventHandler<HTMLImageElement> = (e) => {
    // First retry: fix very common Vercel Blob case-sensitivity issue (/Uploads/ vs /uploads/)
    // before falling back to placeholder.
    if (retryRef.current === 0) {
      const fixed = currentSrc
        .replaceAll('/Uploads/', '/uploads/')
        .replace(/%2FUploads%2F/gi, '%2Fuploads%2F');
      if (fixed !== currentSrc) {
        retryRef.current = 1;
        setCurrentSrc(fixed);
        return;
      }
    }

    if (!hasErroredRef.current) {
      hasErroredRef.current = true;
      setCurrentSrc(fallbackSrc);
    }
    onError?.(e);
  };

  // priority en next/image → lo más parecido en <img> es eager + high fetchPriority
  const resolvedLoading = priority ? 'eager' : (loading ?? 'lazy');
  const resolvedFetchPriority = priority ? 'high' : fetchPriority;

  // fill en next/image: ocupa todo el contenedor (requiere que el padre sea position: relative)
  const resolvedStyle: React.CSSProperties =
    fill
      ? {
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: (style as any)?.objectFit ?? 'cover',
          ...style,
        }
      : {
          ...style,
        };

  // Importante: filtramos props compat para que NO lleguen al DOM.
  // También filtramos "quality" (no existe en <img>) y otras.
  // rest ya no incluye esas props porque las desestructuramos arriba.

  return (
    <img
      {...rest}
      src={currentSrc}
      alt={alt ?? ''}
      className={className}
      style={resolvedStyle}
      loading={resolvedLoading}
      decoding={decoding ?? 'async'}
      fetchPriority={resolvedFetchPriority as any}
      onError={handleError}
    />
  );
}

export default SafeImage;
