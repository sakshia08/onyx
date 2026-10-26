import type { CSSProperties } from "react";
import type { BucketColor } from "@/domain/bucket-colors";

/** The CSS variable for a bucket color, e.g. var(--bucket-teal). */
export function bucketColorVar(color: BucketColor): string {
  return `var(--bucket-${color})`;
}

/** A tinted background at the palette's tint strength (PRD §10.2: 14–18%). */
export function bucketTint(color: BucketColor): string {
  return `color-mix(in srgb, ${bucketColorVar(color)} var(--tint-alpha), transparent)`;
}

/** Sets --tone and --tone-tint so children can use them. */
export function toneStyle(color: BucketColor): CSSProperties {
  return { "--tone": bucketColorVar(color), "--tone-tint": bucketTint(color) } as CSSProperties;
}
