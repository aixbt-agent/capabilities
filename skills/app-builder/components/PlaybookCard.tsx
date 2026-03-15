import React from 'react'

interface PlaybookCardProps {
  probability: string
  title: string
  description: string
  trades?: { direction: string; asset: string; price: string; changePct?: number }[]
  triggers?: string[]
}

function probColor(level: string): { color: string; bg: string } {
  const l = level?.toLowerCase()
  if (l === 'high') return { color: 'var(--c-red)', bg: 'rgba(244,33,46,0.12)' }
  if (l === 'elevated' || l === 'moderate') return { color: 'var(--c-yellow)', bg: 'rgba(245,166,35,0.12)' }
  return { color: 'var(--c-muted)', bg: 'var(--c-dim)' }
}

export function PlaybookCard({ probability, title, description, trades, triggers }: PlaybookCardProps) {
  const pc = probColor(probability)

  return (
    <div>
      <span style={{
        display: 'inline-block',
        fontSize: 'var(--fs-xs)',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: pc.color,
        background: pc.bg,
        padding: '2px 8px',
        borderRadius: 'var(--radius-sm)',
        marginBottom: 6,
      }}>
        {probability}
      </span>

      <div style={{ color: 'var(--c-text)', fontSize: 'var(--fs-md)', fontWeight: 600, marginBottom: 4 }}>
        {title}
      </div>

      <div style={{ color: 'var(--c-secondary)', fontSize: 'var(--fs-base)', lineHeight: 1.5, marginBottom: 12 }}>
        {description}
      </div>

      {trades && trades.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--c-muted)', marginBottom: 6 }}>
            Positioning
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: '4px 12px', alignItems: 'center', fontSize: 'var(--fs-sm)' }}>
            {trades.map((t, i) => {
              const isLong = t.direction?.toLowerCase() === 'long'
              return (
                <React.Fragment key={i}>
                  <span style={{ color: isLong ? 'var(--c-green)' : 'var(--c-red)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {isLong ? 'Long' : 'Short'}
                  </span>
                  <span style={{ color: 'var(--c-text)' }}>{t.asset}</span>
                  <span style={{ color: 'var(--c-secondary)', textAlign: 'right', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
                    {t.price}
                  </span>
                  <span style={{
                    textAlign: 'right',
                    whiteSpace: 'nowrap',
                    fontSize: 'var(--fs-xs)',
                    padding: '1px 5px',
                    borderRadius: 'var(--radius-sm)',
                    background: t.changePct != null ? (t.changePct >= 0 ? 'rgba(0,186,124,0.12)' : 'rgba(244,33,46,0.12)') : 'transparent',
                    color: t.changePct != null ? (t.changePct >= 0 ? 'var(--c-green)' : 'var(--c-red)') : 'var(--c-muted)',
                  }}>
                    {t.changePct != null ? `${t.changePct >= 0 ? '+' : ''}${t.changePct.toFixed(1)}%` : '--'}
                  </span>
                </React.Fragment>
              )
            })}
          </div>
        </div>
      )}

      {triggers && triggers.length > 0 && (
        <div style={{
          fontSize: 'var(--fs-sm)', color: 'var(--c-muted)', lineHeight: 1.5,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          <span style={{ color: 'var(--c-secondary)' }}>Watch for: </span>
          {triggers.join(' \u00b7 ')}
        </div>
      )}
    </div>
  )
}
