# AIXBT Design Guide

X-native design system for apps deployed to `*.aixbt.sh`. These apps are embedded in the X (Twitter) mobile app and must feel native to that context.

---

## 1. Philosophy

- **True black.** `#000` background, not near-black. Matches X dark mode.
- **Flat.** No shadows, no gradients, no depth illusions.
- **Dense.** Pack information tight. Every pixel earns its place.
- **Monochrome + one accent.** Default to grays. Use color only for status and data.
- **No decoration.** No left borders, no colored section backgrounds, no decorative fonts.

---

## 2. Color System

| Token | Value | Usage |
|---|---|---|
| `--c-bg` | `#000` | Page background (true black) |
| `--c-surface` | `#16181C` | Cards, panels, elevated containers |
| `--c-dim` | `#2F3336` | Borders, dividers, subtle backgrounds |
| `--c-text` | `#E7E9EA` | Primary text |
| `--c-secondary` | `#71767B` | Secondary text, labels |
| `--c-muted` | `#536471` | Tertiary text, timestamps, table headers |
| `--c-accent` | `#fff` | Emphasis, active states |
| `--c-green` | `#00BA7C` | Positive values, success |
| `--c-red` | `#F4212E` | Negative values, errors |
| `--c-yellow` | `#F5A623` | Warnings, neutral signals |
| `--c-blue` | `#1D9BF0` | Links, X-branded accent |
| `--c-purple` | `#7856FF` | AI/agent-related UI |

**Rules:**
- Status colors (`green`, `red`, `yellow`) are for data only, never for decoration.
- Use `--c-blue` sparingly. It is the X brand color, use it for links and primary actions.
- When a component needs a tinted background, use the color at 12% opacity (e.g., `rgba(0, 186, 124, 0.12)` for green).
- **Common mistake: rainbow sections.** When a list has multiple items, do NOT assign each item a different color. Use `--c-secondary` for all icons and labels in the list. Color in lists is decoration, not data.

---

## 3. Typography

**Fonts:**
- **DM Sans** — body text, labels, UI elements
- **JetBrains Mono** — data values, code, numbers, addresses

**Size hierarchy:**

| Token | Size | Usage |
|---|---|---|
| `--fs-xs` | 12px | Table headers, timestamps |
| `--fs-sm` | 14px | Secondary text, tags |
| `--fs-base` | 15px | Body text |
| `--fs-md` | 16px | Emphasized body |
| `--fs-lg` | 17px | Section headers |
| `--fs-xl` | 20px | Stat values, page titles |
| `--fs-2xl` | 22px | Hero numbers |

**Rules:**
- Minimum font size is 12px. Nothing smaller.
- Data and numbers always use `--font-mono`.
- Labels and UI text always use `--font-sans`.
- Use `letter-spacing: -0.02em` on large mono numbers for tighter feel.

---

## 4. Layout

- **Mobile-first.** Design for ~500px viewport width (X webview).
- **Top nav = TabBar.** The TabBar component IS the top navigation. It sits at the very top of the viewport. Never add a separate header, logo bar, title bar, or branding strip above it.
- **No floating nav.** Use a consistent top bar across all viewports.
- **No horizontal scroll.** Content must fit the viewport width.
- **Panels stack vertically.** Single-column layout for most apps.
- **Touch targets.** Minimum 36px height for all interactive elements.
- **Content container.** Non-full-bleed content uses `maxWidth: 900` centered with responsive padding (`16px 12px` on mobile, `24px 32px` on desktop).

---

## 5. Icons

Use **Lucide React** (`lucide-react`) as the standard icon library. No other icon libraries, no emoji, no unicode symbols.

```tsx
import { TrendingUp, AlertTriangle, Shield } from 'lucide-react'

<TrendingUp size={16} color={C.green} />
```

**Rules:**
- Default size is `16`. Use `14` for inline-with-text, `18`-`20` for standalone.
- Color with `C.*` tokens, never hardcode hex in icon props.
- `strokeWidth={1.5}` (Lucide default) for standard UI. Use `2` for emphasis.
- No filled icon variants. Lucide's stroke style matches the flat, minimal aesthetic.
- Install per-app: add `lucide-react` to the app's `package.json`.
- Icons in a list or sequence should all use the same color (`C.secondary`). Do not assign each icon a different color.

---

## 6. Component Patterns

### const C boilerplate

Every app defines a `const C` object for inline styles. Map to CSS variables:

```tsx
const C = {
  bg: 'var(--c-bg)',
  surface: 'var(--c-surface)',
  dim: 'var(--c-dim)',
  text: 'var(--c-text)',
  secondary: 'var(--c-secondary)',
  muted: 'var(--c-muted)',
  accent: 'var(--c-accent)',
  green: 'var(--c-green)',
  red: 'var(--c-red)',
  yellow: 'var(--c-yellow)',
  blue: 'var(--c-blue)',
  purple: 'var(--c-purple)',
}
```

### Panel wrapper

```tsx
<div style={{
  background: C.surface,
  border: `1px solid ${C.dim}`,
  borderRadius: 8,
  padding: '12px 14px',
}}>
  {children}
</div>
```

### Tags / Badges

**Badge** (pill with tinted background, for status labels):
```tsx
import { Badge } from '@aixbt-agent/components'

<Badge text="OPEN" color={C.green} />
<Badge text="NOTE" />  {/* defaults to --c-secondary */}
```

**Tag** (bracket-wrapped inline label):
```tsx
<Tag text="HIGH" color={C.red} />  {/* renders [HIGH] */}
```

**Inline value badge** (for data like percentages):
```tsx
<span style={{
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 8px',
  fontSize: 12,
  fontFamily: 'var(--font-mono)',
  color: C.green,
  background: 'rgba(0, 186, 124, 0.12)',
  borderRadius: 4,
}}>
  +12.4%
</span>
```

### Filter chips

```tsx
<button style={{
  padding: '6px 12px',
  fontSize: 13,
  color: active ? C.text : C.secondary,
  background: active ? C.dim : 'transparent',
  border: `1px solid ${active ? C.secondary : C.dim}`,
  borderRadius: 9999,
  cursor: 'pointer',
  minHeight: 36,
  transition: 'all 150ms ease-out',
}}>
  {label}
</button>
```

### Data table

```tsx
<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
  <thead>
    <tr>
      <th style={{
        textAlign: 'left',
        padding: '6px 8px',
        fontSize: 12,
        color: C.muted,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        borderBottom: `1px solid ${C.dim}`,
      }}>
        Name
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style={{
        padding: '6px 8px',
        color: C.text,
        borderBottom: `1px solid rgba(47, 51, 54, 0.5)`,
      }}>
        Value
      </td>
    </tr>
  </tbody>
</table>
```

### Skeleton loading

Use animated pulse placeholders to indicate loading state. Skeletons should mirror the layout of the content they replace.

```tsx
// Keyframe (inject once via <style> tag or CSS file)
// @keyframes skeleton-pulse { 0%,100% { opacity: 0.4 } 50% { opacity: 0.8 } }

// Skeleton bar — reusable placeholder element
<div style={{
  height: 14,
  width: '60%',
  borderRadius: 4,
  background: C.dim,
  animation: 'skeleton-pulse 1.2s ease-in-out infinite',
}} />

// Example: skeleton card with title + two lines
<div style={{
  background: C.surface,
  border: `1px solid ${C.dim}`,
  borderRadius: 8,
  padding: '12px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}}>
  <div style={{ height: 14, width: '40%', borderRadius: 4, background: C.dim, animation: 'skeleton-pulse 1.2s ease-in-out infinite' }} />
  <div style={{ height: 12, width: '90%', borderRadius: 4, background: C.dim, animation: 'skeleton-pulse 1.2s ease-in-out infinite' }} />
  <div style={{ height: 12, width: '70%', borderRadius: 4, background: C.dim, animation: 'skeleton-pulse 1.2s ease-in-out infinite' }} />
</div>
```

**Rules:**
- Use `--c-dim` (`#2F3336`) as the skeleton bar color.
- Animation: opacity pulse (`0.4` → `0.8`), `1.2s ease-in-out infinite`.
- Match the dimensions and spacing of the real content as closely as possible.
- No bounce, no spring — flat mechanical pulse only.

### Stat display

```tsx
<div>
  <div style={{
    fontFamily: 'var(--font-mono)',
    fontSize: 18,
    fontWeight: 600,
    color: C.text,
    letterSpacing: '-0.02em',
  }}>
    $1,234,567
  </div>
  <div style={{
    fontSize: 12,
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }}>
    Total Volume
  </div>
</div>
```

### Tab bar

X-native tab navigation. 48px height, true black background, blue pill active indicator.

```tsx
<nav style={{
  background: '#000',
  borderBottom: `1px solid ${C.dim}`,
  display: 'flex',
  height: 48,
  flexShrink: 0,
}}>
  {tabs.map(t => {
    const active = activeTab === t.id
    return (
      <button
        key={t.id}
        onClick={() => setActiveTab(t.id)}
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
          color: active ? C.text : C.muted,
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
            background: C.blue,
          }} />
        )}
      </button>
    )
  })}
</nav>
```

### Slide-in panel

Right-anchored detail panel that slides in from the right edge. Use for supplementary content (actor details, item drill-down) that overlays the main view.

```tsx
<div style={{
  position: 'absolute',
  top: 0,
  right: 0,
  width: 360,
  maxWidth: '100%',
  height: '100%',
  background: C.surface,
  borderLeft: `1px solid ${C.dim}`,
  transform: open ? 'translateX(0)' : 'translateX(100%)',
  transition: 'transform 150ms ease-out',
  pointerEvents: open ? 'auto' : 'none',
  overflowY: 'auto',
  zIndex: 10,
}}>
  {children}
</div>
```

### Accordion

Single-open expand/collapse list. Shows compact header rows with chevron indicators. Only one item open at a time. 36px min touch targets on header rows. Dividers between items with `rgba(47,51,54,0.3)`.

```tsx
import { Accordion } from '@aixbt-agent/components'

<Accordion items={[
  {
    id: 'item-1',
    header: <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Section Title</span>,
    content: <div style={{ fontSize: 12, color: C.secondary }}>Expanded content here.</div>,
  },
  // ...more items
]} />
```

**Rules:**
- Use for information-dense sections where showing all content at once creates a wall of text.
- Header content is a ReactNode, so you can include icons alongside labels.
- Content is also a ReactNode. Keep it concise.
- Do not nest accordions inside accordions.

### Progressive disclosure

For information-dense pages, collapse detail content behind tappable rows. Show headlines at a glance; reveal details on tap. This keeps the page scannable without hiding information. Use `Accordion` for generic lists and the vertical stepper pattern for sequential processes.

### Vertical stepper

Rail with dots for sequential multi-phase processes. Borrows the rail pattern from `Timeline`: a 24px-wide column with a vertical connecting line (`C.dim`, 1px) and phase dots (8px circles, `C.dim` when collapsed, 10px `C.secondary` when expanded). Phase name row is tappable (icon + mono label + chevron). Only one phase open at a time. Collapsed state shows just the phase names along the rail, giving a process-flow visual.

```tsx
<div style={{ display: 'flex' }}>
  {/* Rail */}
  <div style={{ width: 24, flexShrink: 0, position: 'relative' }}>
    <div style={{
      position: 'absolute', left: '50%', top: 0, bottom: 0,
      width: 1, background: C.dim, transform: 'translateX(-50%)',
    }} />
    <div style={{
      position: 'absolute', top: 14, left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 8, height: 8, borderRadius: '50%', background: C.dim,
    }} />
  </div>
  {/* Phase row */}
  <div style={{ flex: 1, padding: '8px 0', cursor: 'pointer', minHeight: 36 }}>
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>PHASE_NAME</span>
  </div>
</div>
```

### Timeline rail

Vertical timeline with date group headers, connecting line, and event dots. Used for chronological event feeds.

```tsx
{/* Date header */}
<div style={{ display: 'flex', alignItems: 'center' }}>
  <div style={{ width: 48 }} />
  <div style={{ width: 20, display: 'flex', justifyContent: 'center' }}>
    <div style={{ width: 10, height: 10, borderRadius: '50%', background: C.secondary }} />
  </div>
  <div style={{
    fontSize: 'var(--fs-xs)', fontWeight: 600, color: C.muted,
    textTransform: 'uppercase', letterSpacing: '0.05em', marginLeft: 10,
  }}>
    {date}
  </div>
</div>

{/* Event row */}
<div style={{ display: 'flex' }}>
  {/* Time column */}
  <div style={{ width: 48, textAlign: 'right', paddingTop: 8 }}>
    <span style={{ color: C.muted, fontSize: 'var(--fs-xs)' }}>{time}</span>
  </div>
  {/* Rail */}
  <div style={{ width: 20, position: 'relative' }}>
    <div style={{
      position: 'absolute', left: '50%', top: 0, bottom: 0,
      width: 1, background: C.dim, transform: 'translateX(-50%)',
    }} />
    <div style={{
      position: 'absolute', top: 16, left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 6, height: 6, borderRadius: '50%', background: C.dim,
    }} />
  </div>
  {/* Content */}
  <div style={{ flex: 1, padding: '5px 8px 10px 10px' }}>
    {headline}
  </div>
</div>
```

---

## 7. Animation

- **Transitions:** `150ms ease-out` for all interactive state changes.
- **No bounce, no spring, no elastic.** Flat and mechanical.
- **Hover/active only.** No entry animations, no loading spinners beyond simple opacity fade.
- **Reduce motion:** Respect `prefers-reduced-motion` — disable transitions when set.

---

## 8. Anti-Patterns

Do NOT use:
- Box shadows or drop shadows
- Gradients (linear, radial, or conic)
- Left borders as section indicators
- Colored section backgrounds (tinted panels are fine for tags only)
- Decorative fonts or font weights above 600
- Rounded corners above 8px (except pills at 9999px)
- Blur/glassmorphism effects
- Loading spinners or progress bars (use skeleton placeholders instead)
- Header bars, logo bars, or title bars above the TabBar
- Per-item color coding in lists. When rendering a list of items (phases, concepts, rules), do not assign each item a unique color. Use `--c-secondary` for all items. Color should convey status or data, not distinguish list members.

**Exception:** SVG-based data visualizations (globes, maps, charts) may use radial gradients, blur filters, and glow effects when they serve the visualization. These are scoped to the SVG element only — never apply them to standard UI chrome.

---

## 9. Font Loading

Add to every app's `index.html` in `<head>`:

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

Every app must also have a `public/favicon.svg`. Copy it from `src/dashboard/public/favicon.svg`.

---

## 10. Mobile Embedded Checklist

Every app must include:

- [ ] Viewport meta: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`
- [ ] No horizontal scroll at 375px viewport
- [ ] Touch targets >= 36px height
- [ ] TabBar is the first element at top of viewport, no header above it
- [ ] True black (`#000`) background — no near-black variants
- [ ] Font sizes >= 12px everywhere
- [ ] Tested in X app webview (or simulated at 500px width)
- [ ] Favicon: copy `public/favicon.svg` from dashboard and add `<link rel="icon">` to `index.html`

---

## 11. Import Pattern

New app repos import shared styles from the published package:

```tsx
// src/main.tsx
import '@aixbt-agent/components/tokens.css'
import '@aixbt-agent/components/components.css'  // optional, for .panel/.tag/.btn-pill etc.
```

---

## 12. Shared React Components

Reusable React components come from `@aixbt-agent/components`:

```tsx
import { Timeline, PillButton, Panel, TabBar, SkeletonBar } from '@aixbt-agent/components'
```

All shared components use CSS custom properties directly (e.g., `var(--c-text)`) rather than accepting a color object prop. Any app that loads `tokens.css` gets correct styling automatically.

Keep data hooks, fetch wrappers, and server helpers local to the app repo. `@aixbt-agent/components` stays UI-only.

**Never pass inline `style` overrides to shared components.** Use them as-is with their defined props. If a component doesn't fit a use case, update the component itself or add a variant prop. Shared components own their own styling; inline overrides defeat the purpose of a design system.

### Available components

**Primitives:**
- `SkeletonBar` - animated loading placeholder bar
- `Panel` - surface-colored container with border
- `Label` - uppercase muted section label
- `Tag` - bracketed status tag (e.g., `[HIGH]`)
- `Badge` - pill with tinted background for status/category labels (e.g., `OPEN`, `NOTE`)
- `PillButton` - rounded filter chip with active state
- `TabBar` - X-native 48px tab navigation
- `SlidePanel` - right-anchored slide-in detail panel
- `Accordion` - single-open expand/collapse list with chevron indicators

**Compositions:**
- `Timeline` - vertical timeline rail with date grouping, filter pills, and expand/collapse
- `PlaybookCard` - scenario card with probability badge, trades grid, and triggers
- `PriceTicker` - horizontal scrolling price display
