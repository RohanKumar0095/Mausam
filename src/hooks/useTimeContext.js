import { useState, useEffect } from 'react';
import { timeContextService } from '../services/timeContextService';

/**
 * Custom hook to consume the authoritative TimeContextService.
 * Automatically updates state on minute ticks and window focus.
 */
export function useTimeContext() {
  const [timeContext, setTimeContext] = useState(() => timeContextService.getCurrentContext());

  useEffect(() => {
    // Initial sync
    setTimeContext(timeContextService.getCurrentContext());

    // Subscribe to periodic time updates
    const unsubscribe = timeContextService.subscribe((updatedCtx) => {
      setTimeContext(updatedCtx);
    });

    return () => unsubscribe();
  }, []);

  return timeContext;
}
