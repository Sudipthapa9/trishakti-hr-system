/**
 * Observes the browser width for the responsive web sidebar. This is part of the website, not a native mobile app.
 */
import { useSyncExternalStore } from "react";

// Keep module-level configuration outside rendering so it is shared between component instances.
const mobileQuery = "(max-width: 767px)";

// Listen for media-query changes and return a cleanup callback to remove the listener.
function subscribe(callback: () => void) {
  const mediaQuery = window.matchMedia(mobileQuery);
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

// Read whether the browser currently matches the narrow-layout media query.
function getSnapshot() {
  return window.matchMedia(mobileQuery).matches;
}

// Provide a stable desktop fallback when browser APIs are unavailable during server rendering.
function getServerSnapshot() {
  return false;
}

// Expose media-query changes through React's external-store subscription API.
export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
