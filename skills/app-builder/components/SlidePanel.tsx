import React from 'react'

interface SlidePanelProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  width?: number
}

export function SlidePanel({ open, onClose, children, width = 360 }: SlidePanelProps) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width,
        maxWidth: '100%',
        height: '100%',
        background: 'var(--c-surface)',
        borderLeft: '1px solid var(--c-dim)',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--fs-base)',
        color: 'var(--c-text)',
        zIndex: 10,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 150ms ease-out',
        pointerEvents: open ? 'auto' : 'none',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
    </div>
  )
}
