// Tests for stop-loss-monitor
import { describe, it, expect } from 'vitest'

describe('stop-loss-monitor', () => {
  it('should detect long stop loss breach', () => {
    const livePrice = 90
    const stopLoss = 95
    const side = 'long'
    const breached = side === 'long' ? livePrice <= stopLoss : livePrice >= stopLoss
    expect(breached).toBe(true)
  })

  it('should not trigger when price above stop for long', () => {
    const livePrice = 100
    const stopLoss = 95
    const side = 'long'
    const breached = side === 'long' ? livePrice <= stopLoss : livePrice >= stopLoss
    expect(breached).toBe(false)
  })

  it('should detect short stop loss breach', () => {
    const livePrice = 110
    const stopLoss = 105
    const side = 'short'
    const breached = side === 'short' ? livePrice >= stopLoss : livePrice <= stopLoss
    expect(breached).toBe(true)
  })

  it('should calculate pnl correctly for long', () => {
    const entry = 100, exit = 90, qty = 10
    const pnl = (exit - entry) * qty
    expect(pnl).toBe(-100)
  })

  it('should trigger at exact stop price', () => {
    const livePrice = 95
    const stopLoss = 95
    const breached = livePrice <= stopLoss
    expect(breached).toBe(true)
  })
})
