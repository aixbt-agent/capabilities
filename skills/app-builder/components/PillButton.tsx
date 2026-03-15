import React from 'react'

interface PillButtonProps {
  label: string
  active?: boolean
  onClick?: () => void
  activeColor?: string
  activeBg?: string
  activeBorder?: string
  inactiveColor?: string
  inactiveBg?: string
  inactiveBorder?: string
  size?: 'sm' | 'default'
  style?: React.CSSProperties
}

export function PillButton({
  label, active = false, onClick,
  activeColor, activeBg, activeBorder,
  inactiveColor, inactiveBg, inactiveBorder,
  size = 'default', style,
}: PillButtonProps) {
  const isSmall = size === 'sm'
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? (activeBg ?? 'var(--c-dim)') : (inactiveBg ?? 'transparent'),
        border: `1px solid ${active ? (activeBorder ?? 'var(--c-secondary)') : (inactiveBorder ?? 'var(--c-dim)')}`,
        borderRadius: 9999,
        color: active ? (activeColor ?? 'var(--c-text)') : (inactiveColor ?? 'var(--c-secondary)'),
        fontFamily: 'var(--font-sans)',
        fontSize: isSmall ? 'var(--fs-xs)' : 'var(--fs-sm)',
        fontWeight: 500,
        padding: isSmall ? '3px 10px' : '6px 12px',
        cursor: 'pointer',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        transition: 'all 150ms ease-out',
        minHeight: isSmall ? undefined : 36,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {label}
    </button>
  )
}
