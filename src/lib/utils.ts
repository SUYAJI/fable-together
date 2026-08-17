/**
 * Utility functions for common operations
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges Tailwind CSS classes with proper conflict resolution
 * Combines clsx for conditional classes and tailwind-merge for deduplication
 * 
 * @param inputs - Class values (strings, objects, arrays, or conditionals)
 * @returns Merged class string with Tailwind conflicts resolved
 * 
 * @example
 * cn('px-4', 'px-2') // Returns 'px-2' (last one wins)
 * cn('text-red-500', { 'text-blue-500': isActive }) // Conditional classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
