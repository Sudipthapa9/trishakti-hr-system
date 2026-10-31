/**
 * Combines conditional class names and resolves conflicting Tailwind utilities for shared UI components.
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Merge conditional class names, then let tailwind-merge resolve competing utility classes.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
