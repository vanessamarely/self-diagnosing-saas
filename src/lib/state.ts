import type { AppState, Order, FailedEvent } from './types'

export function createInitialState(): AppState {
  return {
    orders: [
      {
        id: '1',
        customerName: 'Alice Johnson',
        email: 'alice@example.com',
        amount: 149.99,
        status: 'completed',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        items: ['Pro Plan Subscription'],
      },
      {
        id: '2',
        customerName: 'Bob Smith',
        email: 'bob@example.com',
        amount: 299.99,
        status: 'pending',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        items: ['Enterprise Plan', 'Premium Support'],
      },
      {
        id: '3',
        customerName: 'Carol Williams',
        email: 'carol@example.com',
        amount: 79.99,
        status: 'processing',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        items: ['Basic Plan'],
      },
    ],
    userSession: {
      userId: 'user_123',
      userName: 'Demo User',
      role: 'user',
      permissions: ['view_orders', 'create_order'],
      loginTime: new Date().toISOString(),
      sessionId: 'session_' + Math.random().toString(36).substr(2, 9),
    },
    featureFlags: [
      {
        name: 'enable_checkout',
        enabled: true,
        description: 'Allows users to complete checkout process',
      },
      {
        name: 'require_admin_approval',
        enabled: true,
        description: 'Requires admin approval for high-value orders',
        requiredPermission: 'approve_orders',
      },
      {
        name: 'enable_refunds',
        enabled: false,
        description: 'Allows processing refunds',
        requiredPermission: 'process_refunds',
      },
      {
        name: 'auto_approve_orders',
        enabled: true,
        description: 'Automatically approves orders under $100',
      },
    ],
    businessRules: [
      {
        id: 'rule_1',
        name: 'High Value Order Approval',
        condition: 'order.amount > 200',
        action: 'require_admin_approval',
        priority: 1,
        enabled: true,
      },
      {
        id: 'rule_2',
        name: 'Auto Approve Small Orders',
        condition: 'order.amount <= 100',
        action: 'auto_approve',
        priority: 2,
        enabled: true,
      },
      {
        id: 'rule_3',
        name: 'Block Checkout Without Payment',
        condition: 'checkout.payment_method == null',
        action: 'block_checkout',
        priority: 1,
        enabled: true,
      },
    ],
    failedEvents: [],
  }
}

export function recordFailedEvent(
  state: AppState,
  eventType: string,
  errorMessage: string,
  context: Record<string, unknown>
): FailedEvent {
  const failedEvent: FailedEvent = {
    id: 'event_' + Date.now(),
    timestamp: new Date().toISOString(),
    eventType,
    errorMessage,
    context,
  }
  
  state.failedEvents.push(failedEvent)
  return failedEvent
}

export function generateNewOrder(customerName: string, email: string, amount: number, items: string[]): Order {
  return {
    id: 'order_' + Date.now(),
    customerName,
    email,
    amount,
    status: 'pending',
    createdAt: new Date().toISOString(),
    items,
  }
}
