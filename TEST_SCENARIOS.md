# AI Assistant Test Scenarios

## 🎯 Primary Test Scenario: High-Value Order Permission Error

### The Setup
```
┌─────────────────────────────────────────────────────────────┐
│ Application State                                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User Session:                                               │
│    • Role: "user"                                            │
│    • Permissions: ["view_orders", "create_order"]           │
│    • Missing: "approve_orders"                               │
│                                                              │
│  Business Rule (rule_1):                                     │
│    • Name: "High Value Order Approval"                       │
│    • Condition: order.amount > 200                           │
│    • Action: require_admin_approval                          │
│    • Required Permission: "approve_orders"                   │
│    • Enabled: ✓                                              │
│                                                              │
│  Feature Flags:                                              │
│    • enable_checkout: ✓ Enabled                              │
│    • require_admin_approval: ✓ Enabled                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### The Test Flow
```
┌──────────────────┐
│ 1. Create Order  │
│   Amount: $250   │  ← User enters high-value amount
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 2. Order Created │
│   Status: pending│  ← Order successfully created
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 3. Click Checkout│  ← User attempts to complete order
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│ 4. Business Rule Check                                   │
│   • amount ($250) > 200? ✓ YES                           │
│   • Required permission: "approve_orders"                │
│   • User has permission? ✗ NO                            │
│   • Result: BLOCK CHECKOUT                               │
└────────┬─────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│ 5. Failed Event Recorded                                 │
│   {                                                       │
│     eventType: "checkout_attempt",                       │
│     errorMessage: "User lacks permission...",            │
│     context: {                                            │
│       reason: "permission_denied",                       │
│       orderAmount: 250,                                   │
│       requiredPermissions: ["approve_orders"],           │
│       userPermissions: ["view_orders", "create_order"]   │
│     }                                                     │
│   }                                                       │
└────────┬─────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│ 6. AI Assistant (Auto Mode) Detects Failure             │
└────────┬─────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│ 7. Diagnostic Sequence                                   │
│   Step 1: get_app_state         ✓                        │
│   Step 2: get_failed_events     ✓                        │
│   Step 3: reproduce_bug         ✓                        │
│   Step 4: generate_bug_report   ✓                        │
└────────┬─────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│ 8. Diagnosis Report Generated                            │
│   • Severity: HIGH                                        │
│   • Root Cause: Missing "approve_orders" permission      │
│   • Affected: User Permissions, RBAC                     │
│   • Recommendation: Grant permission                      │
│   • Resolution Steps: 4-step guide                        │
└──────────────────────────────────────────────────────────┘
```

## 📋 Test Scenario Matrix

| Scenario | Order Amount | User Permission | Expected Outcome | AI Diagnosis |
|----------|--------------|-----------------|------------------|--------------|
| **Pass: Low Value** | $50 | view_orders, create_order | ✅ Checkout succeeds | N/A |
| **Pass: Medium Value** | $150 | view_orders, create_order | ✅ Checkout succeeds | N/A |
| **Pass: Threshold** | $200 | view_orders, create_order | ✅ Checkout succeeds | N/A |
| **Fail: Just Over** | $201 | view_orders, create_order | ❌ Permission denied | HIGH severity |
| **Fail: High Value** | $500 | view_orders, create_order | ❌ Permission denied | HIGH severity |
| **Pass: With Permission** | $500 | approve_orders | ✅ Checkout succeeds | N/A |

## 🔍 AI Diagnostic Logic

### Permission Error Analysis
```javascript
if (failedEvent.context.reason === 'permission_denied') {
  // AI identifies this as HIGH severity
  severity = 'high'
  
  // Extracts key context
  rootCause = `User role lacks required permissions`
  affectedComponents = ['User Permissions', 'RBAC']
  
  // Generates specific recommendation
  recommendation = `Grant the following permissions: ${missingPermissions}`
  
  // Provides step-by-step resolution
  resolutionSteps = [
    'Navigate to Admin Panel',
    'Add missing permissions',
    'Retry operation',
    'Verify success'
  ]
}
```

## 🎨 Visual Indicators in UI

### Before Error
```
┌─────────────────────────────────────┐
│ Orders Tab                          │
├─────────────────────────────────────┤
│ Test User                   pending │
│ test@test.com              $250.00  │
│                                     │
│                  [Checkout Button]  │ ← Clickable
└─────────────────────────────────────┘
```

### After Error
```
┌─────────────────────────────────────┐
│ Admin Panel → Failed Events         │
├─────────────────────────────────────┤
│ ⚠️  checkout_attempt                │
│ "User lacks permission to approve   │
│  high-value orders"                 │
│                                     │
│ Context:                            │
│ {                                   │
│   reason: "permission_denied",      │
│   orderAmount: 250,                 │
│   requiredPermissions: [...]        │
│ }                                   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ AI Assistant Tab                    │
├─────────────────────────────────────┤
│ Diagnostic Steps                    │
│ ✓ Analyzing application state...    │
│ ✓ Retrieving failed events...       │
│ ✓ Reproducing the issue...          │
│ ✓ Generating diagnostic report...   │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Issue Detected         [HIGH]   │ │
│ │ User lacks permission...        │ │
│ │                                 │ │
│ │ Root Cause:                     │ │
│ │ User role 'user' lacks required │ │
│ │ permissions: approve_orders     │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## 🧪 Advanced Testing

### Create Multiple Failures
```bash
Order 1: $250  → Checkout → Failed ❌
Order 2: $300  → Checkout → Failed ❌
Order 3: $500  → Checkout → Failed ❌

Result: 3 failed events in Admin Panel
        AI can diagnose each one
```

### Mixed Orders
```bash
Order 1: $99   → Checkout → Success ✓
Order 2: $250  → Checkout → Failed ❌
Order 3: $150  → Checkout → Success ✓
Order 4: $400  → Checkout → Failed ❌

Result: 2 failed events, 2 successful
        AI only diagnoses failures
```

## 📊 WebMCP Tool Outputs

### get_app_state
```json
{
  "orders": [...],
  "userSession": {
    "role": "user",
    "permissions": ["view_orders", "create_order"]
  },
  "businessRules": [...],
  "featureFlags": [...]
}
```

### get_failed_events
```json
{
  "failedEvents": [
    {
      "eventType": "checkout_attempt",
      "errorMessage": "User lacks permission...",
      "context": {
        "reason": "permission_denied",
        "requiredPermissions": ["approve_orders"]
      }
    }
  ]
}
```

### reproduce_bug
```json
{
  "status": "reproduced",
  "failedEvent": {...},
  "userContext": {
    "role": "user",
    "permissions": ["view_orders", "create_order"],
    "missingPermissions": ["approve_orders"]
  },
  "businessRulesViolated": ["rule_1"]
}
```

## 🎓 Understanding the Architecture

### Why This Error Occurs
1. **Business Rule**: Orders > $200 need approval
2. **Permission Check**: System requires "approve_orders" permission
3. **User State**: Current user only has basic permissions
4. **Result**: Checkout blocked, error recorded

### How AI Diagnoses It
1. **Detection**: Monitors failedEvents array
2. **Analysis**: Calls WebMCP tools to gather context
3. **Pattern Matching**: Identifies "permission_denied" reason
4. **Report Generation**: Produces actionable diagnosis

### The WebMCP Advantage
- **Traditional Debugging**: Inspect DOM, read console logs, search code
- **WebMCP Debugging**: Call structured tools, get rich context, automated analysis

---

## 🎯 Success Checklist

- [ ] Order created with amount > $200
- [ ] Checkout fails with permission error
- [ ] Error recorded in Failed Events (Admin Panel)
- [ ] AI Assistant detects failure (auto mode)
- [ ] 4 diagnostic steps complete
- [ ] Diagnosis report shows HIGH severity
- [ ] Root cause correctly identified
- [ ] Resolution steps provided
- [ ] Technical details displayed

**If all checked: Test successful! ✨**
