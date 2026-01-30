"use client";

import { useState, useEffect } from "react";

/**
 * SSR-safe hook to detect media query matches.
 * Returns false during SSR to prevent hydration mismatches.
 *
 * @param query - CSS media query string (e.g., "(max-width: 767px)")
 * @returns boolean indicating if the query matches
 */
export function useMediaQuery(query: string): boolean {
  // Default to false for SSR safety
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Create listener for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener (using addEventListener for modern browsers)
    mediaQuery.addEventListener("change", handleChange);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [query]);

  return matches;
}

/**
 * Convenience hook to detect mobile viewport (<768px)
 */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)");
}
