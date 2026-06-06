'use client';

import { useState, useEffect } from 'react';

export function useDebouncedSearch(delay = 400) {
  const [value, setValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return { value, setValue, debouncedValue };
}
