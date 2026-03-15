import React from 'react'

interface TickerItem {
  symbol: string
  price: number
  changePct?: number
}

interface PriceTickerProps {
  items: TickerItem[]
}

function fmt(p: number): string {
  if (p >= 1000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (p >= 1) return p.toFixed(2)
  return p.toFixed(4)
}

export function PriceTicker({ items }: PriceTickerProps) {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 'var(--fs-sm)' }}>
      {items.map(t => (
        <span key={t.symbol}>
          <span style={{ color: 'var(--c-muted)' }}>{t.symbol} </span>
          <span style={{ color: 'var(--c-blue)', fontFamily: 'var(--font-mono)' }}>${fmt(t.price)}</span>
        </span>
      ))}
    </div>
  )
}
