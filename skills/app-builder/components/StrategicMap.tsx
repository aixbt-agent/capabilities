import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ComposableMap, Geographies, Geography, Graticule, Line, Marker, Sphere } from 'react-simple-maps'

export interface StrategicMapLocation {
  id: string
  lat: number
  lng: number
  label: string
  color?: string
  radius?: number
}

export interface StrategicMapRoutePoint {
  lat: number
  lng: number
}

export interface StrategicMapRoute {
  id?: string
  points: StrategicMapRoutePoint[]
  color?: string
  strokeWidth?: number
  strokeDasharray?: string
}

interface StrategicMapProps {
  locations: StrategicMapLocation[]
  routes?: StrategicMapRoute[]
  geographyUrl?: string
  selectedId?: string | null
  onSelect?: (id: string) => void
  onClearSelection?: () => void
  center?: [number, number]
  zoom?: number
  selectedZoom?: number
  background?: string
  landFill?: string
  landStroke?: string
  graticuleStroke?: string
  markerSize?: number
  selectedTooltip?: React.ReactNode
}

const DEFAULT_GEOGRAPHY_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
const SVG_WIDTH = 1000
const SVG_HEIGHT = 560
const BASE_SCALE = 170
const MIN_ZOOM = 1.2
const MAX_LAT = 80
const RAD_TO_DEG = 180 / Math.PI
const DEG_TO_RAD = Math.PI / 180
const TOOLTIP_WIDTH = 280
const TOOLTIP_HEIGHT = 280
const INTERACTIVE_TARGET_SELECTOR = '[data-strategic-map-interactive="true"]'

function clampZoom(zoom: number) {
  return Math.max(MIN_ZOOM, zoom)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function clampLatitude(lat: number) {
  return Math.min(MAX_LAT, Math.max(-MAX_LAT, lat))
}

function wrapLongitude(lng: number) {
  const wrapped = ((lng + 180) % 360 + 360) % 360 - 180
  return wrapped === -180 ? 180 : wrapped
}

function mercatorY(lat: number) {
  const radians = clampLatitude(lat) * DEG_TO_RAD
  return Math.log(Math.tan(Math.PI / 4 + radians / 2))
}

function inverseMercatorY(value: number) {
  return clampLatitude((2 * Math.atan(Math.exp(value)) - Math.PI / 2) * RAD_TO_DEG)
}

function panCenter(center: [number, number], dx: number, dy: number, zoom: number): [number, number] {
  const scale = BASE_SCALE * zoom
  const nextLng = wrapLongitude(center[0] - (dx / scale) * RAD_TO_DEG)
  const nextLat = inverseMercatorY(mercatorY(center[1]) + dy / scale)
  return [nextLng, nextLat]
}

function longitudeDelta(lng: number, centerLng: number) {
  return ((lng - centerLng + 540) % 360) - 180
}

function projectLocation(location: Pick<StrategicMapLocation, 'lng' | 'lat'>, center: [number, number], zoom: number) {
  const scale = BASE_SCALE * zoom
  return {
    x: SVG_WIDTH / 2 + longitudeDelta(location.lng, center[0]) * DEG_TO_RAD * scale,
    y: SVG_HEIGHT / 2 + (mercatorY(center[1]) - mercatorY(location.lat)) * scale,
  }
}

function svgToScreen(
  svgX: number, svgY: number,
  containerWidth: number, containerHeight: number,
) {
  const { scale, offsetX, offsetY } = getSvgFitMetrics(containerWidth, containerHeight)
  return { x: offsetX + svgX * scale, y: offsetY + svgY * scale }
}

function getSvgFitMetrics(containerWidth: number, containerHeight: number) {
  const svgAspect = SVG_WIDTH / SVG_HEIGHT
  const containerAspect = containerWidth / containerHeight
  let scale: number, offsetX: number, offsetY: number
  if (containerAspect > svgAspect) {
    scale = containerHeight / SVG_HEIGHT
    offsetX = (containerWidth - SVG_WIDTH * scale) / 2
    offsetY = 0
  } else {
    scale = containerWidth / SVG_WIDTH
    offsetX = 0
    offsetY = (containerHeight - SVG_HEIGHT * scale) / 2
  }
  return { scale, offsetX, offsetY }
}

function startedOnInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof Node)) return false
  const element = target instanceof Element ? target : target.parentElement
  return element?.closest(INTERACTIVE_TARGET_SELECTOR) != null
}

export function StrategicMap({
  locations,
  routes = [],
  geographyUrl = DEFAULT_GEOGRAPHY_URL,
  selectedId = null,
  onSelect,
  onClearSelection,
  center = [44, 22],
  zoom = 1.8,
  selectedZoom = 2.4,
  background = '#000',
  landFill = '#16181C',
  landStroke = 'rgba(29,155,240,0.10)',
  graticuleStroke = 'rgba(255,255,255,0.04)',
  markerSize = 1,
  selectedTooltip,
}: StrategicMapProps) {
  const selectedLocation = useMemo(
    () => locations.find(location => location.id === selectedId) ?? null,
    [locations, selectedId]
  )

  const targetCenter = useMemo<[number, number]>(
    () => selectedLocation ? [selectedLocation.lng, selectedLocation.lat] : [center[0], center[1]],
    [selectedLocation?.id, selectedLocation?.lng, selectedLocation?.lat, center[0], center[1]]
  )
  const targetZoom = clampZoom(selectedLocation ? selectedZoom : zoom)
  const [viewportCenter, setViewportCenter] = useState<[number, number]>(targetCenter)
  const [viewportZoom, setViewportZoom] = useState(targetZoom)
  const [dragging, setDragging] = useState(false)
  const viewportRef = useRef({ center: targetCenter, zoom: targetZoom })
  const dragRef = useRef<{ x: number; y: number; center: [number, number]; zoom: number } | null>(null)
  const touchRef = useRef<{
    startDistance: number
    startZoom: number
    center: [number, number]
    midpoint: { x: number; y: number }
  } | null>(null)
  const suppressClickRef = useRef(false)
  const touchMovedRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const [tooltipHeight, setTooltipHeight] = useState(TOOLTIP_HEIGHT)

  useEffect(() => {
    viewportRef.current = { center: viewportCenter, zoom: viewportZoom }
  }, [viewportCenter, viewportZoom])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      setContainerSize({ width, height })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useLayoutEffect(() => {
    if (!selectedLocation || !selectedTooltip) {
      setTooltipHeight(TOOLTIP_HEIGHT)
      return
    }

    const el = tooltipRef.current
    if (!el) return

    const updateTooltipHeight = (height: number) => {
      setTooltipHeight(height > 0 ? height : TOOLTIP_HEIGHT)
    }

    updateTooltipHeight(el.getBoundingClientRect().height)

    const observer = new ResizeObserver(entries => {
      updateTooltipHeight(entries[0].contentRect.height)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [selectedLocation?.id, selectedTooltip])

  const projectionScale = BASE_SCALE * viewportZoom
  const tooltipPoint = selectedLocation ? projectLocation(selectedLocation, viewportCenter, viewportZoom) : null

  const TOOLTIP_OFFSET = 12
  const SCREEN_PADDING = 8
  const svgFitScale = containerSize.width > 0
    ? getSvgFitMetrics(containerSize.width, containerSize.height).scale
    : 1
  const markerViewportScale = svgFitScale > 0 ? 1 / Math.min(1, svgFitScale) : 1
  const screenPoint = tooltipPoint && containerSize.width > 0
    ? svgToScreen(tooltipPoint.x, tooltipPoint.y, containerSize.width, containerSize.height)
    : null
  const screenTooltipX = screenPoint
    ? screenPoint.x + TOOLTIP_OFFSET + TOOLTIP_WIDTH <= containerSize.width - SCREEN_PADDING
      ? screenPoint.x + TOOLTIP_OFFSET
      : screenPoint.x - TOOLTIP_OFFSET - TOOLTIP_WIDTH >= SCREEN_PADDING
        ? screenPoint.x - TOOLTIP_WIDTH - TOOLTIP_OFFSET
        : clamp(
            screenPoint.x - TOOLTIP_WIDTH / 2,
            SCREEN_PADDING,
            Math.max(SCREEN_PADDING, containerSize.width - TOOLTIP_WIDTH - SCREEN_PADDING),
          )
    : 0
  const screenTooltipY = screenPoint
    ? screenPoint.y - tooltipHeight - TOOLTIP_OFFSET >= SCREEN_PADDING
      ? screenPoint.y - tooltipHeight - TOOLTIP_OFFSET
      : screenPoint.y + TOOLTIP_OFFSET + tooltipHeight <= containerSize.height - SCREEN_PADDING
        ? screenPoint.y + TOOLTIP_OFFSET
        : clamp(
            screenPoint.y - tooltipHeight / 2,
            SCREEN_PADDING,
            Math.max(SCREEN_PADDING, containerSize.height - tooltipHeight - SCREEN_PADDING),
          )
    : 0

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    event.preventDefault()
    suppressClickRef.current = true
    const nextZoom = clampZoom(viewportRef.current.zoom * Math.exp(-event.deltaY * 0.0015))
    viewportRef.current = { ...viewportRef.current, zoom: nextZoom }
    setViewportZoom(nextZoom)
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'touch') return
    if (startedOnInteractiveTarget(event.target)) return
    suppressClickRef.current = false
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      center: viewportRef.current.center,
      zoom: viewportRef.current.zoom,
    }
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current || event.pointerType === 'touch') return
    const dx = event.clientX - dragRef.current.x
    const dy = event.clientY - dragRef.current.y
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) suppressClickRef.current = true
    const nextCenter = panCenter(dragRef.current.center, dx, dy, dragRef.current.zoom)
    viewportRef.current = { ...viewportRef.current, center: nextCenter }
    setViewportCenter(nextCenter)
  }

  function endPointerDrag(event?: React.PointerEvent<HTMLDivElement>) {
    if (event && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    dragRef.current = null
    setDragging(false)
  }

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    touchMovedRef.current = false
    if (startedOnInteractiveTarget(event.target)) return

    if (event.touches.length === 1) {
      const touch = event.touches[0]
      dragRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        center: viewportRef.current.center,
        zoom: viewportRef.current.zoom,
      }
      touchRef.current = null
      return
    }

    if (event.touches.length === 2) {
      const [a, b] = [event.touches[0], event.touches[1]]
      dragRef.current = null
      touchRef.current = {
        startDistance: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
        startZoom: viewportRef.current.zoom,
        center: viewportRef.current.center,
        midpoint: { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 },
      }
      suppressClickRef.current = true
    }
  }

  function handleTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    if (event.touches.length === 1 && dragRef.current) {
      event.preventDefault()
      const touch = event.touches[0]
      const dx = touch.clientX - dragRef.current.x
      const dy = touch.clientY - dragRef.current.y
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        suppressClickRef.current = true
        touchMovedRef.current = true
      }
      const nextCenter = panCenter(dragRef.current.center, dx, dy, dragRef.current.zoom)
      viewportRef.current = { ...viewportRef.current, center: nextCenter }
      setViewportCenter(nextCenter)
      return
    }

    if (event.touches.length === 2 && touchRef.current) {
      event.preventDefault()
      const [a, b] = [event.touches[0], event.touches[1]]
      const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
      const ratio = distance / touchRef.current.startDistance
      const nextZoom = clampZoom(touchRef.current.startZoom * ratio)
      const midpoint = { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 }
      const dx = midpoint.x - touchRef.current.midpoint.x
      const dy = midpoint.y - touchRef.current.midpoint.y
      const nextCenter = panCenter(touchRef.current.center, dx, dy, touchRef.current.startZoom)
      viewportRef.current = { center: nextCenter, zoom: nextZoom }
      setViewportCenter(nextCenter)
      setViewportZoom(nextZoom)
      suppressClickRef.current = true
    }
  }

  function handleTouchEnd() {
    if (touchMovedRef.current || touchRef.current) suppressClickRef.current = true
    dragRef.current = null
    touchRef.current = null
  }

  return (
    <div
      ref={containerRef}
      onClick={() => {
        if (suppressClickRef.current) {
          suppressClickRef.current = false
          return
        }
        onClearSelection?.()
      }}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endPointerDrag}
      onPointerCancel={endPointerDrag}
      onPointerLeave={event => {
        if (!dragRef.current) return
        endPointerDrag(event)
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background,
        overflow: 'hidden',
        cursor: dragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      <ComposableMap
        width={SVG_WIDTH}
        height={SVG_HEIGHT}
        projection="geoMercator"
        projectionConfig={{ center: viewportCenter, scale: projectionScale }}
        style={{ width: '100%', height: '100%' }}
      >
        <Sphere fill="#040506" stroke="rgba(255,255,255,0.06)" strokeWidth={0.7} />
        <Graticule stroke={graticuleStroke} strokeWidth={0.5} step={[15, 15]} />

        <Geographies geography={geographyUrl}>
          {({ geographies }) =>
            geographies.map(geo => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill={landFill}
                stroke={landStroke}
                strokeWidth={0.35}
                style={{
                  default: { outline: 'none' },
                  hover: { outline: 'none' },
                  pressed: { outline: 'none' },
                }}
              />
            ))
          }
        </Geographies>

        {routes.map((route, index) => (
          <Line
            key={route.id ?? index}
            coordinates={route.points.map(point => [point.lng, point.lat])}
            stroke={route.color ?? 'rgba(29,155,240,0.22)'}
            strokeWidth={route.strokeWidth ?? 1}
            strokeDasharray={route.strokeDasharray}
            strokeLinecap="round"
            fill="none"
          />
        ))}

        {locations.map(location => {
          const color = location.color ?? 'var(--c-accent)'
          const isSelected = selectedId === location.id
          const isFaded = selectedId !== null && !isSelected
          const scale = markerSize * markerViewportScale * (isSelected ? 1.35 : 1)

          return (
            <Marker key={location.id} coordinates={[location.lng, location.lat]}>
              <g
                data-strategic-map-interactive="true"
                cursor="pointer"
                opacity={isFaded ? 0.24 : 1}
                onClick={event => {
                  event.stopPropagation()
                  onSelect?.(location.id)
                }}
              >
                <g transform={`scale(${scale})`}>
                  <circle r={18} fill="transparent" />
                  {location.radius ? (
                    <circle
                      r={location.radius}
                      fill={color}
                      opacity={isSelected ? 0.1 : 0.04}
                      stroke={color}
                      strokeWidth={0.7}
                    />
                  ) : null}
                  {isSelected && (
                    <circle r={8} fill={color} opacity={0.15} />
                  )}
                  <circle
                    r={isSelected ? 6 : 5}
                    fill={color}
                    stroke="rgba(0,0,0,0.6)"
                    strokeWidth={0.8}
                  />
                </g>
              </g>
            </Marker>
          )
        })}

      </ComposableMap>

      {selectedLocation && selectedTooltip && tooltipPoint && containerSize.width > 0 && (
        <div
          ref={tooltipRef}
          data-strategic-map-interactive="true"
          style={{
            position: 'absolute',
            left: screenTooltipX,
            top: screenTooltipY,
            width: TOOLTIP_WIDTH,
            maxHeight: TOOLTIP_HEIGHT,
            pointerEvents: 'auto',
            zIndex: 1,
          }}
          onClick={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
        >
          {selectedTooltip}
        </div>
      )}
    </div>
  )
}
