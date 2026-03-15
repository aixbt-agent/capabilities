import React from 'react'

interface BadgeProps {
  text: string
  color?: string
}

export function Badge({ text, color = 'var(--c-secondary)' }: BadgeProps) {
  return (
    <span style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--fs-xs)',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      color,
      background: `color-mix(in srgb, ${color} 12%, transparent)`,
      padding: '3px 10px',
      borderRadius: 9999,
      whiteSpace: 'nowrap',
    }}>
      {text}
    </span>
  )
}
