import React, { useState } from 'react'
import { PillButton } from './PillButton'
import { SkeletonBar } from './SkeletonBar'

interface TimelineEvent {
  id: number | string
  time: string
  category?: string
  headline: string
  details?: string
  important?: boolean
}

interface TimelineProps {
  events: TimelineEvent[]
  categories?: string[]
  loading?: boolean
}

export function Timeline({ events, categories, loading }: TimelineProps) {
  const [filter, setFilter] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<number | string | null>(null)

  if (loading || events.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <SkeletonBar width={42} height={12} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <SkeletonBar width="80%" height={14} />
              <SkeletonBar width="50%" height={12} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const now = Date.now()
  const sorted = [...events]
    .filter(e => new Date(e.time).getTime() <= now)
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  const filtered = filter ? sorted.filter(e => e.category === filter) : sorted
  const cats = categories || [...new Set(events.map(e => e.category).filter(Boolean))]

  const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const grouped: Record<string, TimelineEvent[]> = {}
  filtered.forEach(e => {
    const d = new Date(e.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (!grouped[d]) grouped[d] = []
    grouped[d].push(e)
  })

  return (
    <div>
      {cats.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          <PillButton label="ALL" active={!filter} onClick={() => setFilter(null)} />
          {cats.map(c => (
            <PillButton
              key={c}
              label={c!}
              active={filter === c}
              onClick={() => setFilter(filter === c ? null : c!)}
            />
          ))}
        </div>
      )}

      {Object.entries(grouped).map(([date, groupEvents], gi, groupArr) => {
        const isToday = date === todayStr
        return (
        <div key={date}>
          {gi > 0 && (
            <div style={{ display: 'flex', height: 20 }}>
              <div style={{ width: 56, flexShrink: 0 }} />
              <div style={{ width: 28, flexShrink: 0, position: 'relative' }}>
                <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, background: 'var(--c-muted)', transform: 'translateX(-50%)' }} />
              </div>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <div style={{ width: 56, flexShrink: 0 }} />
            <div style={{ width: 28, flexShrink: 0, position: 'relative', alignSelf: 'stretch', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {gi > 0 && <div style={{
                position: 'absolute', left: '50%', top: 0, bottom: '50%',
                width: 2, background: 'var(--c-muted)', transform: 'translateX(-50%)',
              }} />}
              <div style={{
                position: 'absolute', left: '50%', top: '50%', bottom: 0,
                width: 2, background: 'var(--c-muted)', transform: 'translateX(-50%)',
              }} />
              <div style={{
                width: 16, height: 16, borderRadius: '50%', zIndex: 1,
                background: 'var(--c-muted)',
              }} />
            </div>
            <div style={{
              fontSize: 'var(--fs-xs)', fontWeight: 600,
              color: 'var(--c-muted)',
              textTransform: 'uppercase', letterSpacing: '0.05em', marginLeft: 10,
            }}>
              {date}
            </div>
          </div>
          <div style={{ display: 'flex', height: 10 }}>
            <div style={{ width: 56, flexShrink: 0 }} />
            <div style={{ width: 28, flexShrink: 0, position: 'relative' }}>
              <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, background: 'var(--c-muted)', transform: 'translateX(-50%)' }} />
            </div>
          </div>
          {groupEvents.map((e, ei) => {
            const isExpanded = expanded === e.id
            const h = new Date(e.time).getHours()
            const hour = h === 0 ? '12 am' : h < 12 ? `${h} am` : h === 12 ? '12 pm' : `${h - 12} pm`
            const prevH = ei > 0 ? new Date(groupEvents[ei - 1].time).getHours() : null
            const showHour = ei === 0 || h !== prevH
            const isLast = gi === groupArr.length - 1 && ei === groupEvents.length - 1
            return (
              <div
                key={e.id}
                onClick={() => setExpanded(isExpanded ? null : e.id)}
                style={{ display: 'flex', cursor: 'pointer', transition: '150ms ease-out' }}
              >
                <div style={{ width: 56, flexShrink: 0, textAlign: 'right', paddingRight: 0, paddingTop: 5 }}>
                  {showHour
                    ? <span style={{ color: e.important ? 'var(--c-text)' : 'var(--c-muted)', fontSize: 'var(--fs-base)', whiteSpace: 'nowrap' }}>{hour}</span>
                    : <span style={{ color: 'var(--c-dim)', fontSize: 'var(--fs-base)' }}>··</span>
                  }
                </div>
                <div style={{ width: 28, flexShrink: 0, position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: '50%', top: 0,
                    bottom: isLast ? 'auto' : 0,
                    height: isLast ? 16 : 'auto',
                    width: 2, background: 'var(--c-muted)',
                    transform: 'translateX(-50%)',
                  }} />
                  <div style={{
                    position: 'absolute', top: 16, left: '50%',
                    transform: `translate(-50%, -50%)${e.important ? ' rotate(45deg)' : ''}`,
                    width: e.important ? 12 : 10, height: e.important ? 12 : 10,
                    borderRadius: e.important ? 2 : '50%',
                    background: e.important ? 'var(--c-text)' : 'var(--c-muted)',
                  }} />
                </div>
                <div style={{
                  flex: 1, minWidth: 0, padding: '5px 8px 18px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'transparent',
                }}>
                  <div style={{ fontSize: 'var(--fs-base)', color: e.important ? 'var(--c-text)' : 'var(--c-muted)', lineHeight: 1.5 }}>
                    {e.headline}
                  </div>
                  {isExpanded && e.details && (
                    <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--c-secondary)', lineHeight: 1.5, marginTop: 4, paddingBottom: 2 }}>
                      {e.details}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        )
      })}
    </div>
  )
}
