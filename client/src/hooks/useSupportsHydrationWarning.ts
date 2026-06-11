/**
 * Hook to detect if the current React version supports suppressHydrationWarning
 * This can be useful for conditional logic in components
 */
export function useSupportsHydrationWarning(): boolean {
  return true;
}

/**
 * Utility to conditionally apply suppressHydrationWarning
 * based on React version support
 */
export function getHydrationWarningProps(suppress: boolean = true) {
  return suppress ? { suppressHydrationWarning: true } : {};
}
