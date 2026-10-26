/** The bucket palette (PRD §10.2). One color per bucket. */
export const BUCKET_COLORS = [
  "violet",
  "blue",
  "teal",
  "green",
  "amber",
  "orange",
  "rose",
  "slate",
] as const;

export type BucketColor = (typeof BUCKET_COLORS)[number];
