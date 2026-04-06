/**
 * Unit tests for ErrorBoundary component logic.
 *
 * These tests exercise the class component's state machine and lifecycle
 * directly — no DOM / jsdom required (runs in Node via Vitest).
 *
 * To run:
 *   npx vitest run tests/unit/error-boundary.test.ts
 *
 * Note: Full render tests (children render / fallback render) require
 * jsdom + @testing-library/react. Install with:
 *   npm i -D @testing-library/react @testing-library/jest-dom jsdom
 * and update vitest.config.ts → environment: 'jsdom'.
 *
 * The tests below cover all non-render logic that can be verified in Node.
 */

import { describe, it, expect, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Minimal React shim — just enough for the class to instantiate without DOM.
// We do NOT import from 'react' here because vitest's node env has no jsdom.
// Instead we exercise the pure logic: state transitions, getDerivedStateFromError,
// and the onError callback wiring.
// ---------------------------------------------------------------------------

// Pull in only the static method and the constructor logic we want to test.
// We mock React.Component minimally so the class can be instantiated.
vi.mock('react', () => {
  class Component {
    props: Record<string, unknown>
    state: Record<string, unknown> = {}
    constructor(props: Record<string, unknown>) {
      this.props = props
    }
    setState(updater: Record<string, unknown> | ((s: Record<string, unknown>) => Record<string, unknown>)) {
      if (typeof updater === 'function') {
        this.state = { ...this.state, ...updater(this.state) }
      } else {
        this.state = { ...this.state, ...updater }
      }
    }
  }

  return {
    default: { Component },
    Component,
    createElement: () => null,
  }
})

// Now import after the mock is set up
import { ErrorBoundary } from '@/components/ui/error-boundary'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ErrorBoundary', () => {
  describe('getDerivedStateFromError (static)', () => {
    it('returns hasError: true and captures the error', () => {
      const err = new Error('boom')
      const nextState = ErrorBoundary.getDerivedStateFromError(err)
      expect(nextState.hasError).toBe(true)
      expect(nextState.error).toBe(err)
    })

    it('works with any error value', () => {
      const err = new TypeError('type error')
      const nextState = ErrorBoundary.getDerivedStateFromError(err)
      expect(nextState.hasError).toBe(true)
      expect(nextState.error).toBe(err)
    })
  })

  describe('initial state', () => {
    it('starts with hasError: false and no error', () => {
      const boundary = new ErrorBoundary({ children: null })
      expect(boundary.state.hasError).toBe(false)
      expect(boundary.state.error).toBeNull()
    })
  })

  describe('componentDidCatch', () => {
    it('calls the onError prop callback with error and info', () => {
      const onError = vi.fn()
      const boundary = new ErrorBoundary({ children: null, onError })

      const err = new Error('render failed')
      const info = { componentStack: '\n    at SomeComponent' } as React.ErrorInfo

      boundary.componentDidCatch(err, info)

      expect(onError).toHaveBeenCalledOnce()
      expect(onError).toHaveBeenCalledWith(err, info)
    })

    it('does not throw when no onError prop is provided', () => {
      const boundary = new ErrorBoundary({ children: null })
      const err = new Error('render failed')
      const info = { componentStack: '' } as React.ErrorInfo

      expect(() => boundary.componentDidCatch(err, info)).not.toThrow()
    })

    it('logs the error to console.error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const boundary = new ErrorBoundary({ children: null })
      const err = new Error('something broke')
      const info = { componentStack: '\n    at Foo' } as React.ErrorInfo

      boundary.componentDidCatch(err, info)

      expect(consoleSpy).toHaveBeenCalledWith(
        '[ErrorBoundary] Caught error:',
        err,
        info.componentStack,
      )

      consoleSpy.mockRestore()
    })
  })

  describe('full error lifecycle simulation', () => {
    it('transitions from no-error to error state correctly', () => {
      const boundary = new ErrorBoundary({ children: null })

      // Initial — no error
      expect(boundary.state.hasError).toBe(false)

      // Simulate React calling getDerivedStateFromError during render
      const err = new Error('child threw')
      const nextState = ErrorBoundary.getDerivedStateFromError(err)

      // Apply state (simulates React's setState)
      boundary.state = { ...boundary.state, ...nextState }

      expect(boundary.state.hasError).toBe(true)
      expect(boundary.state.error).toBe(err)
    })
  })
})
