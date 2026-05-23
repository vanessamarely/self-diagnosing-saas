import type { AppState, WebMCPToolResult, WebMCPTool } from './types'

interface WebMCPToolDefinition {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties?: Record<string, unknown>
    required?: string[]
  }
  execute: (args: Record<string, unknown>) => Promise<{ content: Array<{ type: string; text: string }> }>
}

interface ModelContextAPI {
  provideContext(params: { tools: WebMCPToolDefinition[] }): void
}

interface NavigatorWithModelContext {
  modelContext?: ModelContextAPI
}

interface WebMCPInterface {
  tools: {
    list: () => Array<{
      name: string
      description: string
      inputSchema: {
        type: 'object'
        properties?: Record<string, unknown>
        required?: string[]
      }
    }>
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
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false
  }
  
  const nav = navigator as unknown as NavigatorWithModelContext
  return 'modelContext' in nav && 
         typeof nav.modelContext?.provideContext === 'function'
}

function registerWebMCPTool(definition: WebMCPToolDefinition) {
  const existingIndex = toolDefinitions.findIndex(t => t.name === definition.name)
  if (existingIndex >= 0) {
    toolDefinitions[existingIndex] = definition
  } else {
    toolDefinitions.push(definition)
  }
}

function syncWebMCPTools() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return
  }
  
  if (isWebMCPSupported()) {
    const nav = navigator as unknown as NavigatorWithModelContext
    
    try {
      nav.modelContext!.provideContext({
        tools: toolDefinitions
      })
      
      console.log('[WebMCP Native] ✓ All tools registered via navigator.modelContext.provideContext')
      console.log('[WebMCP Native] ✓ Registered tools:', toolDefinitions.map(t => t.name))
    } catch (error) {
      console.error('[WebMCP Native] ✗ Error registering tools:', error)
      console.error('[WebMCP Native] ✗ Error details:', error instanceof Error ? error.message : String(error))
    }
  }
}

export function executeTool(name: WebMCPTool, state: AppState): WebMCPToolResult {
  setAppState(state)
  
  const tool = toolDefinitions.find(t => t.name === name)
  
  if (!tool) {
    throw new Error(`Tool ${name} not registered`)
  }

  const resultPromise = tool.execute({})
  const data = resultPromise instanceof Promise ? 
    resultPromise.then(r => JSON.parse(r.content[0].text)) :
    resultPromise
  
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
    async execute() {
      if (!appStateRef) throw new Error('App state not initialized')
      const state = appStateRef
      const result = {
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
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result)
        }]
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
    async execute() {
      if (!appStateRef) throw new Error('App state not initialized')
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(appStateRef.userSession)
        }]
      }
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
    async execute() {
      if (!appStateRef) throw new Error('App state not initialized')
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(appStateRef.businessRules)
        }]
      }
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
    async execute() {
      if (!appStateRef) throw new Error('App state not initialized')
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(appStateRef.failedEvents)
        }]
      }
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
    async execute() {
      if (!appStateRef) throw new Error('App state not initialized')
      const state = appStateRef
      const lastFailedEvent = state.failedEvents[state.failedEvents.length - 1]
      
      if (!lastFailedEvent) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: 'no_bugs_found',
              message: 'No failed events to reproduce',
            })
          }]
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

      const result = {
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
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result)
        }]
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
    async execute() {
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

      const result = {
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
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result)
        }]
      }
    }
  })

  registerWebMCPTool({
    name: 'get_active_cart',
    description: 'Returns a structured JSON representing the current items, quantities, prices, and total cost in the user\'s shopping cart',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    },
    async execute() {
      if (!appStateRef) throw new Error('App state not initialized')
      const state = appStateRef
      
      const cartItems = state.orders
        .filter(order => order.status === 'pending')
        .map(order => ({
          orderId: order.id,
          customerName: order.customerName,
          email: order.email,
          items: order.items,
          quantity: order.items.length,
          price_usd: order.amount,
          createdAt: order.createdAt
        }))
      
      const total = cartItems.reduce((sum, item) => sum + item.price_usd, 0)
      
      const result = {
        items: cartItems,
        itemCount: cartItems.length,
        total_usd: total,
        currency: 'USD',
        timestamp: new Date().toISOString()
      }
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result)
        }]
      }
    }
  })

  registerWebMCPTool({
    name: 'add_item_to_cart',
    description: 'Adds a specific item to the shopping cart',
    inputSchema: {
      type: 'object',
      properties: {
        productId: {
          type: 'string',
          description: 'The unique identifier of the product to add'
        },
        quantity: {
          type: 'number',
          description: 'The quantity of the product to add (default: 1)'
        }
      },
      required: ['productId']
    },
    async execute(args) {
      if (!appStateRef) throw new Error('App state not initialized')
      
      const productId = args.productId as string
      const quantity = (args.quantity as number) || 1
      
      if (!productId) {
        throw new Error('productId is required')
      }
      
      const result = {
        success: true,
        message: `Item added successfully`,
        productId,
        quantity,
        timestamp: new Date().toISOString(),
        note: 'This is a demonstration tool. In a real implementation, this would trigger the application\'s addToCart action and update the cart state.'
      }
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result)
        }]
      }
    }
  })

  syncWebMCPTools()

  if (typeof window !== 'undefined') {
    const supported = isWebMCPSupported()
    
    const webMCP: WebMCPInterface = {
      tools: {
        list: () => toolDefinitions.map(t => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema
        })),
        call: async (name: string, args: Record<string, unknown> = {}) => {
          const tool = toolDefinitions.find(t => t.name === name)
          if (!tool) throw new Error(`Tool ${name} not found`)
          const result = await tool.execute(args)
          return JSON.parse(result.content[0].text)
        }
      },
      isSupported: supported,
      usingPolyfill: !supported
    };

    (window as unknown as { webMCP: WebMCPInterface }).webMCP = webMCP
    
    console.log('%c=== WebMCP Tools Ready ===', 'color: #6366f1; font-weight: bold; font-size: 14px;')
    
    if (supported) {
      console.log('%c✓ Native Mode', 'color: #10b981; font-weight: bold')
      console.log('Tools registered via navigator.modelContext.provideContext')
    } else {
      console.log('%c⚠ Polyfill Mode', 'color: #f59e0b; font-weight: bold')
      console.log('Using window.webMCP fallback (navigator.modelContext not available)')
    }
    
    console.log('\n%cRegistered Tools:', 'font-weight: bold')
    toolDefinitions.forEach((tool, i) => {
      console.log(`  ${i + 1}. ${tool.name}`)
    })
    
    console.log('\n%cQuick Start:', 'font-weight: bold; color: #6366f1')
    console.log('  window.webMCP.tools.list()              // List all tools')
    console.log('  window.webMCP.tools.call(\'get_app_state\')  // Call a tool')
    console.log('\n%cFor complete testing guide, see: WEBMCP_TEST_GUIDE.md', 'color: #6366f1; font-style: italic')
    console.log('%c=============================\n', 'color: #6366f1; font-weight: bold')
  }
}
