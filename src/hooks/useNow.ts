import { useState, useEffect } from 'react';

export function useNow(intervalMs = 60000) {
  const [now, setNow] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        setNow(new Date());
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibility);
    
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [intervalMs]);
  
  return now;
}
