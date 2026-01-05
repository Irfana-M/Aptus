import { useEffect, useState } from "react";

/**
 * A custom hook that returns a debounced version of the provided value.
 * Useful for limiting the frequency of expensive operations like API calls
 * during rapid state changes (e.g., search input typing).
 * 
 * @param value The value to be debounced
 * @param delay The delay in milliseconds (default: 300ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set a timer to update the debounced value after the specified delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timer if the value changes or the component unmounts
    // This effectively cancels the previous timer and starts a new one
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
