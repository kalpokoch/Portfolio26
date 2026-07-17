export interface ParsedStat {
  value: string;
  label: string;
}

/**
 * Splits a tag like "0.71 F1" or "5.4M+ records" into a numeral + label pair for an
 * oversized-numeral editorial stat treatment. Returns null for non-numeric tags
 * (e.g. "quantized TinyLlama"), which should fall back to plain meta text instead.
 */
export function parseStat(tag: string): ParsedStat | null {
  const match = tag.match(/^([+\-<>~]?[\d.,]+[A-Za-z%]*[+\-]?)\s+(.+)$/);
  if (!match) return null;
  return { value: match[1], label: match[2] };
}
