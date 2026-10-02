import { useEffect, useState } from 'react';

import { DEBOUNCE_DELAY } from '@/utils/constants';

export function useDebounce<T>(value: T, delay = DEBOUNCE_DELAY): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
