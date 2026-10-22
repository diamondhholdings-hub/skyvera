'use client'

/**
 * Scenario Mode Selector
 * Switches between the guided (conversation) and form-based scenario modeling
 */

import { useState } from 'react'
import ConversationalScenario from './conversational-scenario'
import ScenarioForm from './scenario-form'
import type { BaselineMetrics } from '@/lib/data/server/scenario-data'

interface ScenarioModeSelectorProps {
  baseline: BaselineMetrics
}

type Mode = 'conversational' | 'form'

export default function ScenarioModeSelector({ baseline }: ScenarioModeSelectorProps) {
  const [mode, setMode] = useState<Mode>('conversational')

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex flex-col items-start gap-2">
        <div className="segmented" role="group" aria-label="Scenario input mode">
          <button type="button" aria-pressed={mode === 'conversational'} onClick={() => setMode('conversational')}>
            Guided
          </button>
          <button type="button" aria-pressed={mode === 'form'} onClick={() => setMode('form')}>
            Form
          </button>
        </div>
        <p className="m-0 text-sm" style={{ color: 'var(--muted)' }}>
          {mode === 'conversational'
            ? 'Describe a what-if and refine it step by step.'
            : 'Enter the parameters directly.'}
        </p>
      </div>

      {/* Render Selected Mode */}
      {mode === 'conversational' ? (
        <ConversationalScenario baseline={baseline} />
      ) : (
        <ScenarioForm baseline={baseline} />
      )}
    </div>
  )
}
