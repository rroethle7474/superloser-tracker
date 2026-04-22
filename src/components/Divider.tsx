import type { CSSProperties } from 'react'

// A "walking trail" of pawprints — each paw is slightly rotated and staggered
// vertically so the row reads like footsteps, not a bullet list. The rotations
// are static (not random) so SSR and hydration stay consistent.
const PAW_STEPS: Array<{ rotate: number; translateY: number }> = [
  { rotate: -18, translateY: 10 },
  { rotate: 12, translateY: -4 },
  { rotate: -6, translateY: 6 },
  { rotate: 16, translateY: -2 },
  { rotate: -10, translateY: 8 },
]

function PawIcon({ style }: { style?: CSSProperties }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="shrink-0 w-6 h-6 md:w-7 md:h-7 text-ink/40"
      fill="currentColor"
      style={style}
    >
      <circle cx="12" cy="16" r="4" />
      <ellipse cx="6" cy="10" rx="1.8" ry="2.4" />
      <ellipse cx="10" cy="5" rx="1.7" ry="2.2" />
      <ellipse cx="14" cy="5" rx="1.7" ry="2.2" />
      <ellipse cx="18" cy="10" rx="1.8" ry="2.4" />
    </svg>
  )
}

export function Divider() {
  return (
    <div
      aria-hidden="true"
      role="presentation"
      className="flex justify-center items-center gap-5 md:gap-8 py-2 select-none"
    >
      {PAW_STEPS.map((step, i) => (
        <PawIcon
          key={i}
          style={{
            transform: `rotate(${step.rotate}deg) translateY(${step.translateY}px)`,
          }}
        />
      ))}
    </div>
  )
}
