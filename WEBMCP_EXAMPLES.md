# WebMCP Browser Console Examples

This file contains examples of how to interact with the WebMCP API directly from your browser's developer console.

## Open the Browser Console

1. Open the app in your browser
2. Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows/Linux)
3. Go to the "Console" tab
4. Try the commands below!

## Basic WebMCP API Usage

### List all available tools

```javascript
window.webMCP.tools.list()
```

This returns an array of all registered WebMCP tools with their descriptions and schemas:

```javascript
[
  {
    name: 'get_app_state',
    description: 'Get overall application state summary including orders, feature flags, business rules, and user context',
    inputSchema: { type: 'object', properties: {}, required: [] },
    handler: [Function]
  },
  // ... more tools
]
```

### Call a specific tool

```javascript
window.webMCP.tools.call('get_app_state')
```

Returns:
```javascript
{
  ordersCount: 3,
  ordersByStatus: { completed: 1, pending: 1, processing: 1 },
  activeFeatureFlags: ['enable_checkout', 'require_admin_approval', 'auto_approve_orders'],
  activeBusinessRules: 3,
  failedEventsCount: 0,
  userRole: 'user',
  userPermissions: ['view_orders', 'create_order']
}
```

## Debugging Workflow Example

### Step 1: Check the current user session

```javascript
window.webMCP.tools.call('get_user_session')
```

Returns:
```javascript
{
  userId: 'user_123',
  userName: 'Demo User',
  role: 'user',
  permissions: ['view_orders', 'create_order'],
  loginTime: '2025-01-11T10:30:00.000Z',
  sessionId: 'session_abc123'
}
```

### Step 2: Check business rules

```javascript
window.webMCP.tools.call('get_business_rules')
```

Returns:
```javascript
[
  {
    id: 'rule_1',
    name: 'High Value Order Approval',
    condition: 'order.amount > 200',
    action: 'require_admin_approval',
    priority: 1,
    enabled: true
  },
  {
    id: 'rule_2',
    name: 'Auto Approve Small Orders',
    condition: 'order.amount <= 100',
    action: 'auto_approve',
    priority: 2,
    enabled: true
  },
  {
    id: 'rule_3',
    name: 'Block Checkout Without Payment',
    condition: 'checkout.payment_method == null',
    action: 'block_checkout',
    priority: 1,
    enabled: true
  }
]
```

### Step 3: Trigger a bug (in the UI)

1. In the UI, click "Admin" button
2. Change user role to "Guest"
3. Try to create a new order
4. You'll see a "Permission denied" error

### Step 4: Check failed events

```javascript
window.webMCP.tools.call('get_failed_events')
```

Returns:
```javascript
[
  {
    id: 'event_1234567890',
    timestamp: '2025-01-11T10:35:00.000Z',
    eventType: 'create_order',
    errorMessage: 'Permission denied: User lacks create_order permission',
    context: {
      reason: 'permission_denied',
      requiredPermissions: ['create_order'],
      userPermissions: ['view_orders'],
      attemptedAction: 'create_order'
    }
  }
]
```

### Step 5: Reproduce the bug with full context

```javascript
window.webMCP.tools.call('reproduce_bug')
```

Returns:
```javascript
{
  status: 'reproduced',
  failedEvent: {
    id: 'event_1234567890',
    timestamp: '2025-01-11T10:35:00.000Z',
    eventType: 'create_order',
    errorMessage: 'Permission denied: User lacks create_order permission',
    context: { /* ... */ }
  },
  conflictingRules: [],
  conflictingFlags: [],
  userContext: {
    role: 'guest',
    permissions: ['view_orders'],
    missingPermissions: ['create_order']
  },
  reproductionSteps: [
    "1. User with role 'guest' attempted action",
    "2. Action required permissions: create_order",
    "3. User has permissions: view_orders",
    "4. Business rules evaluated: ",
    "5. Feature flags checked: ",
    "6. Result: Permission denied: User lacks create_order permission"
  ]
}
```

### Step 6: Generate a comprehensive bug report

```javascript
window.webMCP.tools.call('generate_bug_report')
```

Returns:
```javascript
{
  summary: {
    totalFailures: 1,
    recentFailures: 1,
    failureTypes: { create_order: 1 }
  },
  rootCauses: [
    {
      type: 'Permission Mismatch',
      count: 1,
      description: "User role 'guest' lacks required permissions",
      affectedActions: ['create_order'],
      solution: 'Grant permissions: create_order'
    }
  ],
  recommendations: [
    'Review user permissions and align with role requirements',
    'Audit feature flag combinations for conflicts',
    'Establish clear business rule priority hierarchy',
    'Add validation to prevent conflicting configurations'
  ]
}
```

## Advanced Scenario: Complex Business Rule Conflict

### Trigger the complex bug:

1. In UI: Click "Admin" → Keep role as "User"
2. In UI: Create a new order with amount > $200 (e.g., $250)
3. In UI: Try to checkout that order
4. You'll see: "Permission denied: High-value orders require admin approval"

### Investigate with WebMCP:

```javascript
// Check what went wrong
window.webMCP.tools.call('reproduce_bug')
```

Returns detailed analysis:
```javascript
{
  status: 'reproduced',
  failedEvent: {
    eventType: 'checkout',
    errorMessage: 'Conflict: Order requires admin approval but user lacks approval permission...',
    context: {
      reason: 'permission_denied',
      affectedRules: ['rule_1'],
      affectedFlags: ['require_admin_approval', 'auto_approve_orders'],
      requiredPermissions: ['approve_orders'],
      userPermissions: ['view_orders', 'create_order'],
      orderAmount: 250,
      orderId: 'order_xxx',
      conflictDescription: 'High-value order ($250) requires admin approval, but user role "user" lacks approval permission. Auto-approve flag is enabled but conflicts with manual approval requirement.'
    }
  },
  conflictingRules: [
    {
      id: 'rule_1',
      name: 'High Value Order Approval',
      condition: 'order.amount > 200',
      action: 'require_admin_approval',
      priority: 1,
      enabled: true
    }
  ],
  conflictingFlags: [
    { name: 'require_admin_approval', enabled: true, description: 'Requires admin approval for high-value orders' },
    { name: 'auto_approve_orders', enabled: true, description: 'Automatically approves orders under $100' }
  ],
  userContext: {
    role: 'user',
    permissions: ['view_orders', 'create_order'],
    missingPermissions: ['approve_orders']
  },
  reproductionSteps: [
    "1. User with role 'user' attempted action",
    "2. Action required permissions: approve_orders",
    "3. User has permissions: view_orders, create_order",
    "4. Business rules evaluated: High Value Order Approval",
    "5. Feature flags checked: require_admin_approval, auto_approve_orders",
    "6. Result: Conflict: Order requires admin approval but user lacks approval permission..."
  ]
}
```

## What Makes This Different from Traditional Debugging?

### Traditional approach (without WebMCP):

```javascript
// You can only see DOM elements:
document.querySelector('.error')?.textContent
// "Permission denied: High-value orders require admin approval"

// You might have some console logs:
console.log('Checkout failed')

// But you have NO IDEA:
// - What the actual threshold is for "high-value"
// - What permissions the user has
// - What permissions are required
// - Why auto-approve didn't work
// - What business rules are in conflict
// - What feature flags are enabled
```

### WebMCP approach:

```javascript
// One command reveals EVERYTHING:
window.webMCP.tools.call('reproduce_bug')

// Returns:
// - Exact threshold: order.amount > 200
// - User has: ['view_orders', 'create_order']
// - User needs: ['approve_orders']
// - Conflicting rules: rule_1 (High Value Order Approval)
// - Conflicting flags: require_admin_approval=true, auto_approve_orders=true
// - Step-by-step reproduction
// - Suggested solutions
```

## For AI Agents

An AI debugging agent would interact with this API programmatically:

```javascript
// Agent workflow:
async function diagnoseIssue() {
  // 1. Check if there are any failures
  const failedEvents = await window.webMCP.tools.call('get_failed_events')
  
  if (failedEvents.length === 0) {
    return "No issues detected"
  }
  
  // 2. Reproduce the last bug with full context
  const reproduction = await window.webMCP.tools.call('reproduce_bug')
  
  // 3. Generate comprehensive report
  const report = await window.webMCP.tools.call('generate_bug_report')
  
  // 4. Analyze and suggest fix
  if (reproduction.userContext.missingPermissions.length > 0) {
    return `Grant the user these permissions: ${reproduction.userContext.missingPermissions.join(', ')}`
  }
  
  if (reproduction.conflictingFlags.length > 1) {
    return `Resolve conflicting feature flags: ${reproduction.conflictingFlags.map(f => f.name).join(', ')}`
  }
  
  return report.recommendations[0]
}

// Run the diagnosis
diagnoseIssue().then(console.log)
```

## Try It Yourself!

1. Open the app in your browser
2. Open the developer console (F12)
3. Run: `window.webMCP.tools.list()`
4. Trigger some bugs in the UI
5. Run: `window.webMCP.tools.call('generate_bug_report')`
6. See the magic! ✨

## WebMCP API Reference

```typescript
interface WebMCPInterface {
  tools: {
    // List all available tools
    list(): WebMCPToolDefinition[]
    
    // Call a specific tool by name
    call(name: string, args?: Record<string, unknown>): unknown
  }
}

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
```

---

**WebMCP transforms debugging from guesswork to data-driven diagnosis!**
