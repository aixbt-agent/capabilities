import React from 'react'

interface TagProps {
  text: string
  color?: string
}

export function Tag({ text, color = 'var(--c-secondary)' }: TagProps) {
  return <span style={{ color, fontSize: 'var(--fs-xs)' }}>[{text.toUpperCase()}]</span>
}
