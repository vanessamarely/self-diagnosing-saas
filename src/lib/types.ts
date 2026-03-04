export interface Order {
  id: string
  customerName: string
  email: string
  amount: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: string
  items: string[]
}

export interface UserSession {
  userId: string
  userName: string
  role: 'admin' | 'user' | 'viewer'
  permissions: string[]
  loginTime: string
  sessionId: string
}

export interface FeatureFlag {
  name: string
  enabled: boolean
  description: string
  requiredPermission?: string
}

export interface BusinessRule {
  id: string
  name: string
  condition: string
  action: string
  priority: number
  enabled: boolean
}

export interface FailedEvent {
  id: string
  timestamp: string
  eventType: string
  errorMessage: string
  context: Record<string, unknown>
}

export interface AppState {
  orders: Order[]
  userSession: UserSession
  featureFlags: FeatureFlag[]
  businessRules: BusinessRule[]
  failedEvents: FailedEvent[]
}

export type WebMCPTool = 
  | 'get_app_state'
  | 'get_user_session'
  | 'get_business_rules'
  | 'get_failed_events'
  | 'reproduce_bug'
  | 'generate_bug_report'

export interface WebMCPToolResult {
  tool: WebMCPTool
  timestamp: string
  data: unknown
}

declare global {
  interface Navigator {
    modelContext?: {
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
  }
}

export {}

