
'use client';

import { useState, useEffect, useCallback } from 'react';

// A custom hook to manage state that is persisted to localStorage.
export function useLocalStorageState<T>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>, () => void] {
  // Use a function with useState so that localStorage is only accessed once on initial render.
  const [storedValue, setStoredValue] = useState<T>(() => {
    // This code only runs on the client-side.
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  });

  // This effect updates localStorage whenever the state changes.
  useEffect(() => {
    try {
      const valueToStore =
        typeof storedValue === 'function'
          ? storedValue(storedValue)
          : storedValue;
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, storedValue]);

  // A function to manually clear the state from localStorage and reset it.
  const clearValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue); // Reset state to initial value
    } catch (error) {
      console.error(`Error removing localStorage key “${key}”:`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setStoredValue, clearValue];
}
