import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import './Dialog.css'

export default function Dialog({ title, children, onClose, busy }: { title: string; children: ReactNode; onClose: () => void; busy: boolean }) {
  const titleId = useId()
  const panel = useRef<HTMLDivElement>(null)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel.current?.focus()
    return () => { document.body.style.overflow = previousOverflow; trigger?.focus() }
  }, [])
  return <div className="action-backdrop"><div className="action-dialog" ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-busy={busy} onKeyDown={event => {
    if (event.key === 'Escape') { event.stopPropagation(); if (!busy) close.current() }
    if (event.key !== 'Tab') return
    const nodes = Array.from(panel.current!.querySelectorAll<HTMLElement>('button, input, textarea, select, a[href], summary, [tabindex]'))
      .filter(node => !node.hasAttribute('disabled') && node.tabIndex >= 0 && !node.closest('[hidden]'))
      .filter(node => {
        const details = node.closest('details')
        return !details || details.open || (node.tagName === 'SUMMARY' && node.parentElement === details)
      })
    event.preventDefault()
    if (!nodes.length) return
    const index = nodes.indexOf(document.activeElement as HTMLElement)
    const next = index < 0 ? (event.shiftKey ? nodes.length - 1 : 0) : (index + (event.shiftKey ? -1 : 1) + nodes.length) % nodes.length
    nodes[next].focus()
  }}><div className="actions-toolbar"><h2 id={titleId}>{title}</h2><button type="button" onClick={onClose} disabled={busy} style={{ marginLeft: 'auto' }}>Close</button></div>{children}</div></div>
}
