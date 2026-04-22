import { Fragment, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { RoughAnnotationType } from 'rough-notation/lib/model'
import { DoodleButton } from '../DoodleButton'
import { DoodleModal } from '../DoodleModal'
import { Rough } from '../Rough'
import { Stamp } from '../Stamp'

type HighlightKind = RoughAnnotationType | 'bold'

type Highlight = {
  phrase: string
  type: HighlightKind
  color: string
}

type Clause = {
  title: string
  body?: string
  bodyHighlights?: Highlight[]
  intro?: string
  introHighlights?: Highlight[]
  items?: string[]
  itemsHighlights?: (Highlight[] | undefined)[]
  note?: string
}

const urlPattern = /(https?:\/\/[^\s]+?)([.,;:!?)]*)(?=\s|$)/g

function linkify(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  urlPattern.lastIndex = 0
  while ((match = urlPattern.exec(text)) !== null) {
    const [, url, trailing] = match
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }
    nodes.push(
      <a
        key={`${match.index}-${url}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent underline decoration-dashed underline-offset-4 break-all hover:decoration-solid"
      >
        {url}
      </a>,
    )
    if (trailing) nodes.push(trailing)
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))

  return nodes
}

/**
 * Splits `text` on every highlight phrase (in order), wrapping matches with
 * <Rough /> for hand-drawn annotation and running plain text through linkify.
 * Highlight phrases must appear in the same order they're listed in.
 */
function renderAnnotated(
  text: string,
  highlights: Highlight[] | undefined,
  show: boolean,
  baseDelay: number,
): ReactNode[] {
  if (!highlights || highlights.length === 0) return linkify(text)

  type Segment = { text: string; highlight?: Highlight; highlightIndex?: number }
  let segments: Segment[] = [{ text }]
  highlights.forEach((h, hi) => {
    const next: Segment[] = []
    for (const seg of segments) {
      if (seg.highlight) {
        next.push(seg)
        continue
      }
      const idx = seg.text.indexOf(h.phrase)
      if (idx < 0) {
        next.push(seg)
        continue
      }
      const before = seg.text.slice(0, idx)
      const after = seg.text.slice(idx + h.phrase.length)
      if (before) next.push({ text: before })
      next.push({ text: h.phrase, highlight: h, highlightIndex: hi })
      if (after) next.push({ text: after })
    }
    segments = next
  })

  return segments.map((seg, i) => {
    if (seg.highlight) {
      // Bold is plain text emphasis — skips rough-notation entirely so the
      // annotation geometry can't cross through letters.
      if (seg.highlight.type === 'bold') {
        return (
          <strong key={`b-${i}`} className="font-bold text-ink">
            {seg.text}
          </strong>
        )
      }
      return (
        <Rough
          key={`h-${i}`}
          type={seg.highlight.type}
          color={seg.highlight.color}
          show={show}
          delay={baseDelay + (seg.highlightIndex ?? 0) * 450}
        >
          {seg.text}
        </Rough>
      )
    }
    return (
      <Fragment key={`t-${i}`}>
        {linkify(seg.text).map((n, ni) => (
          <Fragment key={ni}>{n}</Fragment>
        ))}
      </Fragment>
    )
  })
}

const COLOR_RED = '#ff6b6b'
const COLOR_YELLOW = '#ffd93d'
const COLOR_INK = '#1a1a1a'

const placeholderClauses: Clause[] = [
  {
    title: 'Article I — Scope of Work',
    body:
      'I, Ryan Roethle (hereafter "The Superloser") shall walk one (1) dog (Poppy), feed said dog if circumstances demand it, greet and play with Poppy for at minimum 15 minutes. "The Superloser" will also look in on one (1) cat (Walt) with the dignity befitting a pet professional even though said cat does not care at all if I exist. I will provide at minimum two greetings and attempt one pet of Walt.  Additional chores TBD at the sole pleasure of the Superloser. I will arrive between 7:00 A.M. and 7:30 A.M. US Central Standard Time. Any other duties can be listed on a piece of paper which I will dedicate 2-7 minutes to read. Please provide "the Superloser" with access to one easily clippable dog leash as the complicated weird one that goes around the body is impossible to put by any normal intelligence human being. It would be nice to have access to bags to pick up droppings left by Poppy, but "The Superloser" can make due if needed.',
    bodyHighlights: [
      { phrase: '15 minutes', type: 'underline', color: COLOR_RED },
    ],
  },
  {
    title: 'Article II — Compensation',
    body:
      'Compensation shall be zero (0) United States dollars. Pet Owners (Justin and Emily Roethle) hereby waive any and all attempts to pay, tip, Venmo, PayPal or otherwise compensate the Superloser via Gift Cards or other sneaky forms of payment. If any payment of any kind is recieved, consider this a violation of the agreement and review that section for more details.',
    bodyHighlights: [
      { phrase: 'zero (0) United States dollars', type: 'underline', color: COLOR_RED },
      { phrase: 'violation of the agreement', type: 'box', color: COLOR_INK },
    ],
  },
  {
    title: 'Article III — Liability',
    body:
      'The Superloser accepts no liability for anything. House burns down. Not my fault. Poppy runs away while on the walk? Whoops. Still not my fault. We all know Walt is a mastermind and the brains behind this pet duo, so any and all blame shifts to him. I will grant one stipulation. If, for any reason, a house-elf, gremlin, or penguin appear in the house and destory any property, I am obligated to film it and upload the footage. I am not responsible for replacing said damaged property though',
    bodyHighlights: [
      { phrase: 'no liability for anything', type: 'highlight', color: COLOR_YELLOW },
      { phrase: 'Walt is a mastermind', type: 'underline', color: COLOR_RED },
    ],
  },
  {
    title: 'Article IV — Violations of Agreement',
    intro:
      'By the simple fact of opening and reading this contract, both parties (Ryan Roethle, Justin Roethle, & Emily Roethle) are bound by law to these terms. In the event, that one party (Justin Roethle or Emily Roethle) does violate this the consequences will be two fold and go into effect immediately.',
    introHighlights: [
      { phrase: 'bound by law', type: 'bold', color: COLOR_INK },
    ],
    items: [
      'You will both be added to my Donezo List. What does this mean? Well, you do not want to find out. For more reference, please watch this video: https://www.youtube.com/watch?v=acLp0S3K6mk.',
      'I will steal Poppy from you and she will live with me. You know what will happen if I have to take care of a dog full time. I do not want it to come to this but your violation demands grave consequences.',
    ],
    itemsHighlights: [
      [{ phrase: 'Donezo List', type: 'highlight', color: COLOR_YELLOW }],
      [{ phrase: 'steal Poppy', type: 'underline', color: COLOR_RED }],
    ],
    note: 'Note: To future law enforcement people reading this, ignore this threat.',
  },
]

export function ContractSection() {
  const [open, setOpen] = useState(false)
  const [showHighlights, setShowHighlights] = useState(false)
  const [prevOpen, setPrevOpen] = useState(open)

  // Reset the reveal flag immediately when the modal closes so the next open
  // replays the draw animation. React's canonical "derive from props" pattern
  // — a setState during render (inside a branch) avoids the extra effect.
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (!open) setShowHighlights(false)
  }

  // Kick off the annotation draw a beat after the modal finishes animating
  // in — too early and the SVGs are drawn off-position.
  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => setShowHighlights(true), 650)
    return () => window.clearTimeout(t)
  }, [open])

  return (
    <section id="contract" className="max-w-5xl mx-auto px-4 py-12">
      <h2 className="text-center mb-2">The Contract</h2>
      <p className="text-center text-ink-soft text-lg mb-8">
        Drafted in crayon. Binding in spirit.
      </p>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="doodle-border doodle-shadow bg-paper hover:bg-paper-dark transition-transform active:translate-x-[3px] active:translate-y-[3px] active:shadow-none px-8 py-7 md:px-12 md:py-8 text-center rotate-[-1deg] hover:rotate-0"
        >
          <p className="text-5xl md:text-6xl mb-2" aria-hidden="true">📜</p>
          <p className="font-display text-3xl md:text-4xl leading-tight">
            Read the Contract
          </p>
          <p className="text-ink-soft mt-1">tap to unfurl</p>
        </button>
      </div>

      <DoodleModal
        open={open}
        onClose={() => setOpen(false)}
        title="The Contract"
      >
        <div className="space-y-10 relative">
          <div className="absolute -top-2 right-0 md:right-2 pointer-events-none z-10">
            <Stamp
              rotate={-10}
              opacity={0.45}
              delay={0.35}
              className="text-accent text-2xl md:text-3xl"
            >
              Certified Copy
            </Stamp>
          </div>
          {placeholderClauses.map((clause, clauseIdx) => {
            const baseDelay = clauseIdx * 200
            return (
              <article
                key={clause.title}
                className="max-w-prose pb-8 border-b-2 border-dashed border-ink/20 last-of-type:border-0 last-of-type:pb-0"
              >
                <h3 className="mb-3">{clause.title}</h3>
                {clause.body && (
                  <p className="leading-relaxed">
                    {renderAnnotated(
                      clause.body,
                      clause.bodyHighlights,
                      showHighlights,
                      baseDelay,
                    )}
                  </p>
                )}
                {clause.intro && (
                  <p className="leading-relaxed mb-4">
                    {renderAnnotated(
                      clause.intro,
                      clause.introHighlights,
                      showHighlights,
                      baseDelay,
                    )}
                  </p>
                )}
                {clause.items && (
                  <ul className="list-disc pl-6 space-y-3 leading-relaxed">
                    {clause.items.map((item, itemIdx) => (
                      <li key={item}>
                        {renderAnnotated(
                          item,
                          clause.itemsHighlights?.[itemIdx],
                          showHighlights,
                          baseDelay + 200 + itemIdx * 200,
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {clause.note && (
                  <p className="text-ink-soft text-sm mt-4 italic">{linkify(clause.note)}</p>
                )}
              </article>
            )
          })}

          <div className="pt-6 border-t-2 border-dashed border-ink/40 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-ink-soft">Signed,</p>
              <p className="font-display text-accent text-5xl leading-none">
                Ryan, Justin, & Emily
              </p>
            </div>
            <p className="text-ink-soft">Dated: 4/23/2026</p>
          </div>

          <div className="flex justify-end pt-2">
            <DoodleButton variant="secondary" onClick={() => setOpen(false)}>
              I agree (Even though I don't have a choice)
            </DoodleButton>
          </div>
        </div>
      </DoodleModal>
    </section>
  )
}
