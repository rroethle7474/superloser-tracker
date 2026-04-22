import { useWalkStatus } from '../hooks/useWalkStatus'
import { Rough } from './Rough'

const UNDERLINE_COLOR = '#ff6b6b'

const links = [
  { href: '#contract', label: 'Contract' },
  { href: '#tracker', label: 'Tracker' },
  { href: '#video', label: 'Video' },
  { href: '#comments', label: 'Comments' },
]

export function Nav() {
  const isWalking = useWalkStatus()

  return (
    <nav className="safe-top sticky top-0 z-20 bg-paper/90 backdrop-blur border-b-[2.5px] border-ink">
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <a
          href="#top"
          className="font-display text-3xl leading-none flex items-center gap-3"
        >
          <span>Superloser Tracker</span>
          {isWalking && (
            <span
              className="live-pulse inline-flex items-center gap-1.5 bg-accent text-paper font-doodle text-sm px-2 py-0.5 rounded-full border-2 border-ink"
              aria-label="Walk in progress"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-paper" aria-hidden="true" />
              LIVE
            </span>
          )}
        </a>
        <ul
          className="
            relative flex items-center gap-x-4 md:gap-x-6 text-lg
            max-md:w-full max-md:flex-nowrap max-md:overflow-x-auto max-md:whitespace-nowrap max-md:no-scrollbar
            md:flex-wrap md:gap-y-1
          "
        >
          {links.map((link, i) => (
            <li key={link.href} className="relative shrink-0">
              <a
                href={link.href}
                className="text-ink hover:text-accent transition-colors"
              >
                <Rough
                  type="underline"
                  color={UNDERLINE_COLOR}
                  show={true}
                  delay={200 + i * 140}
                  strokeWidth={1.8}
                  padding={3}
                >
                  {link.label}
                </Rough>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
