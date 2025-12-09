'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

interface ProgressBarProps {
  color?: string;
  height?: string;
}

const ProgressBar = ({
  color = '#FCD34D',
  height = '6px',
}: ProgressBarProps) => {
  const pathname = usePathname();
  const prevPathnameRef = useRef<string>(pathname);
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    // Configure NProgress once - optimized for speed
    NProgress.configure({
      showSpinner: false,
      trickleSpeed: 50,
      minimum: 0.08,
      easing: 'ease',
      speed: 200,
    });

    // Set custom color and height - use a single style element
    if (typeof document !== 'undefined') {
      let styleElement = document.getElementById(
        'nprogress-custom-styles'
      ) as HTMLStyleElement;

      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'nprogress-custom-styles';
        document.head.appendChild(styleElement);
      }

      styleElement.textContent = `
        #nprogress {
          pointer-events: none;
          z-index: 99999 !important;
        }
        #nprogress .bar {
          background: ${color} !important;
          height: ${height} !important;
          z-index: 99999 !important;
          box-shadow: 0 0 10px ${color}, 0 0 5px ${color} !important;
        }
        #nprogress .peg {
          box-shadow: 0 0 10px ${color}, 0 0 5px ${color} !important;
        }
      `;
    }
  }, [color, height]);

  useEffect(() => {
    // Only trigger on actual pathname change
    if (prevPathnameRef.current !== pathname && !isNavigatingRef.current) {
      isNavigatingRef.current = true;

      // Start progress on route change - NProgress will handle trickle automatically
      NProgress.start();

      // Complete progress quickly after navigation
      const timer = setTimeout(() => {
        NProgress.done();
        isNavigatingRef.current = false;
      }, 50);

      prevPathnameRef.current = pathname;

      return () => {
        clearTimeout(timer);
        NProgress.done();
        isNavigatingRef.current = false;
      };
    }
  }, [pathname]);

  return null;
};

export default ProgressBar;
