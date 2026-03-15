import React from 'react'

interface LabelProps {
  text: string
}

export const Label: React.FC<LabelProps> = ({ text }) => (
  <div style={{
    fontSize: 'var(--fs-xs)',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--c-muted)',
    marginBottom: 6,
    marginTop: 10,
  }}>
    {text}
  </div>
)
