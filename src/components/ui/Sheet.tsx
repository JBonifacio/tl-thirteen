import { ReactNode, useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { IconButton } from './IconButton'

interface Props {
  open: boolean
  onClose: () => void
  title: ReactNode
  subtitle?: ReactNode
  children: ReactNode
}

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * Bottom sheet on phones, centered dialog from the lg breakpoint (1024px).
 * Closes on Escape and backdrop click, traps focus, restores focus on close.
 */
export function Sheet({ open, onClose, title, subtitle, children }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const panel = panelRef.current
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE)
    ;(first ?? panel)?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab' || !panel) return
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (items.length === 0) return
      const firstItem = items[0]
      const lastItem = items[items.length - 1]
      if (e.shiftKey && document.activeElement === firstItem) {
        e.preventDefault()
        lastItem.focus()
      } else if (!e.shiftKey && document.activeElement === lastItem) {
        e.preventDefault()
        firstItem.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
      opener?.focus()
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center lg:p-6">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 dark:bg-black/70 sheet-fade"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="
          relative w-full lg:max-w-[420px] max-h-[90dvh] overflow-y-auto
          bg-surface text-ink font-sans rounded-t-3xl lg:rounded-2xl
          px-5 pt-2.5 pb-[max(28px,env(safe-area-inset-bottom))] lg:pt-5
          shadow-2xl shadow-shadow/20 outline-none sheet-in
        "
      >
        <div aria-hidden="true" className="lg:hidden mx-auto mb-4 w-9 h-1 rounded-full bg-card-line" />
        <div className="flex items-start gap-3 mb-5">
          <div className="flex flex-col gap-0.5 min-w-0">
            <h2 id={titleId} className="text-[22px] font-semibold tracking-tight leading-tight">
              {title}
            </h2>
            {subtitle && <div className="text-[13px] text-muted">{subtitle}</div>}
          </div>
          <IconButton icon="close" label="Close" filled onClick={onClose} className="ml-auto -mt-1" />
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
