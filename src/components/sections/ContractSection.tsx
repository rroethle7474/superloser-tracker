import { Fragment, useState } from 'react'
import { DoodleButton } from '../DoodleButton'
import { DoodleModal } from '../DoodleModal'

type Clause = {
  title: string
  body?: string
  intro?: string
  items?: string[]
  note?: string
}

const urlPattern = /(https?:\/\/[^\s]+?)([.,;:!?)]*)(?=\s|$)/g

function linkify(text: string) {
  const nodes: React.ReactNode[] = []
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

  return nodes.map((node, i) => <Fragment key={i}>{node}</Fragment>)
}

const placeholderClauses: Clause[] = [
  {
    title: 'Article I — Scope of Work',
    body:
      'I, Ryan Roethle (hereafter "The Superloser") shall walk one (1) dog (Poppy), feed said dog if circumstances demand it, greet and play with Poppy for at minimum 15 minutes. "The Superloser" will also look in on one (1) cat (Walt) with the dignity befitting a pet professional even though said cat does not care at all if I exist. I will provide at minimum two greetings and attempt one pet of Walt.  Additional chores TBD at the sole pleasure of the Superloser. I will arrive between 7:00 A.M. and 7:30 A.M. US Central Standard Time. Any other duties can be listed on a piece of paper which I will dedicate 2-7 minutes to read. Please provide "the Superloser" with access to one easily clippable dog leash as the complicated weird one that goes around the body is impossible to put by any normal intelligence human being. It would be nice to have access to bags to pick up droppings left by Poppy, but "The Superloser" can make due if needed.',
  },
  {
    title: 'Article II — Compensation',
    body:
      'Compensation shall be zero (0) United States dollars. Pet Owners (Justin and Emily Roethle) hereby waive any and all attempts to pay, tip, Venmo, PayPal or otherwise compensate the Superloser via Gift Cards or other sneaky forms of payment. If any payment of any kind is recieved, consider this a violation of the agreement and review that section for more details.',
  },
  {
    title: 'Article III — Liability',
    body:
      'The Superloser accepts no liability for anything. House burns down. Not my fault. Poppy runs away while on the walk? Whoops. Still not my fault. We all know Walt is a mastermind and the brains behind this pet duo, so any and all blame shifts to him. I will grant one stipulation. If, for any reason, a house-elf, gremlin, or penguin appear in the house and destory any property, I am obligated to film it and upload the footage. I am not responsible for replacing said damaged property though',
  },
  {
    title: 'Article IV — Violations of Agreement',
    intro:
      'By the simple fact of opening and reading this contract, both parties (Ryan Roethle, Justin Roethle, & Emily Roethle) are bound by law to these terms. In the event, that one party (Justin Roethle or Emily Roethle) does violate this the consequences will be two fold and go into effect immediately.',
    items: [
      'You will both be added to my Donezo List. What does this mean? Well, you do not want to find out. For more reference, please watch this video: https://www.youtube.com/watch?v=acLp0S3K6mk.',
      'I will steal Poppy from you and she will live with me. You know what will happen if I have to take care of a dog full time. I do not want it to come to this but your violation demands grave consequences.',
    ],
    note: 'Note: To future law enforcement people reading this, ignore this threat.',
  },
]

export function ContractSection() {
  const [open, setOpen] = useState(false)

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
        <div className="space-y-10">
          {placeholderClauses.map((clause) => (
            <article
              key={clause.title}
              className="max-w-prose pb-8 border-b-2 border-dashed border-ink/20 last-of-type:border-0 last-of-type:pb-0"
            >
              <h3 className="mb-3">{clause.title}</h3>
              {clause.body && <p className="leading-relaxed">{linkify(clause.body)}</p>}
              {clause.intro && <p className="leading-relaxed mb-4">{linkify(clause.intro)}</p>}
              {clause.items && (
                <ul className="list-disc pl-6 space-y-3 leading-relaxed">
                  {clause.items.map((item) => (
                    <li key={item}>{linkify(item)}</li>
                  ))}
                </ul>
              )}
              {clause.note && (
                <p className="text-ink-soft text-sm mt-4 italic">{linkify(clause.note)}</p>
              )}
            </article>
          ))}

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
