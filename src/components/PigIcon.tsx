import type { SVGProps } from "react";

/** The small outline pig (PRD §10.6): Piggy tab icon and title accent. Matches lucide's style. */
export function PigIcon({ strokeWidth = 2, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {/* body, with a gap where the snout sits */}
      <path d="M20.4 10.6C19.6 7.9 16.6 6 12.6 6 7.6 6 4 8.9 4 12.6c0 2.2 1.2 4 3.1 5.1V20h2.6v-1.4c1 .3 1.9.4 2.9.4s2-.1 2.9-.4V20h2.6v-2.3c.9-.6 1.6-1.4 2-2.3" />
      {/* snout */}
      <rect x="19.2" y="10.4" width="2.8" height="5" rx="1.4" />
      {/* ear */}
      <path d="M14.6 6.5 16 3.6l1.9 3.6" />
      {/* coin slot */}
      <path d="M10.2 8.6h2.8" />
      {/* tail */}
      <path d="M4.2 11.6C2.6 11.6 2 10.2 2.9 9.5" />
      {/* eye */}
      <circle cx="16.4" cy="10.6" r="0.5" fill="currentColor" />
    </svg>
  );
}
