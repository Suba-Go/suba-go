'use client';

import { useEffect, useState } from 'react';

/**
 * A single flying object that crosses the screen from left→right or right→left.
 * After it finishes, it waits a random delay and flies again with a new shape/position.
 */
interface FlyingObj {
  id: number;
  shape: 'rocket' | 'car' | 'diamond' | 'star' | 'circle' | 'bolt' | 'trophy';
  y: number;           // top position in %
  duration: number;     // seconds to cross screen
  delay: number;        // initial delay in seconds
  direction: 'ltr' | 'rtl';
  size: number;         // px
  rotation: number;     // degrees
}

const SHAPES = ['rocket', 'car', 'diamond', 'star', 'circle', 'bolt', 'trophy'] as const;

function randomBetween(a: number, b: number) {
  return Math.random() * (b - a) + a;
}

function generateObj(id: number): FlyingObj {
  return {
    id,
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    y: randomBetween(5, 90),
    duration: randomBetween(12, 28),
    delay: randomBetween(0, 18),
    direction: Math.random() > 0.5 ? 'ltr' : 'rtl',
    size: randomBetween(16, 30),
    rotation: randomBetween(-20, 20),
  };
}

function ShapeSVG({ shape, size }: { shape: FlyingObj['shape']; size: number }) {
  const s = size;
  switch (shape) {
    case 'rocket':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
          <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
          <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
          <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
        </svg>
      );
    case 'car':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
          <circle cx="7" cy="17" r="2" />
          <path d="M9 17h6" />
          <circle cx="17" cy="17" r="2" />
        </svg>
      );
    case 'diamond':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z" />
        </svg>
      );
    case 'star':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case 'circle':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      );
    case 'bolt':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      );
    case 'trophy':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
      );
  }
}

export default function FlyingObjects() {
  const [objects, setObjects] = useState<FlyingObj[]>([]);

  useEffect(() => {
    // Generate 8 objects with staggered delays
    const objs = Array.from({ length: 8 }, (_, i) => generateObj(i));
    setObjects(objs);
  }, []);

  if (objects.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[1] pointer-events-none overflow-hidden" aria-hidden="true">
      {objects.map((obj) => (
        <div
          key={obj.id}
          className="absolute flying-object"
          style={{
            top: `${obj.y}%`,
            animationDuration: `${obj.duration}s`,
            animationDelay: `${obj.delay}s`,
            animationDirection: obj.direction === 'rtl' ? 'reverse' : 'normal',
            transform: `rotate(${obj.rotation}deg)`,
            ['--fly-rotation' as string]: `${obj.rotation}deg`,
          }}
        >
          <span
            className="text-yellow/[0.06] hover:text-yellow/[0.12] transition-colors duration-1000"
            style={{
              display: 'block',
              transform: obj.direction === 'rtl' ? 'scaleX(-1)' : 'none',
            }}
          >
            <ShapeSVG shape={obj.shape} size={obj.size} />
          </span>
        </div>
      ))}
    </div>
  );
}
