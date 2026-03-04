import type { AppState, WebMCPToolResult, WebMCPTool } from './types'

type ToolFunction = (state: AppState) => unknown

const toolRegistry: Map<WebMCPTool, ToolFunction> = new Map()

export function registerTool(name: WebMCPTool, fn: ToolFunction) {
  toolRegistry.set(name, fn)
}

export function executeTool(name: WebMCPTool, state: AppState): WebMCPToolResult {
  const tool = toolRegistry.get(name)
  
  if (!tool) {
    throw new Error(`Tool ${name} not registered`)
  }

  const data = tool(state)
  
  return {
    tool: name,
    timestamp: new Date().toISOString(),
    data,
  }
}

export function initializeWebMCPTools() {
  registerTool('get_app_state', (state: AppState) => {
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
  })

  registerTool('get_user_session', (state: AppState) => {
    return state.userSession
  })

  registerTool('get_business_rules', (state: AppState) => {
    return state.businessRules
  })

  registerTool('get_failed_events', (state: AppState) => {
    return state.failedEvents
  })

  registerTool('reproduce_bug', (state: AppState) => {
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
  })

  registerTool('generate_bug_report', (state: AppState) => {
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
  })
}
