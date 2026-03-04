import type { AppState, WebMCPToolResult, WebMCPTool } from './types'

interface WebMCPToolDefinition {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties?: Record<string, unknown>
    required?: string[]
  }
  handler: (args: Record<string, unknown>) => unknown
}

interface ModelContextAPI {
  provideContext(tool: {
    name: string
    description: string
    inputSchema: {
      type: string
      properties?: Record<string, unknown>
      required?: string[]
    }
    handler: (args: Record<string, unknown>) => unknown | Promise<unknown>
  }): void
}

interface NavigatorWithModelContext extends Navigator {
  modelContext?: ModelContextAPI
}

interface WebMCPInterface {
  tools: {
    list: () => WebMCPToolDefinition[]
    call: (name: string, args?: Record<string, unknown>) => unknown
  }
  isSupported: boolean
  usingPolyfill: boolean
}

let appStateRef: AppState | null = null
const toolDefinitions: WebMCPToolDefinition[] = []

export function setAppState(state: AppState) {
  appStateRef = state
}

function isWebMCPSupported(): boolean {
  return typeof window !== 'undefined' && 
         'navigator' in window && 
         'modelContext' in (window.navigator as NavigatorWithModelContext) &&
         typeof (window.navigator as NavigatorWithModelContext).modelContext?.provideContext === 'function'
}

function registerWebMCPTool(definition: WebMCPToolDefinition) {
  const existingIndex = toolDefinitions.findIndex(t => t.name === definition.name)
  if (existingIndex >= 0) {
    toolDefinitions[existingIndex] = definition
  } else {
    toolDefinitions.push(definition)
  }

  if (typeof window !== 'undefined') {
    const nav = window.navigator as NavigatorWithModelContext
    
    if (isWebMCPSupported() && nav.modelContext) {
      nav.modelContext.provideContext({
        name: definition.name,
        description: definition.description,
        inputSchema: definition.inputSchema,
        handler: definition.handler
      })
      console.log(`[WebMCP Native] Registered tool: ${definition.name}`)
    }
  }
}

export function executeTool(name: WebMCPTool, state: AppState): WebMCPToolResult {
  setAppState(state)
  
  const tool = toolDefinitions.find(t => t.name === name)
  
  if (!tool) {
    throw new Error(`Tool ${name} not registered`)
  }

  const data = tool.handler({})
  
  return {
    tool: name,
    timestamp: new Date().toISOString(),
    data,
  }
}

export function initializeWebMCPTools() {
  registerWebMCPTool({
    name: 'get_app_state',
    description: 'Get overall application state summary including orders, feature flags, business rules, and user context',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    },
    handler: () => {
      if (!appStateRef) throw new Error('App state not initialized')
      const state = appStateRef
      return {
        ordersCount: state.orders.length,
        ordersByStatus: state.orders.reduce((acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        activeFeatureFlags: state.featureFlags.filter(f => f.enabled).map(f => f.name),
        activeBusinessRules: state.businessRules.filter(r => r.enabled).length,
        failedEventsCount: state.failedEvents.length,
        userRole: state.userSession.role,
        userPermissions: state.userSession.permissions,
      }
    }
  })

  registerWebMCPTool({
    name: 'get_user_session',
    description: 'Get current user session details including role and permissions',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    },
    handler: () => {
      if (!appStateRef) throw new Error('App state not initialized')
      return appStateRef.userSession
    }
  })

  registerWebMCPTool({
    name: 'get_business_rules',
    description: 'Get all business rules with their conditions, actions, and priorities',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    },
    handler: () => {
      if (!appStateRef) throw new Error('App state not initialized')
      return appStateRef.businessRules
    }
  })

  registerWebMCPTool({
    name: 'get_failed_events',
    description: 'Get all failed events with full context and error messages',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    },
    handler: () => {
      if (!appStateRef) throw new Error('App state not initialized')
      return appStateRef.failedEvents
    }
  })

  registerWebMCPTool({
    name: 'reproduce_bug',
    description: 'Reproduce the last failed event with full context including conflicting rules, flags, and missing permissions',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    },
    handler: () => {
      if (!appStateRef) throw new Error('App state not initialized')
      const state = appStateRef
      const lastFailedEvent = state.failedEvents[state.failedEvents.length - 1]
      
      if (!lastFailedEvent) {
        return {
          status: 'no_bugs_found',
          message: 'No failed events to reproduce',
        }
      }

      const affectedRules = (lastFailedEvent.context.affectedRules as string[] | undefined) || []
      const affectedFlags = (lastFailedEvent.context.affectedFlags as string[] | undefined) || []
      
      const relevantRules = state.businessRules.filter(rule => 
        rule.enabled && affectedRules.includes(rule.id)
      )

      const relevantFlags = state.featureFlags.filter(flag =>
        affectedFlags.includes(flag.name)
      )

      return {
        status: 'reproduced',
        failedEvent: lastFailedEvent,
        conflictingRules: relevantRules,
        conflictingFlags: relevantFlags,
        userContext: {
          role: state.userSession.role,
          permissions: state.userSession.permissions,
          missingPermissions: ((lastFailedEvent.context.requiredPermissions as string[] | undefined) || []).filter(
            (perm: string) => !state.userSession.permissions.includes(perm)
          ),
        },
        reproductionSteps: [
          `1. User with role '${state.userSession.role}' attempted action`,
          `2. Action required permissions: ${((lastFailedEvent.context.requiredPermissions as string[] | undefined) || []).join(', ') || 'none'}`,
          `3. User has permissions: ${state.userSession.permissions.join(', ')}`,
          `4. Business rules evaluated: ${relevantRules.map(r => r.name).join(', ')}`,
          `5. Feature flags checked: ${relevantFlags.map(f => f.name).join(', ')}`,
          `6. Result: ${lastFailedEvent.errorMessage}`,
        ],
      }
    }
  })

  registerWebMCPTool({
    name: 'generate_bug_report',
    description: 'Generate comprehensive bug report with root cause analysis and recommendations',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    },
    handler: () => {
      if (!appStateRef) throw new Error('App state not initialized')
      const state = appStateRef
      const recentFailures = state.failedEvents.slice(-5)
      
      const failuresByType = recentFailures.reduce((acc, event) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const conflictingRules = state.businessRules.filter(rule => {
        return recentFailures.some(event => {
          const affectedRules = (event.context.affectedRules as string[] | undefined) || []
          return affectedRules.includes(rule.id)
        })
      })

      const permissionIssues = recentFailures.filter(event =>
        event.context.reason === 'permission_denied'
      )

      const featureFlagIssues = recentFailures.filter(event =>
        event.context.reason === 'feature_flag_conflict'
      )

      return {
        summary: {
          totalFailures: state.failedEvents.length,
          recentFailures: recentFailures.length,
          failureTypes: failuresByType,
        },
        rootCauses: [
          permissionIssues.length > 0 && {
            type: 'Permission Mismatch',
            count: permissionIssues.length,
            description: `User role '${state.userSession.role}' lacks required permissions`,
            affectedActions: permissionIssues.map(e => e.eventType),
            solution: `Grant permissions: ${[...new Set(permissionIssues.flatMap(e => e.context.requiredPermissions || []))].join(', ')}`,
          },
          featureFlagIssues.length > 0 && {
            type: 'Feature Flag Conflict',
            count: featureFlagIssues.length,
            description: 'Conflicting feature flags creating undefined behavior',
            affectedFlags: [...new Set(featureFlagIssues.flatMap(e => e.context.affectedFlags || []))],
            solution: 'Review and resolve conflicting flag combinations',
          },
          conflictingRules.length > 0 && {
            type: 'Business Rule Conflict',
            count: conflictingRules.length,
            description: 'Multiple business rules with conflicting actions',
            conflictingRules: conflictingRules.map(r => ({
              id: r.id,
              name: r.name,
              condition: r.condition,
              action: r.action,
            })),
            solution: 'Adjust rule priorities or conditions to eliminate conflicts',
          },
        ].filter(Boolean),
        recommendations: [
          'Review user permissions and align with role requirements',
          'Audit feature flag combinations for conflicts',
          'Establish clear business rule priority hierarchy',
          'Add validation to prevent conflicting configurations',
        ],
      }
    }
  })

  if (typeof window !== 'undefined') {
    const supported = isWebMCPSupported()
    
    const webMCP: WebMCPInterface = {
      tools: {
        list: () => toolDefinitions,
        call: (name: string, args: Record<string, unknown> = {}) => {
          const tool = toolDefinitions.find(t => t.name === name)
          if (!tool) throw new Error(`Tool ${name} not found`)
          return tool.handler(args)
        }
      },
      isSupported: supported,
      usingPolyfill: !supported
    };

    (window as unknown as { webMCP: WebMCPInterface }).webMCP = webMCP
    
    if (supported) {
      console.log('[WebMCP Native] All tools registered via navigator.modelContext.provideContext')
      console.log('[WebMCP Native] Registered tools:', toolDefinitions.map(t => t.name))
    } else {
      console.warn('[WebMCP Polyfill] navigator.modelContext.provideContext not available')
      console.warn('[WebMCP Polyfill] Using fallback window.webMCP interface')
      console.log('[WebMCP Polyfill] Registered tools:', toolDefinitions.map(t => t.name))
      console.log('[WebMCP Polyfill] Try: window.webMCP.tools.list()')
    }
  }
}
