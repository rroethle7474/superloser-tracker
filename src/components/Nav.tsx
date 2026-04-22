const links = [
  { href: '#contract', label: 'The Contract' },
  { href: '#tracker', label: 'Live Tracker' },
  { href: '#video', label: 'Video' },
  { href: '#comments', label: 'Comments' },
]

export function Nav() {
  return (
    <nav className="sticky top-0 z-20 bg-paper/90 backdrop-blur border-b-[2.5px] border-ink">
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-3">
        <a href="#top" className="font-display text-3xl leading-none">
          Superloser Tracker
        </a>
        <ul className="flex flex-wrap gap-x-6 gap-y-1 text-lg">
          {links.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="scribble hover:text-accent">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
