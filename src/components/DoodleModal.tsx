import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function DoodleModal({ open, onClose, title, children }: Props) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-ink/50" />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'doodle-modal-title' : undefined}
            initial={{ y: 40, rotate: -1.2, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, rotate: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, rotate: -1.2, opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            className="doodle-border doodle-shadow bg-paper relative w-full max-w-2xl max-h-[90vh] md:max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-4 px-5 md:px-8 pt-5 pb-3 border-b-2 border-dashed border-ink/30">
              {title ? (
                <h2 id="doodle-modal-title" className="mb-0">
                  {title}
                </h2>
              ) : (
                <span />
              )}
              <button
                ref={closeButtonRef}
                onClick={onClose}
                aria-label="Close"
                className="doodle-border-alt bg-paper hover:bg-paper-dark px-3 py-1 text-2xl leading-none shrink-0 transition-colors"
              >
                ✕
              </button>
            </header>

            <div className="overflow-y-auto px-5 md:px-8 py-5 flex-1">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
