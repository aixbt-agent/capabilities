import React, { useState } from 'react'

interface AccordionItem {
  id: string
  header: React.ReactNode
  content: React.ReactNode
}

interface AccordionProps {
  items: AccordionItem[]
}

function ChevronSvg({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--c-secondary)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, transition: 'transform 150ms ease-out', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

export function Accordion({ items }: AccordionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div>
      {items.map((item, i) => {
        const isExpanded = expandedId === item.id
        return (
          <div
            key={item.id}
            style={{
              borderBottom: i < items.length - 1 ? '1px solid rgba(47,51,54,0.3)' : 'none',
            }}
          >
            <div
              onClick={() => setExpandedId(isExpanded ? null : item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 0',
                cursor: 'pointer',
                minHeight: 36,
              }}
            >
              <ChevronSvg expanded={isExpanded} />
              <div style={{ flex: 1, minWidth: 0 }}>{item.header}</div>
            </div>
            {isExpanded && (
              <div style={{ padding: '0 0 10px 22px' }}>
                {item.content}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
