import { useState, useEffect } from 'react';

/**
 * Hook to detect compact mode (tablet/small laptop screens < 1024px).
 * Use alongside useIsMobile() for finer-grained responsive control.
 */
export function useIsCompact(): boolean {
  const [isCompact, setIsCompact] = useState<boolean>(false);

  useEffect(() => {
    const checkCompact = () => {
      setIsCompact(window.innerWidth < 1024);
    };
    
    checkCompact();
    window.addEventListener('resize', checkCompact);
    return () => window.removeEventListener('resize', checkCompact);
  }, []);

  return isCompact;
}

/**
 * Hook to detect tablet screens (768px - 1023px).
 */
export function useIsTablet(): boolean {
  const [isTablet, setIsTablet] = useState<boolean>(false);

  useEffect(() => {
    const checkTablet = () => {
      const width = window.innerWidth;
      setIsTablet(width >= 768 && width < 1024);
    };
    
    checkTablet();
    window.addEventListener('resize', checkTablet);
    return () => window.removeEventListener('resize', checkTablet);
  }, []);

  return isTablet;
}
