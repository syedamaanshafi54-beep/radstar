
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number into the Indian numbering system (lakhs, crores) with exactly two decimal places.
 * @param price The number to format.
 * @returns A string representing the formatted price.
 * @example formatPrice(123456.7) => "1,23,456.70"
 */
export function formatPrice(price: number): string {
  return price.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
