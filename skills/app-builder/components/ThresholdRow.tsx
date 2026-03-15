import React from 'react'

interface ThresholdRowProps {
  label: string
  value: string
  color?: string
}

export const ThresholdRow: React.FC<ThresholdRowProps> = ({ label, value, color }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    borderBottom: '1px solid rgba(47,51,54,0.3)',
  }}>
    <span style={{ fontSize: 13, color: 'var(--c-secondary)' }}>{label}</span>
    <span style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 13,
      fontWeight: 600,
      color: color || 'var(--c-text)',
    }}>{value}</span>
  </div>
)
