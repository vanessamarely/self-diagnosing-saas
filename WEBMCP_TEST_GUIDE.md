# WebMCP Tools Testing Guide

This guide will help you verify that all 6 WebMCP tools are working correctly in your browser.

## Quick Start

Open the browser console (F12 or Cmd+Option+I) and follow the tests below.

## Prerequisites

1. Navigate to the application in your browser
2. Open the browser Developer Console (F12)
3. Ensure the application has loaded completely

## WebMCP Status Check

First, check if WebMCP is available:

```javascript
// Check WebMCP availability
window.webMCP

// Expected output:
// {
//   tools: { list: ƒ, call: ƒ },
//   isSupported: true/false,
//   usingPolyfill: true/false
// }
```

### Understanding the Status

- **isSupported: true** → Native `navigator.modelContext` API is available
- **isSupported: false, usingPolyfill: true** → Using fallback implementation

## List All Available Tools

```javascript
// List all registered tools
window.webMCP.tools.list()

// Expected output: Array of 6 tools
// Each tool has: name, description, inputSchema, handler
```

You should see these 6 tools:
1. `get_app_state`
2. `get_user_session`
3. `get_business_rules`
4. `get_failed_events`
5. `reproduce_bug`
6. `generate_bug_report`

## Test Each Tool

### Test 1: get_app_state

```javascript
window.webMCP.tools.call('get_app_state')
```

**Expected Output:**
```json
{
  "ordersCount": 3,
  "ordersByStatus": {
    "pending": 2,
    "completed": 1
  },
  "activeFeatureFlags": ["enable_checkout", ...],
  "activeBusinessRules": 2,
  "failedEventsCount": 0,
  "userRole": "user",
  "userPermissions": ["view_orders", "create_orders"]
}
```

**✅ Success Criteria:** Returns object with order counts, feature flags, and user role

---

### Test 2: get_user_session

```javascript
window.webMCP.tools.call('get_user_session')
```

**Expected Output:**
```json
{
  "userId": "user_12345",
  "userName": "Demo User",
  "role": "user",
  "permissions": ["view_orders", "create_orders"],
  "loginTime": "2025-01-15T10:30:00.000Z",
  "sessionId": "session_abc123"
}
```

**✅ Success Criteria:** Returns complete user session information

---

### Test 3: get_business_rules

```javascript
window.webMCP.tools.call('get_business_rules')
```

**Expected Output:**
```json
[
  {
    "id": "rule_1",
    "name": "High Value Order Approval",
    "condition": "order.amount > 200",
    "action": "require_admin_approval",
    "priority": 1,
    "enabled": true
  },
  {
    "id": "rule_2",
    "name": "Discount Eligibility",
    "condition": "customer.tier === 'premium'",
    "action": "apply_discount",
    "priority": 2,
    "enabled": true
  }
]
```

**✅ Success Criteria:** Returns array of business rules with conditions and actions

---

### Test 4: get_failed_events

```javascript
window.webMCP.tools.call('get_failed_events')
```

**Expected Output (if no failures yet):**
```json
[]
```

**Expected Output (after triggering a failure):**
```json
[
  {
    "id": "evt_abc123",
    "timestamp": "2025-01-15T10:35:22.000Z",
    "eventType": "checkout_attempt",
    "errorMessage": "User lacks permission to approve high-value orders",
    "context": {
      "reason": "permission_denied",
      "orderId": "ord_123",
      "orderAmount": 250,
      "affectedRules": ["rule_1"],
      "affectedFlags": ["require_admin_approval"],
      "requiredPermissions": ["approve_orders"],
      "userPermissions": ["view_orders", "create_orders"]
    }
  }
]
```

**✅ Success Criteria:** Returns array of failed events (empty if no failures)

---

### Test 5: reproduce_bug

First, trigger a bug by:
1. Go to "Create Order" tab
2. Create an order with amount > $200 (e.g., $250)
3. Go to "Orders" tab
4. Click "Checkout" on the high-value order
5. This should fail due to permission mismatch

Then test:

```javascript
window.webMCP.tools.call('reproduce_bug')
```

**Expected Output (if no bugs):**
```json
{
  "status": "no_bugs_found",
  "message": "No failed events to reproduce"
}
```

**Expected Output (after failure):**
```json
{
  "status": "reproduced",
  "failedEvent": {
    "id": "evt_abc123",
    "timestamp": "2025-01-15T10:35:22.000Z",
    "eventType": "checkout_attempt",
    "errorMessage": "User lacks permission to approve high-value orders",
    "context": { ... }
  },
  "conflictingRules": [
    {
      "id": "rule_1",
      "name": "High Value Order Approval",
      "condition": "order.amount > 200",
      "action": "require_admin_approval",
      "priority": 1,
      "enabled": true
    }
  ],
  "conflictingFlags": [],
  "userContext": {
    "role": "user",
    "permissions": ["view_orders", "create_orders"],
    "missingPermissions": ["approve_orders"]
  },
  "reproductionSteps": [
    "1. User with role 'user' attempted action",
    "2. Action required permissions: approve_orders",
    "3. User has permissions: view_orders, create_orders",
    "4. Business rules evaluated: High Value Order Approval",
    "5. Feature flags checked: ",
    "6. Result: User lacks permission to approve high-value orders"
  ]
}
```

**✅ Success Criteria:** Reproduces last failure with full context and steps

---

### Test 6: generate_bug_report

```javascript
window.webMCP.tools.call('generate_bug_report')
```

**Expected Output (after failures):**
```json
{
  "summary": {
    "totalFailures": 1,
    "recentFailures": 1,
    "failureTypes": {
      "checkout_attempt": 1
    }
  },
  "rootCauses": [
    {
      "type": "Permission Mismatch",
      "count": 1,
      "description": "User role 'user' lacks required permissions",
      "affectedActions": ["checkout_attempt"],
      "solution": "Grant permissions: approve_orders"
    }
  ],
  "recommendations": [
    "Review user permissions and align with role requirements",
    "Audit feature flag combinations for conflicts",
    "Establish clear business rule priority hierarchy",
    "Add validation to prevent conflicting configurations"
  ]
}
```

**✅ Success Criteria:** Generates comprehensive report with root causes and recommendations

---

## Complete Test Sequence

Run all tests in sequence:

```javascript
// Run all 6 tools in sequence
const tools = [
  'get_app_state',
  'get_user_session', 
  'get_business_rules',
  'get_failed_events',
  'reproduce_bug',
  'generate_bug_report'
];

tools.forEach(tool => {
  console.log(`\n========== ${tool} ==========`);
  console.log(window.webMCP.tools.call(tool));
});
```

## Testing Native vs Polyfill Mode

### Check Current Mode

```javascript
if (window.webMCP.isSupported) {
  console.log('✅ Native WebMCP: navigator.modelContext is available');
} else {
  console.log('⚠️ Polyfill Mode: Using window.webMCP fallback');
}
```

### Testing Native API (if supported)

If `isSupported` is true, the tools are also registered via `navigator.modelContext.provideContext()` and can be accessed by AI agents and browser extensions that support the WebMCP standard.

## Expected Console Output on Load

When the page loads, you should see:

**Native Mode (if supported):**
```
[WebMCP Native] ✓ All tools registered via navigator.modelContext.provideContext
[WebMCP Native] ✓ Registered tools: (6) ['get_app_state', 'get_user_session', 'get_business_rules', 'get_failed_events', 'reproduce_bug', 'generate_bug_report']
```

**Polyfill Mode:**
```
[WebMCP Polyfill] navigator.modelContext.provideContext not available
[WebMCP Polyfill] Using fallback window.webMCP interface
[WebMCP Polyfill] Registered tools: (6) ['get_app_state', 'get_user_session', 'get_business_rules', 'get_failed_events', 'reproduce_bug', 'generate_bug_report']
[WebMCP Polyfill] Try: window.webMCP.tools.list()
```

## Troubleshooting

### Issue: `window.webMCP is undefined`

**Solution:** Wait for the page to fully load, then refresh and try again.

### Issue: Tool returns error

**Solution:** Check that you've interacted with the app (created orders, attempted checkouts) to generate state.

### Issue: `reproduce_bug` returns "no_bugs_found"

**Solution:** You need to trigger a bug first:
1. Create an order with amount > $200
2. Try to checkout that order
3. The permission check will fail
4. Now run `reproduce_bug`

### Issue: Tools return empty arrays

**Solution:** The app starts with minimal state. Create some orders and trigger actions to populate data.

## Verification Checklist

Use this checklist to verify all tools work:

- [ ] `window.webMCP` is defined
- [ ] `window.webMCP.tools.list()` returns 6 tools
- [ ] ✅ `get_app_state` returns state summary
- [ ] ✅ `get_user_session` returns user info
- [ ] ✅ `get_business_rules` returns rules array
- [ ] ✅ `get_failed_events` returns events (or empty array)
- [ ] ✅ `reproduce_bug` reproduces last failure (after triggering one)
- [ ] ✅ `generate_bug_report` generates comprehensive report
- [ ] Console shows WebMCP initialization message
- [ ] No JavaScript errors in console

## Advanced: Testing with Parameters

While these tools don't require parameters, the infrastructure supports them:

```javascript
// Example of calling a tool with parameters (if the tool supported them)
window.webMCP.tools.call('hypothetical_tool', { 
  param1: 'value1',
  param2: 123 
})
```

## Integration Testing

To test the full debugging workflow:

1. **Create baseline state**
   ```javascript
   window.webMCP.tools.call('get_app_state')
   ```

2. **Trigger a failure** (UI: Create $250 order and checkout)

3. **Detect the failure**
   ```javascript
   window.webMCP.tools.call('get_failed_events')
   ```

4. **Reproduce with context**
   ```javascript
   window.webMCP.tools.call('reproduce_bug')
   ```

5. **Generate report**
   ```javascript
   window.webMCP.tools.call('generate_bug_report')
   ```

6. **Verify fix recommendations** (Check the `solution` field in the bug report)

---

## Summary

All 6 WebMCP tools should work in both Native and Polyfill mode. The polyfill ensures compatibility even without native browser support, making the tools universally accessible via `window.webMCP.tools.call()`.
