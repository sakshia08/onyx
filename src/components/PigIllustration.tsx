import { useReduceMotion } from "@/lib/reduce-motion";
import { animate, motion, useMotionValue } from "motion/react";
import { useEffect, useId, useRef } from "react";
import { fillSpring } from "@/lib/motion";
import { cn } from "@/lib/cn";

/*
 * The pig (PRD §10.6). Hand-drawn line art in a 240 × 210 box:
 * oval body, one ear, snout with two nostrils, dot eye, blush, curly tail,
 * four stubby legs and a coin slot on its back. The body fills from the bottom
 * with a pink gradient up to `progress`, with a gentle wave on the surface.
 */

const BODY = { cx: 118, cy: 110, rx: 84, ry: 62 } as const;
const SNOUT = { cx: 203, cy: 114, rx: 13, ry: 18 } as const;
const FILL_TOP = BODY.cy - BODY.ry - 6; // just above the body, so 100% looks full
const FILL_BOTTOM = BODY.cy + BODY.ry + 4; // just below, so 0% looks empty
const GROUND_Y = 182;

/** A stubby leg: open at the top (hidden inside the body), rounded at the foot. */
function legPath(x: number, width = 17): string {
  const r = 7;
  const top = 140;
  return `M ${x} ${top} V ${GROUND_Y - r} Q ${x} ${GROUND_Y} ${x + r} ${GROUND_Y} H ${x + width - r} Q ${x + width} ${GROUND_Y} ${x + width} ${GROUND_Y - r} V ${top}`;
}

/** Quadratic-curve wave strip: crest line at y = 0, filled down to `depth`. */
function wavePath(amplitude: number, wavelength: number, width: number, depth: number): string {
  const half = wavelength / 2;
  let d = `M 0 0 Q ${wavelength / 4} ${-amplitude} ${half} 0`;
  for (let x = half; x < width; x += half) d += ` T ${x + half} 0`;
  return `${d} V ${depth} H 0 Z`;
}

function levelFor(progress: number): number {
  const p = Math.min(1, Math.max(0, progress));
  return FILL_BOTTOM - p * (FILL_BOTTOM - FILL_TOP);
}

interface PigIllustrationProps {
  /** How full the pig is, 0–1. */
  progress: number;
  /** Increment to drop a coin in: coin falls, pig squishes, fill springs up. */
  stashSignal?: number;
  /** Increment to make the pig wiggle (goal reached). */
  wiggleSignal?: number;
  /** Empty state: eyes closed, with "z z". */
  sleeping?: boolean;
  width?: number;
  className?: string;
}

export function PigIllustration({
  progress,
  stashSignal = 0,
  wiggleSignal = 0,
  sleeping = false,
  width = 240,
  className,
}: PigIllustrationProps) {
  const reduceMotion = useReduceMotion();
  const id = useId().replace(/:/g, "");
  const level = useMotionValue(levelFor(progress));
  const bodyRef = useRef<SVGGElement>(null);
  const coinRef = useRef<SVGGElement>(null);
  const lastStash = useRef(stashSignal);
  const lastWiggle = useRef(wiggleSignal);

  // Fill level: springs to the new value. After a stash it waits for the coin to land.
  useEffect(() => {
    const target = levelFor(progress);
    const stashed = stashSignal !== lastStash.current;
    lastStash.current = stashSignal;

    if (reduceMotion) {
      level.set(target);
      if (stashed && coinRef.current) {
        void animate(coinRef.current, { opacity: [0, 1, 0] }, { duration: 0.6 });
      }
      return;
    }

    const controls = [animate(level, target, { ...fillSpring, delay: stashed ? 0.42 : 0 })];
    if (stashed && coinRef.current && bodyRef.current) {
      controls.push(
        animate(
          coinRef.current,
          { y: [-64, 0, 6], opacity: [0, 1, 1, 0], scaleX: [1, 1, 0.3] },
          { duration: 0.48, ease: "easeIn", times: [0, 0.75, 1] },
        ),
        animate(
          bodyRef.current,
          { scaleX: [1, 1.04, 0.99, 1], scaleY: [1, 0.96, 1.01, 1] },
          { duration: 0.5, delay: 0.38, ease: "easeOut" },
        ),
      );
    }
    return () => {
      controls.forEach((c) => {
        c.stop();
      });
    };
  }, [progress, stashSignal, reduceMotion, level]);

  // Goal reached: a happy wiggle.
  useEffect(() => {
    if (wiggleSignal === lastWiggle.current) return;
    lastWiggle.current = wiggleSignal;
    if (reduceMotion || !bodyRef.current) return;
    const controls = animate(
      bodyRef.current,
      { rotate: [0, -7, 6, -4, 3, 0] },
      { duration: 0.75, ease: "easeInOut" },
    );
    return () => {
      controls.stop();
    };
  }, [wiggleSignal, reduceMotion]);

  const percent = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  const stroke = "var(--piggy-strong)";
  const height = (width * 210) / 240;

  return (
    <svg
      viewBox="0 0 240 210"
      width={width}
      height={height}
      role="img"
      aria-label={sleeping ? "Sleeping piggy bank" : `Piggy bank, ${percent}% full`}
      className={cn("overflow-visible", className)}
    >
      <defs>
        <linearGradient
          id={`${id}-fill`}
          x1="0"
          y1={FILL_TOP}
          x2="0"
          y2={FILL_BOTTOM}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="var(--piggy)" />
          <stop offset="1" stopColor="var(--piggy-strong)" />
        </linearGradient>
        <clipPath id={`${id}-inside`}>
          <ellipse {...BODY} />
          <ellipse {...SNOUT} />
        </clipPath>
        <mask id={`${id}-outside-body`}>
          <rect x="-20" y="-20" width="280" height="250" fill="white" />
          <ellipse {...BODY} fill="black" />
        </mask>
        <mask id={`${id}-outside-snout`}>
          <rect x="-20" y="-20" width="280" height="250" fill="white" />
          <ellipse {...SNOUT} fill="black" />
        </mask>
        <filter id={`${id}-soft`} x="-50%" y="-200%" width="200%" height="500%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      {/* soft pink shadow on the ground */}
      <ellipse
        cx={BODY.cx + 8}
        cy={GROUND_Y + 4}
        rx="74"
        ry="6"
        fill={stroke}
        opacity="0.28"
        filter={`url(#${id}-soft)`}
      />

      <motion.g
        animate={reduceMotion ? { y: 0 } : { y: sleeping ? [0, -2, 0] : [0, -4, 0] }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: sleeping ? 4.2 : 3.6, repeat: Infinity, ease: "easeInOut" }
        }
      >
        <g ref={bodyRef} style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}>
          {/* legs: far pair lighter for depth, near pair in front */}
          <g
            mask={`url(#${id}-outside-body)`}
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          >
            <g opacity="0.5">
              <path d={legPath(90)} />
              <path d={legPath(154)} />
            </g>
            <path d={legPath(66)} />
            <path d={legPath(130)} />
          </g>

          {/* curly tail */}
          <path
            d="M 36 102 C 25 103 17 96 20 88 C 23 80 34 81 34 88 C 34 95 25 96 22 91"
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* body tint so the empty pig still reads as an object */}
          <ellipse {...BODY} fill="var(--piggy)" opacity="0.07" />

          {/* the liquid fill, clipped to body + snout */}
          <g clipPath={`url(#${id}-inside)`}>
            <motion.g style={{ y: level }}>
              <motion.path
                d={wavePath(4, 72, 240 + 72 * 2, 240)}
                fill="var(--piggy)"
                opacity="0.45"
                initial={{ x: -72 }}
                animate={reduceMotion ? { x: -72 } : { x: [-72, 0] }}
                transition={{ duration: 3.4, repeat: Infinity, ease: "linear" }}
                style={{ translateY: -3 }}
              />
              <motion.path
                d={wavePath(3.5, 56, 240 + 56 * 2, 240)}
                fill={`url(#${id}-fill)`}
                initial={{ x: 0 }}
                animate={reduceMotion ? { x: 0 } : { x: [0, -56] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }}
              />
            </motion.g>
          </g>

          {/* ear, rising out of the head */}
          <path
            d="M 144 62 C 140 46 148 31 160 29 C 170 27 176 36 176 48 C 176 57 178 65 182 72 Z"
            mask={`url(#${id}-outside-body)`}
            fill="var(--piggy)"
            fillOpacity="0.18"
            stroke={stroke}
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* body outline, open where the snout sits */}
          <ellipse
            {...BODY}
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            mask={`url(#${id}-outside-snout)`}
          />

          {/* snout and nostrils */}
          <ellipse
            {...SNOUT}
            fill="var(--piggy)"
            fillOpacity="0.14"
            stroke={stroke}
            strokeWidth="2"
          />
          <ellipse cx={SNOUT.cx - 4.5} cy={SNOUT.cy} rx="2.2" ry="3.6" fill={stroke} />
          <ellipse cx={SNOUT.cx + 4.5} cy={SNOUT.cy} rx="2.2" ry="3.6" fill={stroke} />

          {/* coin slot on the back */}
          <rect x="102" y="55" width="30" height="5" rx="2.5" fill={stroke} />

          {/* shine */}
          <path
            d="M 58 80 C 66 70 77 63 89 59"
            fill="none"
            stroke="var(--text-1)"
            strokeOpacity="0.35"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* eye */}
          {sleeping ? (
            <path
              d="M 166 91 Q 172 96.5 178 91"
              fill="none"
              stroke={stroke}
              strokeWidth="2"
              strokeLinecap="round"
            />
          ) : (
            <g>
              <circle cx="172" cy="90" r="5.2" fill={stroke} />
              <circle cx="173.9" cy="88.1" r="1.7" fill="var(--text-1)" />
            </g>
          )}

          {/* blush */}
          <ellipse cx="178" cy="112" rx="8" ry="5" fill="var(--piggy-strong)" opacity="0.4" />
        </g>
      </motion.g>

      {/* the coin, waiting above the slot */}
      <g ref={coinRef} opacity="0" style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}>
        <circle
          cx="117"
          cy="40"
          r="11"
          fill="var(--bucket-amber)"
          stroke="var(--warning)"
          strokeWidth="2"
        />
        <circle
          cx="117"
          cy="40"
          r="6.5"
          fill="none"
          stroke="var(--bg)"
          strokeOpacity="0.25"
          strokeWidth="1.5"
        />
        <text
          x="117"
          y="44.2"
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          fill="var(--bg)"
          fillOpacity="0.55"
          fontFamily="var(--font-ui)"
        >
          ₹
        </text>
      </g>

      {/* z z */}
      {sleeping && (
        <g fill="var(--piggy)" fontFamily="var(--font-round)" fontWeight="600">
          {[
            { x: 186, y: 54, size: 15, delay: 0 },
            { x: 202, y: 36, size: 19, delay: 1.1 },
          ].map((z) => (
            <motion.text
              key={z.x}
              x={z.x}
              y={z.y}
              fontSize={z.size}
              initial={{ opacity: reduceMotion ? 0.8 : 0 }}
              animate={reduceMotion ? { opacity: 0.8 } : { opacity: [0, 0.9, 0], y: [0, -10] }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 2.6, repeat: Infinity, delay: z.delay, ease: "easeOut" }
              }
            >
              z
            </motion.text>
          ))}
        </g>
      )}
    </svg>
  );
}
