'use client'

/**
 * Scenario Mode Selector
 * Allows switching between conversational AI and traditional form-based scenario modeling
 */

import { useState } from 'react'
import { MessageSquare, FormInput } from 'lucide-react'
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
      <div className="flex items-center justify-center">
        <div className="inline-flex rounded-lg border-2 border-[var(--border)] bg-white p-1 shadow-sm">
          <button
            onClick={() => setMode('conversational')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-md font-semibold transition-all ${
              mode === 'conversational'
                ? 'bg-gradient-to-br from-[var(--secondary)] to-[#1a2332] text-white shadow-md'
                : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--highlight)]'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span>Conversational AI</span>
            <span className="px-2 py-0.5 text-xs bg-[var(--success)]/20 text-[var(--success)] rounded-full font-bold">
              NEW
            </span>
          </button>
          <button
            onClick={() => setMode('form')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-md font-semibold transition-all ${
              mode === 'form'
                ? 'bg-gradient-to-br from-[var(--secondary)] to-[#1a2332] text-white shadow-md'
                : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--highlight)]'
            }`}
          >
            <FormInput className="w-5 h-5" />
            <span>Traditional Form</span>
          </button>
        </div>
      </div>

      {/* Mode Description */}
      <div className="bg-[var(--highlight)] border border-[var(--accent)]/30 rounded-lg p-5 max-w-3xl mx-auto">
        {mode === 'conversational' ? (
          <div>
            <h3 className="font-display font-semibold text-[var(--secondary)] mb-2 text-lg">Conversational AI Mode</h3>
            <p className="text-sm text-[var(--ink)]">
              Describe your scenario in natural language. The AI will ask clarifying questions, suggest
              refinements, and help you explore multiple alternatives through conversation. Best for exploring
              complex scenarios or when you're not sure of exact parameters.
            </p>
          </div>
        ) : (
          <div>
            <h3 className="font-display font-semibold text-[var(--secondary)] mb-2 text-lg">Traditional Form Mode</h3>
            <p className="text-sm text-[var(--ink)]">
              Use structured forms to input specific scenario parameters. Choose from predefined scenario types
              (financial, headcount, customer) and enter exact values. Best when you know exactly what you want
              to model.
            </p>
          </div>
        )}
      </div>

      {/* Render Selected Mode */}
      <div className="mt-8">
        {mode === 'conversational' ? (
          <ConversationalScenario baseline={baseline} />
        ) : (
          <ScenarioForm baseline={baseline} />
        )}
      </div>
    </div>
  )
}
