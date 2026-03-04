export type OrderStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface Order {
  id: string
  customerName: string
  email: string
  amount: number
  status: OrderStatus
  createdAt: string
  items: string[]
}

export interface UserSession {
  userId: string
  userName: string
  role: 'admin' | 'user' | 'guest'
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
  stackTrace?: string
}

export interface AppState {
  orders: Order[]
  userSession: UserSession
  featureFlags: FeatureFlag[]
  businessRules: BusinessRule[]
  failedEvents: FailedEvent[]
}

export interface WebMCPToolResult {
  tool: string
  timestamp: string
  data: unknown
}

export type WebMCPTool = 
  | 'get_app_state'
  | 'get_user_session'
  | 'get_business_rules'
  | 'get_failed_events'
  | 'reproduce_bug'
  | 'generate_bug_report'
