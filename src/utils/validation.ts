/**
 * Maximum price value allowed for display (client-side validation cap).
 * Prices above this are shown as this value to avoid misleading UI.
 */
export const MAX_PRICE_DISPLAY = 100_000;

/**
 * Clamps a numeric price for display: no negatives, cap at MAX_PRICE_DISPLAY.
 * Use for current_price and other USD price displays only (not for 24h % change).
 */
export function clampPriceForDisplay(value: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > MAX_PRICE_DISPLAY) return MAX_PRICE_DISPLAY;
  return value;
}

/**
 * Formats a price for display with validation (no negative, max MAX_PRICE_DISPLAY).
 */
export function formatPriceForDisplay(value: number, options?: Intl.NumberFormatOptions): string {
  const clamped = clampPriceForDisplay(value);
  return clamped.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  });
}
