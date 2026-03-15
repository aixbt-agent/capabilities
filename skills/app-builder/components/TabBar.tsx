import React from 'react'

interface TabBarProps {
  tabs: { id: string; label: string }[]
  activeTab: string
  onTabChange: (id: string) => void
}

export function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  return (
    <nav style={{
      background: '#000',
      borderBottom: '1px solid var(--c-dim)',
      display: 'flex',
      height: 48,
      flexShrink: 0,
    }}>
      {tabs.map(t => {
        const active = activeTab === t.id
        return (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            style={{
              flex: 1,
              position: 'relative',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--fs-lg)',
              fontWeight: active ? 600 : 400,
              color: active ? 'var(--c-text)' : 'var(--c-muted)',
              padding: 0,
              transition: 'color 150ms ease-out',
            }}
          >
            {t.label}
            {active && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 56,
                height: 4,
                borderRadius: 9999,
                background: 'var(--c-blue)',
              }} />
            )}
          </button>
        )
      })}
    </nav>
  )
}
