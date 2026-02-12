/**
 * Conversation Manager for conversational scenario system
 * Handles conversation state, message history, and scenario evolution
 */

import { Result, ok, err } from '@/lib/types/result'
import { getOrchestrator } from '@/lib/intelligence/claude/orchestrator'
import {
  buildConversationalScenarioSystemPrompt,
  buildInitialScenarioPrompt,
  buildContinuationPrompt,
  buildRefinementPrompt,
  buildComparisonPrompt,
  type ConversationContext,
  type ClarificationResponse,
  type ScenarioRefinementSuggestion,
} from '@/lib/intelligence/claude/prompts/conversational-scenario'
import { ScenarioCalculator } from './calculator'
import { analyzeScenarioWithClaude } from './analyzer'
import type { BaselineMetrics } from '@/lib/data/server/scenario-data'
import type { ScenarioInput } from './types'

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  messageType: 'query' | 'clarification' | 'refinement' | 'analysis' | 'confirmation'
  timestamp: Date
  metadata?: {
    tokensUsed?: number
    confidence?: string
    attachments?: any[]
  }
}

export interface ConversationState {
  conversationId: string
  title?: string
  status: 'active' | 'completed' | 'archived'
  currentScenario?: Partial<ScenarioInput>
  scenarioType?: string
  messages: ConversationMessage[]
  versions: ScenarioVersionData[]
  messageCount: number
  iterationCount: number
  createdAt: Date
  updatedAt: Date
  lastMessageAt: Date
}

export interface ScenarioVersionData {
  versionNumber: number
  scenarioData: any
  scenarioType: string
  calculatedMetrics: any[]
  claudeAnalysis?: any
  impactSummary?: string
  keyChanges?: string[]
  label?: string
  notes?: string
  createdAt: Date
}

export interface ConversationResponse {
  type: 'clarification' | 'analysis' | 'refinement' | 'comparison' | 'confirmation'
  message: string
  data?: any
  needsUserInput: boolean
  suggestedActions?: string[]
}

export class ScenarioConversationManager {
  private systemPrompt: string

  constructor() {
    this.systemPrompt = buildConversationalScenarioSystemPrompt()
  }

  /**
   * Start a new conversation
   */
  async startConversation(
    userQuery: string,
    baseline: BaselineMetrics
  ): Promise<Result<ConversationResponse>> {
    try {
      // Build initial prompt
      const prompt = buildInitialScenarioPrompt(userQuery, {
        'Total Revenue': baseline.totalRevenue,
        'Recurring Revenue': baseline.totalRR,
        'Non-Recurring Revenue': baseline.totalNRR,
        'EBITDA': baseline.ebitda,
        'Net Margin %': baseline.netMarginPct,
        'Net Margin Target %': baseline.netMarginTarget,
        'Headcount': baseline.headcount,
        'Headcount Cost': baseline.headcountCost,
        'Customer Count': baseline.customerCount,
      })

      // Call Claude
      const orchestrator = getOrchestrator()
      const response = await orchestrator.processRequest({
        prompt,
        systemPrompt: this.systemPrompt,
        priority: 'HIGH',
        maxTokens: 4096,
        temperature: 0.7,
      })

      if (!response.success) {
        return err(response.error)
      }

      // Parse response
      const parsed = JSON.parse(response.value.content)

      // Determine response type
      if (parsed.needsClarification) {
        return ok({
          type: 'clarification',
          message: this.formatClarificationMessage(parsed),
          data: parsed,
          needsUserInput: true,
          suggestedActions: parsed.questions,
        })
      } else {
        // Ready to analyze - run calculation
        const calculationResult = await this.runScenarioAnalysis(
          parsed.scenarioParameters,
          baseline
        )

        if (!calculationResult.success) {
          return err(calculationResult.error)
        }

        return ok({
          type: 'analysis',
          message: 'Analysis complete. Review the results below.',
          data: calculationResult.value,
          needsUserInput: false,
          suggestedActions: [
            'Refine scenario parameters',
            'Explore alternative scenarios',
            'Compare with different approach',
          ],
        })
      }
    } catch (error) {
      console.error('[startConversation] Error:', error)
      return err(
        error instanceof Error ? error : new Error('Failed to start conversation')
      )
    }
  }

  /**
   * Continue an existing conversation
   */
  async continueConversation(
    conversationState: ConversationState,
    userMessage: string,
    baseline: BaselineMetrics
  ): Promise<Result<ConversationResponse>> {
    try {
      // Build context
      const context: ConversationContext = {
        conversationId: conversationState.conversationId,
        previousMessages: conversationState.messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        currentScenario: conversationState.currentScenario
          ? {
              type: conversationState.scenarioType,
              description: conversationState.currentScenario.description,
              parameters: this.extractParameters(conversationState.currentScenario),
            }
          : undefined,
        baselineData: {
          'Total Revenue': baseline.totalRevenue,
          'Recurring Revenue': baseline.totalRR,
          'Non-Recurring Revenue': baseline.totalNRR,
          'EBITDA': baseline.ebitda,
          'Net Margin %': baseline.netMarginPct,
          'Headcount': baseline.headcount,
          'Customer Count': baseline.customerCount,
        },
        iterationCount: conversationState.iterationCount,
      }

      // Build continuation prompt
      const prompt = buildContinuationPrompt(context) + `\n\nUSER'S LATEST MESSAGE:\n"${userMessage}"`

      // Call Claude
      const orchestrator = getOrchestrator()
      const response = await orchestrator.processRequest({
        prompt,
        systemPrompt: this.systemPrompt,
        priority: 'HIGH',
        maxTokens: 4096,
        temperature: 0.7,
      })

      if (!response.success) {
        return err(response.error)
      }

      // Parse response
      const parsed = JSON.parse(response.value.content)

      // Determine response type and handle accordingly
      return await this.handleConversationResponse(
        parsed,
        conversationState,
        baseline
      )
    } catch (error) {
      console.error('[continueConversation] Error:', error)
      return err(
        error instanceof Error ? error : new Error('Failed to continue conversation')
      )
    }
  }

  /**
   * Refine a scenario based on current results
   */
  async refineScenario(
    currentScenario: any,
    currentResults: any,
    userFeedback?: string
  ): Promise<Result<ScenarioRefinementSuggestion>> {
    try {
      const prompt = buildRefinementPrompt(currentScenario, currentResults, userFeedback)

      const orchestrator = getOrchestrator()
      const response = await orchestrator.processRequest({
        prompt,
        systemPrompt: this.systemPrompt,
        priority: 'HIGH',
        maxTokens: 4096,
        temperature: 0.7,
      })

      if (!response.success) {
        return err(response.error)
      }

      const parsed = JSON.parse(response.value.content)
      return ok(parsed)
    } catch (error) {
      console.error('[refineScenario] Error:', error)
      return err(
        error instanceof Error ? error : new Error('Failed to refine scenario')
      )
    }
  }

  /**
   * Compare multiple scenario versions
   */
  async compareVersions(
    versions: ScenarioVersionData[]
  ): Promise<Result<any>> {
    try {
      const prompt = buildComparisonPrompt(versions)

      const orchestrator = getOrchestrator()
      const response = await orchestrator.processRequest({
        prompt,
        systemPrompt: this.systemPrompt,
        priority: 'HIGH',
        maxTokens: 4096,
        temperature: 0.7,
      })

      if (!response.success) {
        return err(response.error)
      }

      const parsed = JSON.parse(response.value.content)
      return ok(parsed)
    } catch (error) {
      console.error('[compareVersions] Error:', error)
      return err(
        error instanceof Error ? error : new Error('Failed to compare versions')
      )
    }
  }

  /**
   * Run scenario analysis (calculations + Claude analysis)
   */
  private async runScenarioAnalysis(
    scenarioInput: ScenarioInput,
    baseline: BaselineMetrics
  ): Promise<Result<any>> {
    try {
      // Calculate metrics
      const calculator = new ScenarioCalculator()
      const calculatedMetrics = calculator.calculate(scenarioInput, baseline)

      // Get Claude analysis
      const analysisResult = await analyzeScenarioWithClaude(
        scenarioInput,
        calculatedMetrics,
        baseline
      )

      return ok({
        scenarioInput,
        calculatedMetrics,
        claudeAnalysis: analysisResult.success ? analysisResult.value : null,
        baseline,
      })
    } catch (error) {
      return err(
        error instanceof Error ? error : new Error('Scenario analysis failed')
      )
    }
  }

  /**
   * Handle different types of conversation responses
   */
  private async handleConversationResponse(
    parsed: any,
    conversationState: ConversationState,
    baseline: BaselineMetrics
  ): Promise<Result<ConversationResponse>> {
    // Check response type
    if (parsed.needsClarification) {
      return ok({
        type: 'clarification',
        message: this.formatClarificationMessage(parsed),
        data: parsed,
        needsUserInput: true,
        suggestedActions: parsed.questions,
      })
    }

    if (parsed.scenarioParameters) {
      // Ready to analyze
      const analysisResult = await this.runScenarioAnalysis(
        parsed.scenarioParameters,
        baseline
      )

      if (!analysisResult.success) {
        return err(analysisResult.error)
      }

      return ok({
        type: 'analysis',
        message: parsed.message || 'Analysis complete. Review the results below.',
        data: analysisResult.value,
        needsUserInput: false,
        suggestedActions: [
          'Refine scenario parameters',
          'Explore alternative scenarios',
          'Compare with different approach',
        ],
      })
    }

    if (parsed.suggestions || parsed.alternativeScenarios) {
      // Refinement suggestions
      return ok({
        type: 'refinement',
        message: 'Here are some suggestions to improve your scenario:',
        data: parsed,
        needsUserInput: false,
        suggestedActions: ['Apply suggested changes', 'Explore alternatives', 'Keep current scenario'],
      })
    }

    if (parsed.keyDifferences) {
      // Comparison results
      return ok({
        type: 'comparison',
        message: 'Here\'s a comparison of your scenario versions:',
        data: parsed,
        needsUserInput: false,
        suggestedActions: ['Choose a version', 'Create hybrid scenario', 'Run new scenario'],
      })
    }

    // Default: general response
    return ok({
      type: 'confirmation',
      message: parsed.message || parsed.content || 'Understood. What would you like to do next?',
      data: parsed,
      needsUserInput: true,
      suggestedActions: ['Run scenario', 'Modify parameters', 'Start over'],
    })
  }

  /**
   * Format clarification message for user
   */
  private formatClarificationMessage(clarification: ClarificationResponse): string {
    let message = 'I need some clarification to analyze this scenario:\n\n'

    clarification.questions.forEach((q, i) => {
      message += `${i + 1}. ${q}\n`
    })

    if (clarification.suggestedDefaults) {
      message += '\n**Smart defaults based on your data:**\n'
      Object.entries(clarification.suggestedDefaults).forEach(([key, value]) => {
        message += `- ${key}: ${value}\n`
      })
      message += '\nYou can accept these defaults or specify different values.'
    }

    return message
  }

  /**
   * Extract parameters from scenario input
   */
  private extractParameters(scenario: Partial<ScenarioInput>): Record<string, number> {
    const params: Record<string, number> = {}

    if ('pricingChange' in scenario) params.pricingChange = scenario.pricingChange as number
    if ('costChange' in scenario) params.costChange = scenario.costChange as number
    if ('targetMargin' in scenario) params.targetMargin = scenario.targetMargin as number
    if ('headcountChange' in scenario) params.headcountChange = scenario.headcountChange as number
    if ('avgSalaryCost' in scenario) params.avgSalaryCost = scenario.avgSalaryCost as number
    if ('churnRate' in scenario) params.churnRate = scenario.churnRate as number
    if ('acquisitionCount' in scenario) params.acquisitionCount = scenario.acquisitionCount as number
    if ('avgCustomerARR' in scenario) params.avgCustomerARR = scenario.avgCustomerARR as number

    return params
  }
}

// Singleton instance
let conversationManagerInstance: ScenarioConversationManager | null = null

export function getConversationManager(): ScenarioConversationManager {
  if (!conversationManagerInstance) {
    conversationManagerInstance = new ScenarioConversationManager()
  }
  return conversationManagerInstance
}
