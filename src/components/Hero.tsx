type Props = {
  isAdmin: boolean
}

export function Hero({ isAdmin }: Props) {
  return (
    <section
      id="top"
      className="max-w-5xl mx-auto px-4 pt-12 pb-10 md:pt-20 md:pb-16 text-center"
    >
      <p className="font-display text-accent text-3xl md:text-4xl -rotate-2 mb-2">
        A very official, very legally-binding…
      </p>
      <h1 className="mb-4">Superloser Tracker</h1>
      <p className="text-xl md:text-2xl max-w-2xl mx-auto">
        Live updates from Thursday morning's pet-sitting operation. Watch icons
        scoot around. Read a contract nobody asked for. Leave rude comments.
      </p>
      {isAdmin ? (
        <p className="font-display text-accent-3 text-3xl mt-6 rotate-1 inline-block doodle-border doodle-shadow-sm bg-paper px-4 py-1">
          admin mode: engaged
        </p>
      ) : null}
    </section>
  )
}
