import * as React from "react";

// 🎨 Enhanced Mobile Breakpoints
const BREAKPOINTS = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${BREAKPOINTS.md - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < BREAKPOINTS.md);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < BREAKPOINTS.md);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

// 🎨 Enhanced Mobile Responsiveness Hook
export function useResponsive() {
  const [breakpoint, setBreakpoint] = React.useState<keyof typeof BREAKPOINTS>('lg');
  const [isTouch, setIsTouch] = React.useState(false);

  React.useEffect(() => {
    // Detect touch capability
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);

    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < BREAKPOINTS.xs) setBreakpoint('xs');
      else if (width < BREAKPOINTS.sm) setBreakpoint('sm');
      else if (width < BREAKPOINTS.md) setBreakpoint('md');
      else if (width < BREAKPOINTS.lg) setBreakpoint('lg');
      else if (width < BREAKPOINTS.xl) setBreakpoint('xl');
      else setBreakpoint('2xl');
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return {
    breakpoint,
    isMobile: breakpoint === 'xs' || breakpoint === 'sm' || breakpoint === 'md',
    isTablet: breakpoint === 'lg',
    isDesktop: breakpoint === 'xl' || breakpoint === '2xl',
    isTouch,
    isLandscape: window.innerWidth > window.innerHeight,
  };
}

// 🎨 Touch Gesture Hook
export function useTouchGestures() {
  const [gesture, setGesture] = React.useState<{
    type: 'swipe' | 'pinch' | 'tap' | 'longpress';
    direction?: 'left' | 'right' | 'up' | 'down';
    distance?: number;
  } | null>(null);

  const handleTouchStart = React.useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    const startTime = Date.now();

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const endX = touch.clientX;
      const endY = touch.clientY;
      const endTime = Date.now();
      const duration = endTime - startTime;
      const distanceX = endX - startX;
      const distanceY = endY - startY;
      const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

      if (duration < 300 && distance < 10) {
        setGesture({ type: 'tap' });
      } else if (duration > 500 && distance < 10) {
        setGesture({ type: 'longpress' });
      } else if (distance > 50) {
        const isHorizontal = Math.abs(distanceX) > Math.abs(distanceY);
        const direction = isHorizontal 
          ? (distanceX > 0 ? 'right' : 'left')
          : (distanceY > 0 ? 'down' : 'up');
        
        setGesture({ 
          type: 'swipe', 
          direction, 
          distance 
        });
      }

      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchend', handleTouchEnd);
  }, []);

  React.useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart);
    return () => document.removeEventListener('touchstart', handleTouchStart);
  }, [handleTouchStart]);

  return gesture;
}
