# WebMCP Tools Testing Guide

This guide will help you verify that all 8 WebMCP tools are working correctly in your browser.

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

// Expected output: Array of 8 tools
// Each tool has: name, description, inputSchema, handler
```

You should see these 8 tools:

### State & Session Tools
1. `get_app_state`
2. `get_user_session`

### Shopping Cart Tools (NEW!)
3. `get_active_cart`
4. `add_item_to_cart`

### Configuration Tools
5. `get_business_rules`

### Debugging Tools
6. `get_failed_events`
7. `reproduce_bug`
8. `generate_bug_report`

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

### Test 2: get_active_cart

```javascript
window.webMCP.tools.call('get_active_cart')
```

**Expected Output:**
```json
{
  "items": [
    {
      "orderId": "ord_1234567890",
      "customerName": "Alice",
      "email": "alice@test.com",
      "items": ["Custom Order"],
      "quantity": 1,
      "price_usd": 50,
      "createdAt": "2025-01-15T14:25:00.000Z"
    }
  ],
  "itemCount": 1,
  "total_usd": 50,
  "currency": "USD",
  "timestamp": "2025-01-15T14:30:00.000Z"
}
```

**✅ Success Criteria:** Returns cart with items array, itemCount, total_usd, and only includes pending orders

**Note:** Create some pending orders first using the "Create Order" tab to see items in the cart.

---

### Test 3: add_item_to_cart

```javascript
window.webMCP.tools.call('add_item_to_cart', {
  productId: 'prod_test_001',
  quantity: 2
})
```

**Expected Output:**
```json
{
  "success": true,
  "message": "Item added successfully",
  "productId": "prod_test_001",
  "quantity": 2,
  "timestamp": "2025-01-15T14:35:00.000Z",
  "note": "This is a demonstration tool. In a real implementation, this would trigger the application's addToCart action and update the cart state."
}
```

**✅ Success Criteria:** Returns success response with productId and quantity

**Note:** This is a demonstration tool that shows the API pattern. Use the "Create Order" UI to actually add items to cart.

---

### Test 4: get_user_session

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

### Test 5: get_business_rules

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

### Test 6: get_failed_events

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

### Test 7: reproduce_bug

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

### Test 8: generate_bug_report

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
// Run all 8 tools in sequence
const tools = [
  'get_app_state',
  'get_user_session',
  'get_active_cart',
  'add_item_to_cart',
  'get_business_rules',
  'get_failed_events',
  'reproduce_bug',
  'generate_bug_report'
];

// Test read-only tools
tools.filter(t => t !== 'add_item_to_cart').forEach(tool => {
  console.log(`\n========== ${tool} ==========`);
  console.log(window.webMCP.tools.call(tool));
});

// Test add_item_to_cart separately with parameters
console.log('\n========== add_item_to_cart ==========');
console.log(window.webMCP.tools.call('add_item_to_cart', {
  productId: 'test_prod_123',
  quantity: 3
}));
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
[WebMCP Native] ✓ Registered tools: (8) ['get_app_state', 'get_user_session', 'get_business_rules', 'get_failed_events', 'reproduce_bug', 'generate_bug_report', 'get_active_cart', 'add_item_to_cart']
```

**Polyfill Mode:**
```
[WebMCP Polyfill] navigator.modelContext.provideContext not available
[WebMCP Polyfill] Using fallback window.webMCP interface
[WebMCP Polyfill] Registered tools: (8) ['get_app_state', 'get_user_session', 'get_business_rules', 'get_failed_events', 'reproduce_bug', 'generate_bug_report', 'get_active_cart', 'add_item_to_cart']
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
- [ ] `window.webMCP.tools.list()` returns 8 tools
- [ ] ✅ `get_app_state` returns state summary
- [ ] ✅ `get_user_session` returns user info
- [ ] ✅ `get_active_cart` returns cart data
- [ ] ✅ `add_item_to_cart` accepts parameters and returns success
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

All 8 WebMCP tools should work in both Native and Polyfill mode. The polyfill ensures compatibility even without native browser support, making the tools universally accessible via `window.webMCP.tools.call()`.

## Additional Resources

For detailed testing of the shopping cart tools specifically, see: **SHOPPING_CART_TOOLS_TEST.md**

That guide includes:
- Detailed shopping cart tool testing scenarios
- UI testing procedures
- Integration tests with cart state
- Complete console test scripts
- Troubleshooting for cart-specific issues
