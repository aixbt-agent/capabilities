import React, { useId } from 'react'
import { useIsMobile } from './hooks/useIsMobile'

interface PillBarProps {
  children: React.ReactNode
  className?: string
}

export function PillBar({ children, className }: PillBarProps) {
  const isMobile = useIsMobile()
  const id = useId()
  const scrollId = `pillbar-${id.replace(/:/g, '')}`

  return (
    <>
      {isMobile && (
        <style>{`#${scrollId}::-webkit-scrollbar { display: none; }`}</style>
      )}
      <div
        id={scrollId}
        className={className}
        onTouchStart={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
        style={{
          display: 'flex',
          gap: 6,
          position: 'relative',
          ...(isMobile
            ? { flexWrap: 'nowrap', overflowX: 'auto', scrollbarWidth: 'none', touchAction: 'pan-x', WebkitOverflowScrolling: 'touch' as any }
            : { flexWrap: 'wrap' }),
        }}
      >
        {children}
        {isMobile && (
          <div style={{
            position: 'sticky',
            right: 0,
            top: 0,
            flexShrink: 0,
            width: 32,
            alignSelf: 'stretch',
            background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.6))',
            pointerEvents: 'none',
            marginLeft: -32,
          }} />
        )}
      </div>
    </>
  )
}
