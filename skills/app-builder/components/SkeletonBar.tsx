import React from 'react'

interface SkeletonBarProps {
  width?: string | number
  height?: number
  style?: React.CSSProperties
}

export function SkeletonBar({ width = '100%', height = 14, style }: SkeletonBarProps) {
  return (
    <div style={{
      height,
      width,
      borderRadius: 4,
      background: 'var(--c-dim)',
      animation: 'skeleton-pulse 1.2s ease-in-out infinite',
      ...style,
    }} />
  )
}
