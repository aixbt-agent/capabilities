import { useState } from 'react'
import { Badge, Label, Panel, TabBar } from '@aixbt-agent/components'

const C = {
  bg: 'var(--c-bg)',
  text: 'var(--c-text)',
  secondary: 'var(--c-secondary)',
}

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'notes', label: 'Notes' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'var(--font-sans)' }}>
      <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px', display: 'grid', gap: 12 }}>
        <Panel>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <Label text="app" />
              <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 600, marginTop: 6 }}>__APP_NAME__</div>
              <div style={{ fontSize: 'var(--fs-sm)', color: C.secondary, marginTop: 6 }}>__APP_DESCRIPTION__</div>
            </div>
            <Badge text="STATIC" />
          </div>
        </Panel>
        <Panel>
          <Label text={activeTab} />
          <p style={{ fontSize: 'var(--fs-base)', color: C.text, lineHeight: 1.6, marginTop: 10 }}>
            Replace this panel with real app content. Keep shared UI imports in `@aixbt-agent/components`
            and keep any data hooks local to this repo.
          </p>
        </Panel>
      </main>
    </div>
  )
}
